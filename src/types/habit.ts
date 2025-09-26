export interface HabitEntry {
  id: string;
  user_id: string;
  habit_name: string;
  habit_category: string;
  entry_type: 'completion' | 'timed' | 'counter';

  // For completion habits
  completed_at?: string;

  // For timed habits
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;

  // For counter habits
  count_value?: number;
  target_value?: number;

  // Metadata
  notes?: string;
  mood_rating?: number; // 1-5 scale
  created_at: string;
  entry_date: string;
}

export interface CreateHabitEntryRequest {
  habit_name: string;
  habit_category?: string;
  entry_type: 'completion' | 'timed' | 'counter';

  // For completion habits
  completed_at?: string;

  // For timed habits
  start_time?: string;
  end_time?: string;

  // For counter habits
  count_value?: number;
  target_value?: number;

  // Optional metadata
  notes?: string;
  mood_rating?: number;
  entry_date?: string;
}

export interface UpdateHabitEntryRequest {
  habit_name?: string;
  habit_category?: string;

  // For timed habits
  start_time?: string;
  end_time?: string;

  // For counter habits
  count_value?: number;
  target_value?: number;

  // Metadata
  notes?: string;
  mood_rating?: number;
}

export interface HabitSummary {
  habit_name: string;
  habit_category: string;
  total_entries: number;
  completion_rate: number; // percentage
  current_streak: number;
  longest_streak: number;
  total_time_minutes?: number; // for timed habits
  average_time_minutes?: number;
  total_count?: number; // for counter habits
  average_count?: number;
}

export interface HabitStats {
  total_habits: number;
  completed_today: number;
  current_streaks: number;
  total_time_today: number;
  categories: string[];
}

export interface HabitCalendarData {
  date: string;
  completed_habits: string[];
  total_time_minutes: number;
  completion_count: number;
  mood_average?: number;
}