export interface TimeEntry {
  id: string;
  user_id: string;
  clock_in: string; // ISO timestamp
  clock_out: string | null; // ISO timestamp or null if active
  duration_minutes: number | null; // Computed field
  break_minutes: number;
  overtime_minutes: number;
  group_id: string | null; // New field for group assignment
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateTimeEntryData {
  user_id: string;
  clock_in?: string; // Defaults to current time if not provided
  group_id?: string | null; // Optional group assignment
  metadata?: Record<string, any>;
}

export interface UpdateTimeEntryData {
  clock_out?: string;
  break_minutes?: number;
  overtime_minutes?: number;
  metadata?: Record<string, any>;
}

export interface ClockInRequest {
  group_id?: string | null; // Optional group assignment
  metadata?: Record<string, any>;
}

export interface ClockOutRequest {
  clock_out?: string; // Defaults to current time if not provided
  break_minutes?: number;
}

export interface TimeEntryWithDuration extends TimeEntry {
  duration_hours?: number; // Computed: duration_minutes / 60
  is_active: boolean; // Computed: clock_out === null
}

export interface TimeEntrySummary {
  date: string; // YYYY-MM-DD format
  total_minutes: number;
  total_hours: number;
  overtime_minutes: number;
  break_minutes: number;
  entries: TimeEntry[];
}

export interface WeeklyTimeEntrySummary {
  week_start: string; // YYYY-MM-DD format (Monday)
  week_end: string; // YYYY-MM-DD format (Sunday)
  total_minutes: number;
  total_hours: number;
  overtime_minutes: number;
  days: TimeEntrySummary[];
}

// Time entry metadata types
export interface TimeEntryMetadata {
  location?: string;
  project?: string;
  task?: string;
  notes?: string;
  tags?: string[];
  client?: string;
  [key: string]: any;
}

// Query options for fetching time entries
export interface TimeEntryQueryOptions {
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  includeActive?: boolean;
  orderBy?: 'clock_in' | 'created_at' | 'duration_minutes';
  orderDirection?: 'asc' | 'desc';
}

// Time calculation utilities
export function calculateDuration(clockIn: string, clockOut: string): number {
  const start = new Date(clockIn);
  const end = new Date(clockOut);
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60)); // minutes
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

export function isActiveTimeEntry(entry: TimeEntry): boolean {
  return entry.clock_out === null;
}

export function getTimeEntryDuration(entry: TimeEntry): number {
  if (entry.duration_minutes !== null) {
    return entry.duration_minutes;
  }

  if (entry.clock_out) {
    return calculateDuration(entry.clock_in, entry.clock_out);
  }

  // For active entries, calculate current duration
  return calculateDuration(entry.clock_in, new Date().toISOString());
}