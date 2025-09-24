import { timeEntries } from '@/lib/database';
import {
  TimeEntry,
  CreateTimeEntryData,
  UpdateTimeEntryData,
  TimeEntryQueryOptions,
  TimeEntrySummary,
  calculateDuration
} from '@/types/time-entry';
import { UserService } from './UserService';
import { LaborRulesService } from './LaborRulesService';

export class TimeEntryService {
  /**
   * Get user's time entries with optional filtering
   */
  static async getTimeEntries(userId: string, options: TimeEntryQueryOptions = {}): Promise<{ data: TimeEntry[] | null; error: string | null }> {
    return await timeEntries.list(userId, {
      startDate: options.startDate,
      endDate: options.endDate,
      limit: options.limit || 50,
      offset: options.offset || 0,
    });
  }

  /**
   * Get specific time entry by ID
   */
  static async getTimeEntry(userId: string, entryId: string): Promise<{ data: TimeEntry | null; error: string | null }> {
    return await timeEntries.get(userId, entryId);
  }

  /**
   * Get user's active time entry (currently clocked in)
   */
  static async getActiveTimeEntry(userId: string): Promise<{ data: TimeEntry | null; error: string | null }> {
    return await timeEntries.getActive(userId);
  }

  /**
   * Clock in - create new time entry
   */
  static async clockIn(userId: string, metadata: Record<string, any> = {}): Promise<{ data: TimeEntry | null; error: string | null }> {
    // Check if user already has active time entry
    const { data: activeEntry } = await this.getActiveTimeEntry(userId);
    if (activeEntry) {
      return { data: null, error: 'User already clocked in' };
    }

    const clockInTime = new Date().toISOString();

    const { data: newEntry, error } = await timeEntries.create(userId, {
      clock_in: clockInTime,
      metadata,
    });

    if (error) {
      return { data: null, error };
    }

    return { data: newEntry, error: null };
  }

  /**
   * Clock out - update existing time entry
   */
  static async clockOut(
    userId: string,
    entryId: string,
    clockOutTime?: string,
    breakMinutes: number = 0
  ): Promise<{ data: TimeEntry | null; error: string | null }> {
    // Validate entry belongs to user and is active
    const { data: existingEntry, error: getError } = await this.getTimeEntry(userId, entryId);
    if (getError) {
      return { data: null, error: getError };
    }

    if (!existingEntry) {
      return { data: null, error: 'Time entry not found' };
    }

    if (existingEntry.clock_out !== null) {
      return { data: null, error: 'Time entry already completed' };
    }

    // Validate break minutes
    if (breakMinutes < 0) {
      return { data: null, error: 'Break minutes cannot be negative' };
    }

    const clockOut = clockOutTime || new Date().toISOString();

    // Validate clock out is after clock in
    if (new Date(clockOut) <= new Date(existingEntry.clock_in)) {
      return { data: null, error: 'Clock out time must be after clock in time' };
    }

    // Update the time entry
    const { data: updatedEntry, error: updateError } = await timeEntries.clockOut(
      userId,
      entryId,
      clockOut,
      breakMinutes
    );

    if (updateError) {
      return { data: null, error: updateError };
    }

    // Apply labor rules if user is in California
    if (updatedEntry && await UserService.isCaliforniaUser(userId)) {
      await LaborRulesService.applyLaborRules(userId, updatedEntry);
    }

    return { data: updatedEntry, error: null };
  }

  /**
   * Update time entry (for corrections)
   */
  static async updateTimeEntry(
    userId: string,
    entryId: string,
    updates: UpdateTimeEntryData
  ): Promise<{ data: TimeEntry | null; error: string | null }> {
    // Validate entry belongs to user
    const { data: existingEntry, error: getError } = await this.getTimeEntry(userId, entryId);
    if (getError) {
      return { data: null, error: getError };
    }

    if (!existingEntry) {
      return { data: null, error: 'Time entry not found' };
    }

    // Validate constraints
    if (updates.break_minutes && updates.break_minutes < 0) {
      return { data: null, error: 'Break minutes cannot be negative' };
    }

    if (updates.clock_out) {
      if (new Date(updates.clock_out) <= new Date(existingEntry.clock_in)) {
        return { data: null, error: 'Clock out time must be after clock in time' };
      }
    }

    return await timeEntries.update(userId, entryId, updates);
  }

  /**
   * Get daily summary for a specific date
   */
  static async getDailySummary(userId: string, date: string): Promise<{ data: TimeEntrySummary | null; error: string | null }> {
    const startOfDay = `${date}T00:00:00.000Z`;
    const endOfDay = `${date}T23:59:59.999Z`;

    const { data: entries, error } = await this.getTimeEntries(userId, {
      startDate: startOfDay,
      endDate: endOfDay,
    });

    if (error) {
      return { data: null, error };
    }

    if (!entries) {
      return { data: null, error: 'Failed to fetch time entries' };
    }

    const completedEntries = entries.filter(entry => entry.clock_out !== null);

    const totalMinutes = completedEntries.reduce((sum, entry) => {
      return sum + (entry.duration_minutes || 0);
    }, 0);

    const overtimeMinutes = completedEntries.reduce((sum, entry) => {
      return sum + entry.overtime_minutes;
    }, 0);

    const breakMinutes = completedEntries.reduce((sum, entry) => {
      return sum + entry.break_minutes;
    }, 0);

    return {
      data: {
        date,
        total_minutes: totalMinutes,
        total_hours: Math.round((totalMinutes / 60) * 100) / 100,
        overtime_minutes: overtimeMinutes,
        break_minutes: breakMinutes,
        entries,
      },
      error: null,
    };
  }

  /**
   * Get time entries for date range
   */
  static async getTimeEntriesForPeriod(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<{ data: TimeEntry[] | null; error: string | null }> {
    return await this.getTimeEntries(userId, {
      startDate: `${startDate}T00:00:00.000Z`,
      endDate: `${endDate}T23:59:59.999Z`,
      limit: 1000, // Large limit for exports
    });
  }

  /**
   * Check if user is currently clocked in
   */
  static async isUserClockedIn(userId: string): Promise<boolean> {
    const { data: activeEntry } = await this.getActiveTimeEntry(userId);
    return activeEntry !== null;
  }

  /**
   * Get current session duration for active time entry
   */
  static async getCurrentSessionDuration(userId: string): Promise<number> {
    const { data: activeEntry } = await this.getActiveTimeEntry(userId);
    if (!activeEntry) {
      return 0;
    }

    return calculateDuration(activeEntry.clock_in, new Date().toISOString());
  }

  /**
   * Delete time entry (admin function)
   */
  static async deleteTimeEntry(userId: string, entryId: string): Promise<{ data: boolean; error: string | null }> {
    // Validate entry belongs to user
    const { data: existingEntry, error: getError } = await this.getTimeEntry(userId, entryId);
    if (getError) {
      return { data: false, error: getError };
    }

    if (!existingEntry) {
      return { data: false, error: 'Time entry not found' };
    }

    // Don't allow deletion of active entries
    if (existingEntry.clock_out === null) {
      return { data: false, error: 'Cannot delete active time entry' };
    }

    // For now, we don't implement actual deletion (would require database change)
    // Instead, we could mark as deleted in metadata
    const { data: updatedEntry, error: updateError } = await this.updateTimeEntry(userId, entryId, {
      metadata: {
        ...existingEntry.metadata,
        deleted: true,
        deleted_at: new Date().toISOString(),
      },
    });

    return { data: !!updatedEntry, error: updateError };
  }
}