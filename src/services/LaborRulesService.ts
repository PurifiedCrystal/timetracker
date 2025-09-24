import { timeEntries } from '@/lib/database';
import { TimeEntry, UpdateTimeEntryData } from '@/types/time-entry';
import { UserService } from './UserService';
import { TimeEntryService } from './TimeEntryService';

interface LaborViolation {
  type: 'overtime' | 'meal_break' | 'rest_break';
  description: string;
  recommendation: string;
  severity: 'warning' | 'violation';
}

interface DailyLaborAnalysis {
  date: string;
  total_hours: number;
  overtime_hours: number;
  violations: LaborViolation[];
  meal_break_taken: boolean;
  rest_breaks_taken: number;
}

export class LaborRulesService {
  /**
   * Apply California labor rules to a time entry after clock out
   */
  static async applyLaborRules(userId: string, timeEntry: TimeEntry): Promise<{ data: TimeEntry | null; error: string | null }> {
    try {
      // Only apply to California users
      if (!await UserService.isCaliforniaUser(userId)) {
        return { data: timeEntry, error: null };
      }

      // Calculate overtime based on CA rules
      const overtimeMinutes = await this.calculateOvertimeMinutes(userId, timeEntry);

      // Update time entry with overtime if needed
      if (overtimeMinutes > 0 && overtimeMinutes !== timeEntry.overtime_minutes) {
        const { data: updatedEntry, error } = await TimeEntryService.updateTimeEntry(
          userId,
          timeEntry.id,
          { overtime_minutes: overtimeMinutes }
        );

        if (error) {
          return { data: timeEntry, error };
        }

        return { data: updatedEntry, error: null };
      }

      return { data: timeEntry, error: null };

    } catch (err) {
      console.error('Labor rules application error:', err);
      return {
        data: timeEntry,
        error: err instanceof Error ? err.message : 'Unknown labor rules error'
      };
    }
  }

  /**
   * Calculate overtime minutes for a time entry based on CA rules
   */
  static async calculateOvertimeMinutes(userId: string, timeEntry: TimeEntry): Promise<number> {
    if (!timeEntry.clock_out || !timeEntry.duration_minutes) {
      return 0;
    }

    // Get date of this time entry
    const entryDate = new Date(timeEntry.clock_in).toISOString().split('T')[0];

    // Get all time entries for this date
    const { data: dailyEntries } = await TimeEntryService.getTimeEntriesForPeriod(
      userId,
      entryDate,
      entryDate
    );

    if (!dailyEntries) {
      return 0;
    }

    // Calculate total work time for the day
    const completedEntries = dailyEntries.filter(entry => entry.clock_out !== null);
    const totalDailyMinutes = completedEntries.reduce((sum, entry) => {
      return sum + (entry.duration_minutes || 0);
    }, 0);

    // California overtime rules:
    // - Over 8 hours in a day = 1.5x overtime
    // - Over 12 hours in a day = 2x overtime (double time)
    // - Over 40 hours in a week = 1.5x overtime

    const EIGHT_HOURS_MINUTES = 8 * 60;
    const TWELVE_HOURS_MINUTES = 12 * 60;

    let overtimeMinutes = 0;

    if (totalDailyMinutes > EIGHT_HOURS_MINUTES) {
      // Calculate how much of this specific entry contributed to overtime
      const regularHoursMinutes = EIGHT_HOURS_MINUTES;
      const previousEntriesMinutes = completedEntries
        .filter(entry => entry.id !== timeEntry.id)
        .reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0);

      if (previousEntriesMinutes < regularHoursMinutes) {
        // This entry crosses into overtime
        const regularPortionOfThisEntry = Math.max(0, regularHoursMinutes - previousEntriesMinutes);
        overtimeMinutes = (timeEntry.duration_minutes || 0) - regularPortionOfThisEntry;
      } else {
        // This entire entry is overtime
        overtimeMinutes = timeEntry.duration_minutes || 0;
      }

      // Apply double time for work over 12 hours
      if (totalDailyMinutes > TWELVE_HOURS_MINUTES) {
        const doubleTimeThreshold = TWELVE_HOURS_MINUTES;
        if (previousEntriesMinutes < doubleTimeThreshold) {
          const doubleTimePortionOfThisEntry = Math.max(0,
            Math.min(timeEntry.duration_minutes || 0, totalDailyMinutes - doubleTimeThreshold));

          // In a real implementation, you'd track double time separately
          // For now, we'll include it in overtime_minutes
          overtimeMinutes = Math.max(overtimeMinutes, doubleTimePortionOfThisEntry);
        }
      }
    }

