'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface ClockButtonProps {
  isActive: boolean;
  onClockIn: () => void;
  onClockOut: () => void;
  loading?: boolean;
  disabled?: boolean;
  currentDuration?: number;
  className?: string;
}

export const ClockButton: React.FC<ClockButtonProps> = ({
  isActive,
  onClockIn,
  onClockOut,
  loading = false,
  disabled = false,
  currentDuration = 0,
  className
}) => {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const handleClick = () => {
    if (isActive) {
      onClockOut();
    } else {
      onClockIn();
    }
  };

  return (
    <div className={cn('flex flex-col items-center space-y-4', className)}>
      {/* Clock Button */}
      <Button
        onClick={handleClick}
        loading={loading}
        disabled={disabled || loading}
        size="lg"
        variant={isActive ? 'destructive' : 'primary'}
        className={cn(
          'relative h-32 w-32 rounded-full text-lg font-semibold shadow-lg transition-all duration-200',
          isActive
            ? 'bg-red-500 hover:bg-red-600 ring-4 ring-red-200'
            : 'bg-green-500 hover:bg-green-600 ring-4 ring-green-200',
          loading && 'animate-pulse'
        )}
      >
        <div className="flex flex-col items-center">
          {/* Icon */}
          <div className="mb-2">
            {isActive ? (
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
              </svg>
            ) : (
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h6v4H9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>

          {/* Text */}
          <span>
            {loading
              ? (isActive ? 'Clocking Out...' : 'Clocking In...')
              : (isActive ? 'Clock Out' : 'Clock In')
            }
          </span>
        </div>
      </Button>

      {/* Status Text */}
      <div className="text-center">
        {isActive ? (
          <div>
            <p className="text-lg font-medium text-gray-900">Currently Working</p>
            {currentDuration > 0 && (
              <p className="text-sm text-gray-600">
                Session: {formatDuration(currentDuration)}
              </p>
            )}
          </div>
        ) : (
          <p className="text-lg font-medium text-gray-600">Not Clocked In</p>
        )}
      </div>

      {/* Quick Actions */}
      {isActive && (
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Click to clock out</span>
        </div>
      )}
    </div>
  );
};

interface QuickClockButtonProps {
  isActive: boolean;
  onToggle: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export const QuickClockButton: React.FC<QuickClockButtonProps> = ({
  isActive,
  onToggle,
  loading = false,
  disabled = false,
  className
}) => {
  return (
    <Button
      onClick={onToggle}
      loading={loading}
      disabled={disabled || loading}
      variant={isActive ? 'destructive' : 'primary'}
      className={cn(
        'transition-all duration-200',
        isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600',
        className
      )}
    >
      <div className="flex items-center space-x-2">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>
          {loading
            ? (isActive ? 'Clocking Out...' : 'Clocking In...')
            : (isActive ? 'Clock Out' : 'Clock In')
          }
        </span>
      </div>
    </Button>
  );
};