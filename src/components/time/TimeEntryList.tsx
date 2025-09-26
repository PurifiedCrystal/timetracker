'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { DurationDisplay } from '@/components/time/TimeDisplay';
import { cn } from '@/lib/utils';

interface TimeEntry {
  id: string;
  clock_in: string;
  clock_out: string | null;
  duration_minutes: number | null;
  break_minutes: number;
  overtime_minutes: number;
  metadata?: {
    project?: string;
    notes?: string;
    location?: string;
  };
}

interface TimeEntryListProps {
  entries: TimeEntry[];
  onEdit?: (entry: TimeEntry) => void;
  onDelete?: (entryId: string) => void;
  loading?: boolean;
  className?: string;
}

export const TimeEntryList: React.FC<TimeEntryListProps> = ({
  entries,
  onEdit,
  onDelete,
  loading = false,
  className
}) => {
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-24"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="h-8 bg-gray-300 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No time entries</h3>
        <p className="mt-1 text-sm text-gray-500">
          Start tracking your time by clocking in.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {entries.map((entry) => (
        <TimeEntryCard
          key={entry.id}
          entry={entry}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

interface TimeEntryCardProps {
  entry: TimeEntry;
  onEdit?: (entry: TimeEntry) => void;
  onDelete?: (entryId: string) => void;
}

const TimeEntryCard: React.FC<TimeEntryCardProps> = ({
  entry,
  onEdit,
  onDelete
}) => {
  const isActive = !entry.clock_out;
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={cn(
      'bg-white rounded-lg border p-4 transition-colors',
      isActive ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-gray-300'
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Date and Status */}
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm font-medium text-gray-900">
              {formatDate(entry.clock_in)}
            </span>
            {isActive && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                Active
              </span>
            )}
            {entry.overtime_minutes > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Overtime
              </span>
            )}
          </div>

          {/* Time Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Clock In:</span>
              <div className="font-medium">{formatTime(entry.clock_in)}</div>
            </div>

            <div>
              <span className="text-gray-500">Clock Out:</span>
              <div className="font-medium">
                {entry.clock_out ? formatTime(entry.clock_out) : (
                  <span className="text-green-600">In progress</span>
                )}
              </div>
            </div>

            <div>
              <span className="text-gray-500">Duration:</span>
              <div className="font-medium">
                {isActive ? (
                  <DurationDisplay
                    startTime={entry.clock_in}
                    isActive={true}
                    size="sm"
                  />
                ) : (
                  <span>
                    {entry.duration_minutes
                      ? `${Math.floor(entry.duration_minutes / 60)}:${(entry.duration_minutes % 60).toString().padStart(2, '0')}`
                      : '--'
                    }
                  </span>
                )}
              </div>
            </div>

            {entry.break_minutes > 0 && (
              <div>
                <span className="text-gray-500">Break:</span>
                <div className="font-medium">{entry.break_minutes}m</div>
              </div>
            )}
          </div>

          {/* Metadata */}
          {(entry.metadata?.project || entry.metadata?.notes || entry.metadata?.location) && (
            <div className="mt-3 space-y-1">
              {entry.metadata.project && (
                <div className="flex items-center text-xs text-gray-600">
                  <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="font-medium">Project:</span>
                  <span className="ml-1">{entry.metadata.project}</span>
                </div>
              )}
              {entry.metadata.location && (
                <div className="flex items-center text-xs text-gray-600">
                  <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="font-medium">Location:</span>
                  <span className="ml-1">{entry.metadata.location}</span>
                </div>
              )}
              {entry.metadata.notes && (
                <div className="flex items-start text-xs text-gray-600">
                  <svg className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <div>
                    <span className="font-medium">Notes:</span>
                    <span className="ml-1">{entry.metadata.notes}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {(onEdit || onDelete) && (
          <div className="flex items-center space-x-2 ml-4">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(entry)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Button>
            )}
            {onDelete && !isActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(entry.id)}
                className="text-gray-400 hover:text-red-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};