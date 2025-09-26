/**
 * API endpoint for error monitoring
 * Receives error reports from the monitoring system
 */
import { NextRequest, NextResponse } from 'next/server';

interface ErrorReport {
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  userId?: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
}

// In-memory storage for development (use database in production)
const errorReports: ErrorReport[] = [];
const MAX_STORED_ERRORS = 1000;

export async function POST(request: NextRequest) {
  try {
    const errorReport: ErrorReport = await request.json();

    // Validate required fields
    if (!errorReport.message || !errorReport.timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields: message, timestamp' },
        { status: 400 }
      );
    }

    // Add to storage
    errorReports.unshift(errorReport);

    // Keep only the most recent errors
    if (errorReports.length > MAX_STORED_ERRORS) {
      errorReports.splice(MAX_STORED_ERRORS);
    }

    // Log critical errors immediately
    if (errorReport.severity === 'critical') {
      console.error('🚨 CRITICAL ERROR:', errorReport);

      // In production, you might want to:
      // - Send alert emails
      // - Post to Slack
      // - Create incident tickets
    }

    // Log to server console for debugging
    console.log(`📊 Error Report [${errorReport.severity.toUpperCase()}]:`, {
      message: errorReport.message,
      url: errorReport.url,
      userId: errorReport.userId,
      timestamp: errorReport.timestamp
    });

    return NextResponse.json({ success: true, id: Date.now().toString() });

  } catch (error) {
    console.error('Failed to process error report:', error);
    return NextResponse.json(
      { error: 'Failed to process error report' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const severity = searchParams.get('severity');
    const userId = searchParams.get('userId');

    let filteredErrors = [...errorReports];

    // Filter by severity
    if (severity) {
      filteredErrors = filteredErrors.filter(error => error.severity === severity);
    }

    // Filter by user ID
    if (userId) {
      filteredErrors = filteredErrors.filter(error => error.userId === userId);
    }

    // Limit results
    filteredErrors = filteredErrors.slice(0, limit);

    // Generate summary statistics
    const summary = {
      total: errorReports.length,
      filtered: filteredErrors.length,
      bySeverity: {
        critical: errorReports.filter(e => e.severity === 'critical').length,
        high: errorReports.filter(e => e.severity === 'high').length,
        medium: errorReports.filter(e => e.severity === 'medium').length,
        low: errorReports.filter(e => e.severity === 'low').length,
      },
      recentErrors: errorReports.slice(0, 5).map(error => ({
        message: error.message,
        severity: error.severity,
        timestamp: error.timestamp
      }))
    };

    return NextResponse.json({
      errors: filteredErrors,
      summary
    });

  } catch (error) {
    console.error('Failed to fetch error reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch error reports' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity');
    const olderThan = searchParams.get('olderThan');

    let removed = 0;

    if (severity) {
      // Remove errors by severity
      const initialLength = errorReports.length;
      for (let i = errorReports.length - 1; i >= 0; i--) {
        if (errorReports[i].severity === severity) {
          errorReports.splice(i, 1);
          removed++;
        }
      }
    } else if (olderThan) {
      // Remove errors older than specified date
      const cutoffDate = new Date(olderThan);
      const initialLength = errorReports.length;

      for (let i = errorReports.length - 1; i >= 0; i--) {
        if (new Date(errorReports[i].timestamp) < cutoffDate) {
          errorReports.splice(i, 1);
          removed++;
        }
      }
    } else {
      // Clear all errors
      removed = errorReports.length;
      errorReports.splice(0);
    }

    return NextResponse.json({
      success: true,
      removed,
      remaining: errorReports.length
    });

  } catch (error) {
    console.error('Failed to delete error reports:', error);
    return NextResponse.json(
      { error: 'Failed to delete error reports' },
      { status: 500 }
    );
  }
}