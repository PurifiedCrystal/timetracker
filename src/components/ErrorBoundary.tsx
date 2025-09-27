'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { LanguageError, LanguageErrorCode, errorHandler } from '../lib/utils/error-handling';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  language?: string;
  namespace?: string;
  maxRetries?: number;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private readonly maxRetries: number;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      retryCount: 0
    };
    this.maxRetries = props.maxRetries || 3;
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);

    // Create structured language error if needed
    let languageError: LanguageError;

    if (this.isLanguageError(error)) {
      languageError = error as LanguageError;
    } else {
      // Convert regular error to language error
      languageError = errorHandler.createError(
        LanguageErrorCode.LANGUAGE_SWITCH_FAILED,
        error.message,
        {
          componentStack: errorInfo.componentStack,
          language: this.props.language,
          namespace: this.props.namespace,
          originalError: error.name
        },
        'An error occurred while loading the interface'
      );
    }

    // Call error handler if provided
    this.props.onError?.(error, errorInfo);

    // Report to analytics if available
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: false,
        custom_map: {
          error_id: this.state.errorId,
          language: this.props.language,
          namespace: this.props.namespace
        }
      });
    }
  }

  private isLanguageError(error: Error): boolean {
    return 'code' in error && Object.values(LanguageErrorCode).includes((error as any).code);
  }

  private handleRetry = (): void => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorId: null,
        retryCount: prevState.retryCount + 1
      }));
    }
  };

  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null,
      retryCount: 0
    });
  };

  private getErrorMessage(): string {
    if (!this.state.error) return 'An unknown error occurred';

    if (this.isLanguageError(this.state.error)) {
      const langError = this.state.error as LanguageError;
      return langError.userMessage || langError.message;
    }

    return this.state.error.message;
  }

  private getErrorType(): 'critical' | 'recoverable' | 'warning' {
    if (!this.state.error) return 'critical';

    if (this.isLanguageError(this.state.error)) {
      const langError = this.state.error as LanguageError;
      return langError.recoverable ? 'recoverable' : 'critical';
    }

    // Classify based on error type
    if (this.state.error.name === 'ChunkLoadError') return 'recoverable';
    if (this.state.error.message.includes('network')) return 'recoverable';

    return 'critical';
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorType = this.getErrorType();
      const errorMessage = this.getErrorMessage();
      const canRetry = this.state.retryCount < this.maxRetries && errorType === 'recoverable';

      const getErrorIcon = () => {
        switch (errorType) {
          case 'warning':
            return '⚠️';
          case 'recoverable':
            return '🔄';
          case 'critical':
          default:
            return <AlertTriangle className="h-8 w-8 text-red-600" />;
        }
      };

      const getErrorColor = () => {
        switch (errorType) {
          case 'warning':
            return 'text-yellow-600';
          case 'recoverable':
            return 'text-blue-600';
          case 'critical':
          default:
            return 'text-red-600';
        }
      };

      const getBgColor = () => {
        switch (errorType) {
          case 'warning':
            return 'bg-yellow-100';
          case 'recoverable':
            return 'bg-blue-100';
          case 'critical':
          default:
            return 'bg-red-100';
        }
      };

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className={`w-16 h-16 ${getBgColor()} rounded-full flex items-center justify-center mx-auto mb-4`}>
              {typeof getErrorIcon() === 'string' ? (
                <span className="text-2xl">{getErrorIcon()}</span>
              ) : (
                getErrorIcon()
              )}
            </div>
            <h1 className={`text-xl font-semibold mb-2 ${getErrorColor()}`}>
              {errorType === 'warning' && 'Language Loading Warning'}
              {errorType === 'recoverable' && 'Language Loading Issue'}
              {errorType === 'critical' && 'Something went wrong'}
            </h1>
            <p className="text-gray-600 mb-4 text-sm">
              {errorMessage}
            </p>

            {this.props.language && this.props.namespace && (
              <div className="text-xs text-gray-500 mb-4 bg-gray-100 p-2 rounded">
                Language: {this.props.language} | Namespace: {this.props.namespace}
                {this.state.errorId && ` | Error ID: ${this.state.errorId}`}
              </div>
            )}

            <div className="flex gap-2 justify-center mb-4">
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
                >
                  Retry ({this.maxRetries - this.state.retryCount} left)
                </button>
              )}

              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm"
              >
                Reset
              </button>

              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorId: null, retryCount: 0 });
                  window.location.reload();
                }}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm flex items-center"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Reload
              </button>
            </div>

            {this.state.retryCount >= this.maxRetries && errorType === 'recoverable' && (
              <p className="text-xs text-gray-500 mb-4">
                Maximum retry attempts reached. Please reload the page or contact support if the problem persists.
              </p>
            )}

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-auto max-h-40">
                  {this.state.error.stack || this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export function withLanguageErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent: React.FC<P> = (props) => {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };

  WrappedComponent.displayName = `withLanguageErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Hook for error handling in functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
    console.error('Error handled by useErrorHandler:', error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  // Throw error to trigger error boundary
  if (error) {
    throw error;
  }

  return { handleError, clearError };
}

// Context for error reporting
export const ErrorReportingContext = React.createContext<{
  reportError: (error: Error, context?: Record<string, any>) => void;
}>({
  reportError: () => {}
});

export const ErrorReportingProvider: React.FC<{
  children: React.ReactNode;
  onError?: (error: Error, context?: Record<string, any>) => void;
}> = ({ children, onError }) => {
  const reportError = React.useCallback((error: Error, context?: Record<string, any>) => {
    console.error('Error reported:', error, context);
    onError?.(error, context);

    // Could also send to external error tracking service here
  }, [onError]);

  return (
    <ErrorReportingContext.Provider value={{ reportError }}>
      {children}
    </ErrorReportingContext.Provider>
  );
};

export const useErrorReporting = () => {
  const context = React.useContext(ErrorReportingContext);
  if (!context) {
    throw new Error('useErrorReporting must be used within ErrorReportingProvider');
  }
  return context;
};

export default ErrorBoundary;