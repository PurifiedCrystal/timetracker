import { supabase, supabaseAdmin } from './supabase';

/**
 * Generic database query helper with error handling
 */
export async function dbQuery<T>(
  queryFn: () => any
): Promise<{ data: T | null; error: string | null }> {
  try {
    const { data, error } = await queryFn();

    if (error) {
      console.error('Database query error:', error);
      return { data: null, error: error.message || 'Database error' };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Database query exception:', err);
    return { data: null, error: 'Unexpected database error' };
  }
}

/**
 * User Profile Operations
 */
export const userProfiles = {
  async get(userId: string) {
    return dbQuery(() =>
      supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()
    );
  },

  async update(userId: string, updates: any) {
    return dbQuery(() =>
      supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()
    );
  },

  async create(profile: any) {
    return dbQuery(() =>
      supabase
        .from('user_profiles')
        .insert([profile])
        .select()
        .single()
    );
  }
};

/**
 * Time Entry Operations
 */
export const timeEntries = {
  async list(userId: string, options?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) {
    let query = supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', userId)
      .order('clock_in', { ascending: false });

    if (options?.startDate) {
      query = query.gte('clock_in', options.startDate);
    }

    if (options?.endDate) {
      query = query.lte('clock_in', options.endDate);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    return dbQuery(() => query);
  },

  async get(userId: string, entryId: string) {
    return dbQuery(() =>
      supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('id', entryId)
        .single()
    );
  },

  async getActive(userId: string) {
    return dbQuery(() =>
      supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', userId)
        .is('clock_out', null)
        .single()
    );
  },

  async create(userId: string, data: { clock_in: string; metadata?: any }) {
    return dbQuery(() =>
      supabase
        .from('time_entries')
        .insert([{
          user_id: userId,
          clock_in: data.clock_in,
          metadata: data.metadata || {}
        }])
        .select()
        .single()
    );
  },

  async update(userId: string, entryId: string, updates: any) {
    return dbQuery(() =>
      supabase
        .from('time_entries')
        .update(updates)
        .eq('user_id', userId)
        .eq('id', entryId)
        .select()
        .single()
    );
  },

  async clockOut(userId: string, entryId: string, clockOut: string, breakMinutes = 0) {
    return dbQuery(() =>
      supabase
        .from('time_entries')
        .update({
          clock_out: clockOut,
          break_minutes: breakMinutes
        })
        .eq('user_id', userId)
        .eq('id', entryId)
        .select()
        .single()
    );
  }
};

/**
 * Subscription Operations
 */
export const subscriptions = {
  async get(userId: string) {
    return dbQuery(() =>
      supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single()
    );
  },

  async upsert(subscription: any) {
    return dbQuery(() =>
      supabaseAdmin
        .from('subscriptions')
        .upsert([subscription], { onConflict: 'user_id' })
        .select()
        .single()
    );
  },

  async updateStatus(userId: string, status: string) {
    return dbQuery(() =>
      supabaseAdmin
        .from('subscriptions')
        .update({ status })
        .eq('user_id', userId)
        .select()
        .single()
    );
  }
};

/**
 * Export Configuration Operations
 */
export const exportConfigurations = {
  async list(userId: string) {
    return dbQuery(() =>
      supabase
        .from('export_configurations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
    );
  },

  async get(userId: string, configId: string) {
    return dbQuery(() =>
      supabase
        .from('export_configurations')
        .select('*')
        .eq('user_id', userId)
        .eq('id', configId)
        .single()
    );
  },

  async create(userId: string, config: any) {
    return dbQuery(() =>
      supabase
        .from('export_configurations')
        .insert([{
          user_id: userId,
          ...config
        }])
        .select()
        .single()
    );
  },

  async update(userId: string, configId: string, updates: any) {
    return dbQuery(() =>
      supabase
        .from('export_configurations')
        .update(updates)
        .eq('user_id', userId)
        .eq('id', configId)
        .select()
        .single()
    );
  },

  async delete(userId: string, configId: string) {
    return dbQuery(() =>
      supabase
        .from('export_configurations')
        .delete()
        .eq('user_id', userId)
        .eq('id', configId)
    );
  }
};

/**
 * Analytics and Reporting
 */
export const analytics = {
  async getDailyHours(userId: string, date: string) {
    return dbQuery(() =>
      supabase
        .rpc('calculate_daily_hours', {
          p_user_id: userId,
          p_date: date
        })
    );
  },

  async getWeeklyHours(userId: string, weekStart: string) {
    return dbQuery(() =>
      supabase
        .rpc('calculate_weekly_hours', {
          p_user_id: userId,
          p_week_start: weekStart
        })
    );
  },

  async getTimeEntriesForPeriod(userId: string, startDate: string, endDate: string) {
    return dbQuery(() =>
      supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('clock_in', startDate)
        .lte('clock_in', endDate)
        .order('clock_in', { ascending: true })
    );
  }
};

/**
 * Real-time subscriptions
 */
export const realtime = {
  subscribeToTimeEntries(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`time_entries:user_id=eq.${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_entries',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();
  },

  subscribeToSubscription(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`subscriptions:user_id=eq.${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();
  }
};