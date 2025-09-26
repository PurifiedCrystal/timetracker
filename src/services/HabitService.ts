import { createRouteHandlerClient } from '@/lib/supabase-server';
import type {
  HabitEntry,
  CreateHabitEntryRequest,
  UpdateHabitEntryRequest,
  HabitSummary,
  HabitStats,
  HabitCalendarData
} from '@/types/habit';

export class HabitService {

  static async createHabitEntry(userId: string, data: CreateHabitEntryRequest): Promise<{ data: HabitEntry | null; error: string | null }> {
    try {
      const supabase = createRouteHandlerClient();

      const entryData = {
        user_id: userId,
        habit_name: data.habit_name,
        habit_category: data.habit_category || 'personal',
        entry_type: data.entry_type,
        completed_at: data.completed_at,
        start_time: data.start_time,
        end_time: data.end_time,
        count_value: data.count_value || 1,
        target_value: data.target_value,
        notes: data.notes,
        mood_rating: data.mood_rating,
        entry_date: data.entry_date || new Date().toISOString().split('T')[0]
      };

      const { data: habitEntry, error } = await supabase
        .from('habit_entries')
        .insert([entryData])
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: habitEntry, error: null };
    } catch (error) {
      return { data: null, error: 'Failed to create habit entry' };
    }
  }

  static async getHabitEntry(entryId: string): Promise<{ data: HabitEntry | null; error: string | null }> {
    try {
      const supabase = createRouteHandlerClient();

      const { data: habitEntry, error } = await supabase
        .from('habit_entries')
        .select('*')
        .eq('id', entryId)
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: habitEntry, error: null };
    } catch (error) {
      return { data: null, error: 'Failed to fetch habit entry' };
    }
  }

  static async getUserHabitEntries(
    userId: string,
    options: {
      startDate?: string;
      endDate?: string;
      habitName?: string;
      category?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ data: HabitEntry[]; error: string | null }> {
    try {
      const supabase = createRouteHandlerClient();

      let query = supabase
        .from('habit_entries')
        .select('*')
        .eq('user_id', userId);

      if (options.startDate) {
        query = query.gte('entry_date', options.startDate);
      }
      if (options.endDate) {
        query = query.lte('entry_date', options.endDate);
      }
      if (options.habitName) {
        query = query.eq('habit_name', options.habitName);
      }
      if (options.category) {
        query = query.eq('habit_category', options.category);
      }
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      query = query.order('created_at', { ascending: false });

      const { data: habitEntries, error } = await query;

      if (error) {
        return { data: [], error: error.message };
      }

      return { data: habitEntries || [], error: null };
    } catch (error) {
      return { data: [], error: 'Failed to fetch habit entries' };
    }
  }

  static async updateHabitEntry(entryId: string, data: UpdateHabitEntryRequest): Promise<{ data: HabitEntry | null; error: string | null }> {
    try {
      const supabase = createRouteHandlerClient();

      const updateData: any = {};
      if (data.habit_name !== undefined) updateData.habit_name = data.habit_name;
      if (data.habit_category !== undefined) updateData.habit_category = data.habit_category;
      if (data.start_time !== undefined) updateData.start_time = data.start_time;
      if (data.end_time !== undefined) updateData.end_time = data.end_time;
      if (data.count_value !== undefined) updateData.count_value = data.count_value;
      if (data.target_value !== undefined) updateData.target_value = data.target_value;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.mood_rating !== undefined) updateData.mood_rating = data.mood_rating;

      const { data: habitEntry, error } = await supabase
        .from('habit_entries')
        .update(updateData)
        .eq('id', entryId)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: habitEntry, error: null };
    } catch (error) {
      return { data: null, error: 'Failed to update habit entry' };
    }
  }

  static async deleteHabitEntry(entryId: string): Promise<{ error: string | null }> {
    try {
      const supabase = createRouteHandlerClient();

      const { error } = await supabase
        .from('habit_entries')
        .delete()
        .eq('id', entryId);

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: 'Failed to delete habit entry' };
    }
  }

  static async getHabitSummaries(userId: string, startDate?: string, endDate?: string): Promise<{ data: HabitSummary[]; error: string | null }> {
    try {
      const supabase = createRouteHandlerClient();

      let query = supabase
        .from('habit_entries')
        .select('habit_name, habit_category, entry_type, duration_minutes, count_value, entry_date')
        .eq('user_id', userId);

      if (startDate) query = query.gte('entry_date', startDate);
      if (endDate) query = query.lte('entry_date', endDate);

      const { data: entries, error } = await query;

      if (error) {
        return { data: [], error: error.message };
      }

      // Group entries by habit name and calculate summaries
      const habitGroups = (entries || []).reduce((groups, entry) => {
        const key = entry.habit_name;
        if (!groups[key]) {
          groups[key] = {
            habit_name: entry.habit_name,
            habit_category: entry.habit_category,
            entries: []
          };
        }
        groups[key].entries.push(entry);
        return groups;
      }, {} as Record<string, { habit_name: string; habit_category: string; entries: any[] }>);

      const summaries: HabitSummary[] = Object.values(habitGroups).map(group => {
        const totalEntries = group.entries.length;
        const completionRate = 100; // Simplified - would need date range analysis
        const totalTime = group.entries.reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0);
        const totalCount = group.entries.reduce((sum, entry) => sum + (entry.count_value || 0), 0);

        return {
          habit_name: group.habit_name,
          habit_category: group.habit_category,
          total_entries: totalEntries,
          completion_rate: completionRate,
          current_streak: this.calculateCurrentStreak(group.entries),
          longest_streak: this.calculateLongestStreak(group.entries),
          total_time_minutes: totalTime > 0 ? totalTime : undefined,
          average_time_minutes: totalTime > 0 ? Math.round(totalTime / totalEntries) : undefined,
          total_count: totalCount > 0 ? totalCount : undefined,
          average_count: totalCount > 0 ? Math.round(totalCount / totalEntries) : undefined
        };
      });

      return { data: summaries, error: null };
    } catch (error) {
      return { data: [], error: 'Failed to fetch habit summaries' };
    }
  }

  static async getHabitStats(userId: string): Promise<{ data: HabitStats | null; error: string | null }> {
    try {
      const supabase = createRouteHandlerClient();

      const today = new Date().toISOString().split('T')[0];

      // Get today's habits
      const { data: todayEntries } = await supabase
        .from('habit_entries')
        .select('habit_name, habit_category, duration_minutes')
        .eq('user_id', userId)
        .eq('entry_date', today);

      // Get all user habits for categories
      const { data: allEntries } = await supabase
        .from('habit_entries')
        .select('habit_name, habit_category')
        .eq('user_id', userId);

      const uniqueHabits = new Set((allEntries || []).map(e => e.habit_name));
      const uniqueCategories = new Set((allEntries || []).map(e => e.habit_category));
      const todayTime = (todayEntries || []).reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0);

      const stats: HabitStats = {
        total_habits: uniqueHabits.size,
        completed_today: (todayEntries || []).length,
        current_streaks: 0, // Would need streak calculation
        total_time_today: todayTime,
        categories: Array.from(uniqueCategories)
      };

      return { data: stats, error: null };
    } catch (error) {
      return { data: null, error: 'Failed to fetch habit stats' };
    }
  }

  static async getHabitCalendar(userId: string, year: number, month: number): Promise<{ data: HabitCalendarData[]; error: string | null }> {
    try {
      const supabase = createRouteHandlerClient();

      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const { data: entries, error } = await supabase
        .from('habit_entries')
        .select('entry_date, habit_name, duration_minutes, mood_rating')
        .eq('user_id', userId)
        .gte('entry_date', startDate)
        .lte('entry_date', endDate);

      if (error) {
        return { data: [], error: error.message };
      }

      // Group by date
      const dateGroups = (entries || []).reduce((groups, entry) => {
        const date = entry.entry_date;
        if (!groups[date]) {
          groups[date] = {
            date,
            completed_habits: [],
            total_time_minutes: 0,
            completion_count: 0,
            mood_ratings: []
          };
        }
        groups[date].completed_habits.push(entry.habit_name);
        groups[date].total_time_minutes += entry.duration_minutes || 0;
        groups[date].completion_count += 1;
        if (entry.mood_rating) {
          groups[date].mood_ratings.push(entry.mood_rating);
        }
        return groups;
      }, {} as Record<string, any>);

      const calendarData: HabitCalendarData[] = Object.values(dateGroups).map(group => ({
        date: group.date,
        completed_habits: Array.from(new Set(group.completed_habits)),
        total_time_minutes: group.total_time_minutes,
        completion_count: group.completion_count,
        mood_average: group.mood_ratings.length > 0
          ? group.mood_ratings.reduce((sum: number, rating: number) => sum + rating, 0) / group.mood_ratings.length
          : undefined
      }));

      return { data: calendarData, error: null };
    } catch (error) {
      return { data: [], error: 'Failed to fetch habit calendar' };
    }
  }

  // Helper methods for streak calculations
  private static calculateCurrentStreak(entries: any[]): number {
    // Simplified streak calculation
    // In a real implementation, you'd sort by date and count consecutive days
    return Math.min(entries.length, 7); // Placeholder
  }

  private static calculateLongestStreak(entries: any[]): number {
    // Simplified longest streak calculation
    return Math.min(entries.length, 14); // Placeholder
  }

  static async getUserHabits(userId: string): Promise<{ data: string[]; error: string | null }> {
    try {
      const supabase = createRouteHandlerClient();

      const { data: entries, error } = await supabase
        .from('habit_entries')
        .select('habit_name')
        .eq('user_id', userId);

      if (error) {
        return { data: [], error: error.message };
      }

      const uniqueHabits = Array.from(new Set((entries || []).map(e => e.habit_name)));
      return { data: uniqueHabits, error: null };
    } catch (error) {
      return { data: [], error: 'Failed to fetch user habits' };
    }
  }

  static async getUserCategories(userId: string): Promise<{ data: string[]; error: string | null }> {
    try {
      const supabase = createRouteHandlerClient();

      const { data: entries, error } = await supabase
        .from('habit_entries')
        .select('habit_category')
        .eq('user_id', userId);

      if (error) {
        return { data: [], error: error.message };
      }

      const uniqueCategories = Array.from(new Set((entries || []).map(e => e.habit_category)));
      return { data: uniqueCategories, error: null };
    } catch (error) {
      return { data: [], error: 'Failed to fetch user categories' };
    }
  }
}