    return Math.max(0, overtimeMinutes);
  }

  /**
   * Analyze daily compliance with California labor laws
   */
  static async analyzeDailyCompliance(userId: string, date: string): Promise<{ data: DailyLaborAnalysis | null; error: string | null }> {
    try {
      // Only analyze for California users
      if (!await UserService.isCaliforniaUser(userId)) {
        return { data: null, error: 'Labor analysis only applies to California users' };
      }

      // Get daily summary
      const { data: dailySummary, error } = await TimeEntryService.getDailySummary(userId, date);
      if (error || !dailySummary) {
        return { data: null, error: error || 'Failed to get daily summary' };
      }

      const violations: LaborViolation[] = [];
      const totalHours = dailySummary.total_hours;

      // Check for overtime violations
      if (totalHours > 12) {
        violations.push({
          type: 'overtime',
          description: `Worked ${totalHours} hours in a single day (over 12 hours)`,
          recommendation: 'Consider scheduling work across multiple days to avoid excessive hours',
          severity: 'violation'
        });
      } else if (totalHours > 8) {
        violations.push({
          type: 'overtime',
          description: `Worked ${totalHours} hours in a single day (over 8 hours)`,
          recommendation: 'Overtime pay (1.5x) required for hours worked over 8 per day',
          severity: 'warning'
        });
      }

      // Check for meal break violations (required for shifts > 5 hours)
      let mealBreakTaken = false;
      if (totalHours > 5) {
        // Check if sufficient break time was taken (30+ minutes typically indicates meal break)
        mealBreakTaken = dailySummary.break_minutes >= 30;

        if (!mealBreakTaken) {
          violations.push({
            type: 'meal_break',
            description: `Worked ${totalHours} hours without taking a meal break`,
            recommendation: 'Take a 30-minute unpaid meal break when working more than 5 hours',
            severity: 'violation'
          });
        }
      }

      // Check for rest break violations (10 minutes per 4 hours worked)
      const requiredRestBreaks = Math.floor(totalHours / 4);
      const estimatedRestBreaks = Math.max(0, Math.floor((dailySummary.break_minutes - (mealBreakTaken ? 30 : 0)) / 10));

      if (requiredRestBreaks > estimatedRestBreaks) {
        violations.push({
          type: 'rest_break',
          description: `Should have taken ${requiredRestBreaks} rest breaks but only took approximately ${estimatedRestBreaks}`,
          recommendation: 'Take a 10-minute paid rest break for every 4 hours worked',
          severity: 'warning'
        });
      }

      return {
        data: {
          date,
          total_hours: totalHours,
          overtime_hours: dailySummary.overtime_minutes / 60,
          violations,
          meal_break_taken: mealBreakTaken,
          rest_breaks_taken: estimatedRestBreaks,
        },
        error: null
      };

    } catch (err) {
      console.error('Labor compliance analysis error:', err);
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown compliance analysis error'
      };
    }
  }

  /**
   * Get weekly overtime analysis for California users
   */
  static async getWeeklyOvertimeAnalysis(userId: string, weekStartDate: string): Promise<{ data: { total_hours: number; overtime_hours: number; overtime_pay_owed: boolean } | null; error: string | null }> {
    try {
      if (!await UserService.isCaliforniaUser(userId)) {
        return { data: null, error: 'Weekly overtime analysis only applies to California users' };
      }

      // Calculate end of week (6 days after start)
      const startDate = new Date(weekStartDate);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);

      const { data: weeklyEntries, error } = await TimeEntryService.getTimeEntriesForPeriod(
        userId,
        weekStartDate,
        endDate.toISOString().split('T')[0]
      );

      if (error || !weeklyEntries) {
        return { data: null, error: error || 'Failed to get weekly entries' };
      }

      const completedEntries = weeklyEntries.filter(entry => entry.clock_out !== null);
      const totalWeeklyMinutes = completedEntries.reduce((sum, entry) => {
        return sum + (entry.duration_minutes || 0);
      }, 0);

      const totalWeeklyHours = totalWeeklyMinutes / 60;
      const weeklyOvertimeHours = Math.max(0, totalWeeklyHours - 40);

      return {
        data: {
          total_hours: Math.round(totalWeeklyHours * 100) / 100,
          overtime_hours: Math.round(weeklyOvertimeHours * 100) / 100,
          overtime_pay_owed: weeklyOvertimeHours > 0,
        },
        error: null
      };

    } catch (err) {
      console.error('Weekly overtime analysis error:', err);
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown weekly analysis error'
      };
    }
  }

  /**
   * Generate labor compliance report for a date range
   */
  static async generateComplianceReport(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<{ data: DailyLaborAnalysis[] | null; error: string | null }> {
    try {
      if (!await UserService.isCaliforniaUser(userId)) {
        return { data: [], error: null };
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      const analyses: DailyLaborAnalysis[] = [];

      // Analyze each day in the range
      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const dateString = date.toISOString().split('T')[0];
        const { data: analysis, error } = await this.analyzeDailyCompliance(userId, dateString);

        if (error) {
          console.error(`Error analyzing compliance for ${dateString}:`, error);
          continue;
        }

        if (analysis && (analysis.total_hours > 0 || analysis.violations.length > 0)) {
          analyses.push(analysis);
        }
      }

      return { data: analyses, error: null };

    } catch (err) {
      console.error('Compliance report generation error:', err);
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown compliance report error'
      };
    }
  }

  /**
   * Check if a time entry requires overtime notification
   */
  static async requiresOvertimeNotification(userId: string, timeEntry: TimeEntry): Promise<boolean> {
    if (!await UserService.isCaliforniaUser(userId)) {
      return false;
    }

    const overtimeMinutes = await this.calculateOvertimeMinutes(userId, timeEntry);
    return overtimeMinutes > 0;
  }

  /**
   * Get overtime rate multiplier based on hours worked
   */
  static getOvertimeMultiplier(totalDailyHours: number): number {
    if (totalDailyHours > 12) {
      return 2.0; // Double time
    } else if (totalDailyHours > 8) {
      return 1.5; // Time and a half
    }
    return 1.0; // Regular time
  }
}