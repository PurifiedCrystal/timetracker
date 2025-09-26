'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface TimeDisplayProps {
  currentTime?: Date;
  timezone?: string;
  format?: '12h' | '24h';
  showSeconds?: boolean;
  showDate?: boolean;
  className?: string;
}

export const TimeDisplay: React.FC<TimeDisplayProps> = ({
  currentTime,
  timezone,
  format = '12h',
  showSeconds = false,
  showDate = true,
  className
}) => {
  const [time, setTime] = React.useState(currentTime || new Date());

  React.useEffect(() => {
    if (!currentTime) {
      const interval = setInterval(() => {
        setTime(new Date());
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setTime(currentTime);
    }
  }, [currentTime]);

  const formatTime = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      second: showSeconds ? '2-digit' : undefined,
      hour12: format === '12h',
      timeZone: timezone
    };

    return date.toLocaleTimeString('en-US', options);
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: timezone
    };

    return date.toLocaleDateString('en-US', options);
  };

  return (
    <div className={cn('text-center', className)}>
      <div className="text-4xl font-mono font-bold text-gray-900">
        {formatTime(time)}
      </div>
      {showDate && (
        <div className="mt-2 text-sm text-gray-600">
          {formatDate(time)}
        </div>
      )}
      {timezone && (
        <div className="mt-1 text-xs text-gray-500">
          {timezone.replace('_', ' ')}
        </div>
      )}
    </div>
  );
};

interface DurationDisplayProps {
  startTime: string | Date;
  endTime?: string | Date;
  isActive?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const DurationDisplay: React.FC<DurationDisplayProps> = ({
  startTime,
  endTime,
  isActive = false,
  className,
  size = 'md'
}) => {
  const [currentDuration, setCurrentDuration] = React.useState(0);

  React.useEffect(() => {
    const calculateDuration = () => {
      const start = new Date(startTime);
      const end = endTime ? new Date(endTime) : new Date();
      const diffInMs = end.getTime() - start.getTime();
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return Math.max(0, diffInMinutes);
    };

    if (isActive && !endTime) {
      const interval = setInterval(() => {
        setCurrentDuration(calculateDuration());
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setCurrentDuration(calculateDuration());
    }
  }, [startTime, endTime, isActive]);

  const formatDuration = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const seconds = isActive ? Math.floor((Date.now() - new Date(startTime).getTime()) / 1000) % 60 : 0;

    if (isActive && size !== 'sm') {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl'
  };

  return (
    <div className={cn(
      'font-mono font-semibold',
      isActive ? 'text-green-600' : 'text-gray-900',
      sizeClasses[size],
      className
    )}>
      {formatDuration(currentDuration)}
      {isActive && (
        <span className="ml-2 inline-block h-2 w-2 bg-green-500 rounded-full animate-pulse" />
      )}
    </div>
  );
};

interface SessionSummaryProps {
  clockIn: string | Date;
  clockOut?: string | Date;
  breakMinutes?: number;
  isActive?: boolean;
  className?: string;
}

export const SessionSummary: React.FC<SessionSummaryProps> = ({
  clockIn,
  clockOut,
  breakMinutes = 0,
  isActive = false,
  className
}) => {
  const clockInTime = new Date(clockIn);
  const clockOutTime = clockOut ? new Date(clockOut) : undefined;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className={cn(
      'bg-white rounded-lg border border-gray-200 p-4',
      className
    )}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Clock In</div>
          <div className="text-sm font-medium text-gray-900">
            {formatTime(clockInTime)}
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">
            {isActive ? 'Current Session' : 'Clock Out'}
          </div>
          <div className="text-sm font-medium text-gray-900">
            {clockOutTime ? formatTime(clockOutTime) : (
              <DurationDisplay
                startTime={clockIn}
                isActive={isActive}
                size="sm"
              />
            )}
          </div>
        </div>

        {!isActive && (
          <>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Total Time</div>
              <div className="text-sm font-medium text-gray-900">
                <DurationDisplay
                  startTime={clockIn}
                  endTime={clockOut}
                  size="sm"
                />
              </div>
            </div>

            {breakMinutes > 0 && (
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Break Time</div>
                <div className="text-sm font-medium text-gray-900">
                  {Math.floor(breakMinutes / 60)}h {breakMinutes % 60}m
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};