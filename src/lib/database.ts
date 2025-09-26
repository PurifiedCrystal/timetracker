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
        .eq('user_id', userId) // Use 'user_id' to find profile by auth user ID
        .single()
    );
  },

  async update(userId: string, updates: any) {
    return dbQuery(() =>
      supabaseAdmin()
        .from('user_profiles')
        .update(updates)
        .eq('user_id', userId) // Use 'user_id' to find profile by auth user ID
        .select()
        .single()
    );
  },

  async create(profile: any) {
    return dbQuery(() =>
      supabaseAdmin()
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
    let query = supabaseAdmin()
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
      supabaseAdmin()
        .from('time_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('id', entryId)
        .single()
    );
  },

  async getActive(userId: string) {
    return dbQuery(async () => {
      const { data, error } = await supabaseAdmin()
        .from('time_entries')
        .select('*')
        .eq('user_id', userId)
        .is('clock_out', null)
        .limit(1);

      if (error) throw error;

      return { data: data?.[0] || null, error: null };
    });
  },

  async create(userId: string, data: { clock_in: string; metadata?: any; group_id?: string }) {
    const insertData: any = {
      user_id: userId,
      clock_in: data.clock_in,
      metadata: data.metadata || {}
    };

    if (data.group_id) {
      insertData.group_id = data.group_id;
    }

    return dbQuery(() =>
      supabaseAdmin()
        .from('time_entries')
        .insert([insertData])
        .select()
        .single()
    );
  },

  async update(userId: string, entryId: string, updates: any) {
    return dbQuery(() =>
      supabaseAdmin()
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
      supabaseAdmin()
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
      supabaseAdmin()
        .from('subscriptions')
        .upsert([subscription], { onConflict: 'user_id' })
        .select()
        .single()
    );
  },

  async updateStatus(userId: string, status: string) {
    return dbQuery(() =>
      supabaseAdmin()
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
 * Groups Operations
 */
export const groups = {
  async list(userId: string) {
    return dbQuery(() =>
      supabase
        .from('groups')
        .select(`
          *,
          group_memberships!inner(role),
          _count_memberships:group_memberships(count)
        `)
        .eq('group_memberships.user_id', userId)
        .order('created_at', { ascending: false })
    );
  },

  async get(userId: string, groupId: string) {
    return dbQuery(() =>
      supabase
        .from('groups')
        .select(`
          *,
          group_memberships!inner(role, joined_at),
          _count_memberships:group_memberships(count)
        `)
        .eq('id', groupId)
        .eq('group_memberships.user_id', userId)
        .single()
    );
  },

  async create(userId: string, groupData: any) {
    return dbQuery(async () => {
      // Create the group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert([{
          name: groupData.name,
          description: groupData.description,
          manager_id: userId,
          max_members: groupData.max_members || 3
        }])
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as manager member
      const { error: memberError } = await supabase
        .from('group_memberships')
        .insert([{
          group_id: group.id,
          user_id: userId,
          role: 'manager'
        }]);

      if (memberError) throw memberError;

      return { data: group, error: null };
    });
  },

  async update(userId: string, groupId: string, updates: any) {
    return dbQuery(async () => {
      // Check if user is manager
      const { data: membership } = await supabase
        .from('group_memberships')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .single();

      if (!membership || membership.role !== 'manager') {
        throw new Error('Only managers can update groups');
      }

      return await supabase
        .from('groups')
        .update(updates)
        .eq('id', groupId)
        .select()
        .single();
    });
  },

  async delete(userId: string, groupId: string) {
    return dbQuery(async () => {
      // Check if user is manager
      const { data: membership } = await supabase
        .from('group_memberships')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .single();

      if (!membership || membership.role !== 'manager') {
        throw new Error('Only managers can delete groups');
      }

      return await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);
    });
  }
};

/**
 * Group Memberships Operations
 */
export const groupMemberships = {
  async list(groupId: string) {
    return dbQuery(() =>
      supabase
        .from('group_memberships')
        .select(`
          *,
          user_profiles(id, full_name, email)
        `)
        .eq('group_id', groupId)
        .order('joined_at', { ascending: true })
    );
  },

  async add(groupId: string, userId: string, role: 'manager' | 'member' = 'member') {
    return dbQuery(() =>
      supabase
        .from('group_memberships')
        .insert([{
          group_id: groupId,
          user_id: userId,
          role
        }])
        .select()
        .single()
    );
  },

  async updateRole(membershipId: string, role: 'manager' | 'member') {
    return dbQuery(() =>
      supabase
        .from('group_memberships')
        .update({ role })
        .eq('id', membershipId)
        .select()
        .single()
    );
  },

  async remove(membershipId: string) {
    return dbQuery(() =>
      supabase
        .from('group_memberships')
        .delete()
        .eq('id', membershipId)
    );
  }
};

/**
 * Habits Operations
 */
export const habits = {
  async list(userId: string, options?: { entry_date?: string }) {
    let query = supabase
      .from('habit_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options?.entry_date) {
      query = query.eq('entry_date', options.entry_date);
    }

    return dbQuery(() => query);
  },

  async create(userId: string, habitData: any) {
    return dbQuery(() =>
      supabase
        .from('habit_entries')
        .insert([{
          user_id: userId,
          habit_name: habitData.habit_name,
          habit_category: habitData.habit_category || 'personal',
          entry_type: habitData.entry_type || 'completion',
          completed_at: habitData.completed_at,
          start_time: habitData.start_time,
          end_time: habitData.end_time,
          duration_minutes: habitData.duration_minutes,
          count_value: habitData.count_value || 1,
          target_value: habitData.target_value,
          notes: habitData.notes,
          mood_rating: habitData.mood_rating,
          entry_date: habitData.entry_date || new Date().toISOString().split('T')[0]
        }])
        .select()
        .single()
    );
  },

  async update(userId: string, entryId: string, updates: any) {
    return dbQuery(() =>
      supabase
        .from('habit_entries')
        .update(updates)
        .eq('user_id', userId)
        .eq('id', entryId)
        .select()
        .single()
    );
  },

  async delete(userId: string, entryId: string) {
    return dbQuery(() =>
      supabase
        .from('habit_entries')
        .delete()
        .eq('user_id', userId)
        .eq('id', entryId)
    );
  },

  async getStats(userId: string) {
    return dbQuery(async () => {
      const today = new Date().toISOString().split('T')[0];

      // Get all habit entries
      const { data: allEntries } = await supabase
        .from('habit_entries')
        .select('*')
        .eq('user_id', userId);

      // Get today's entries
      const { data: todayEntries } = await supabase
        .from('habit_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('entry_date', today);

      // Get unique habits
      const uniqueHabits = new Set(allEntries?.map(entry => entry.habit_name) || []);
      const completedToday = todayEntries?.length || 0;

      // Calculate streak (simplified)
      let streak = 0;
      const recent = allEntries
        ?.sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime())
        ?.slice(0, 30) || [];

      let currentDate = new Date();
      for (let i = 0; i < 30; i++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const hasEntry = recent.some(entry => entry.entry_date === dateStr);
        if (hasEntry) {
          streak++;
        } else if (i > 0) {
          break;
        }
        currentDate.setDate(currentDate.getDate() - 1);
      }

      const totalEntries = allEntries?.length || 0;
      const completionRate = totalEntries > 0 ? Math.round((completedToday / uniqueHabits.size) * 100) : 0;

      return {
        data: {
          total_habits: uniqueHabits.size,
          completed_today: completedToday,
          streak,
          completion_rate: Math.min(completionRate, 100)
        },
        error: null
      };
    });
  },

  async getReports(userId: string, startDate: string, endDate: string) {
    return dbQuery(() =>
      supabase
        .from('habit_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('entry_date', startDate)
        .lte('entry_date', endDate)
        .order('entry_date', { ascending: true })
    );
  }
};

/**
 * Invitations Operations
 */
export const invitations = {
  async create(groupId: string, invitedBy: string, invitedEmail?: string) {
    return dbQuery(async () => {
      // Generate unique invitation code
      const invitationCode = Math.random().toString(36).substring(2, 15) +
                            Math.random().toString(36).substring(2, 15);

      // Create QR code data (URL that points to invitation acceptance)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const qrCodeData = `${baseUrl}/invitation/${invitationCode}`;

      const { data: invitation, error } = await supabase
        .from('invitations')
        .insert([{
          group_id: groupId,
          invited_by: invitedBy,
          invited_email: invitedEmail,
          invitation_code: invitationCode,
          qr_code_data: qrCodeData,
          status: 'pending',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        }])
        .select()
        .single();

      if (error) throw error;
      return { data: invitation, error: null };
    });
  },

  async get(invitationCode: string) {
    return dbQuery(() =>
      supabase
        .from('invitations')
        .select(`
          *,
          groups(id, name, description, max_members),
          invited_by_profile:user_profiles!invitations_invited_by_fkey(full_name, email)
        `)
        .eq('invitation_code', invitationCode)
        .single()
    );
  },

  async accept(invitationCode: string, acceptedBy: string) {
    return dbQuery(async () => {
      // Get invitation details
      const { data: invitation } = await supabase
        .from('invitations')
        .select('*, groups(max_members)')
        .eq('invitation_code', invitationCode)
        .eq('status', 'pending')
        .single();

      if (!invitation) {
        throw new Error('Invitation not found or already used');
      }

      // Check if invitation is expired
      if (new Date(invitation.expires_at) < new Date()) {
        throw new Error('Invitation has expired');
      }

      // Check group capacity
      const { data: currentMembers } = await supabase
        .from('group_memberships')
        .select('id')
        .eq('group_id', invitation.group_id);

      if (currentMembers && currentMembers.length >= invitation.groups.max_members) {
        throw new Error('Group is full');
      }

      // Add user to group
      const { error: membershipError } = await supabase
        .from('group_memberships')
        .insert([{
          group_id: invitation.group_id,
          user_id: acceptedBy,
          role: 'member'
        }]);

      if (membershipError) throw membershipError;

      // Update invitation status
      const { data: updatedInvitation, error: updateError } = await supabase
        .from('invitations')
        .update({
          status: 'accepted',
          accepted_by: acceptedBy,
          accepted_at: new Date().toISOString()
        })
        .eq('invitation_code', invitationCode)
        .select()
        .single();

      if (updateError) throw updateError;

      return { data: updatedInvitation, error: null };
    });
  },

  async decline(invitationCode: string) {
    return dbQuery(() =>
      supabase
        .from('invitations')
        .update({
          status: 'declined'
        })
        .eq('invitation_code', invitationCode)
        .eq('status', 'pending')
        .select()
        .single()
    );
  },

  async listByGroup(groupId: string) {
    return dbQuery(() =>
      supabase
        .from('invitations')
        .select(`
          *,
          invited_by_profile:user_profiles!invitations_invited_by_fkey(full_name, email),
          accepted_by_profile:user_profiles!invitations_accepted_by_fkey(full_name, email)
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
    );
  },

  async expire(invitationCode: string) {
    return dbQuery(() =>
      supabase
        .from('invitations')
        .update({
          status: 'expired'
        })
        .eq('invitation_code', invitationCode)
        .eq('status', 'pending')
        .select()
        .single()
    );
  }
};

/**
 * Exports Operations
 */
export const exports = {
  async generateTimeTracking(userId: string, options: {
    startDate: string;
    endDate: string;
    format: 'csv' | 'pdf';
    groupId?: string;
    includeBreaks?: boolean;
  }) {
    return dbQuery(async () => {
      // Get time entries for the specified period
      let query = supabase
        .from('time_entries')
        .select(`
          *,
          group:groups(id, name)
        `)
        .eq('user_id', userId)
        .gte('clock_in', options.startDate)
        .lte('clock_in', options.endDate)
        .order('clock_in', { ascending: true });

      if (options.groupId) {
        query = query.eq('group_id', options.groupId);
      }

      const { data: entries, error } = await query;
      if (error) throw error;

      // Calculate totals
      const totalHours = entries?.reduce((sum, entry) => {
        return sum + (entry.duration_minutes || 0);
      }, 0) || 0;

      const totalBreaks = entries?.reduce((sum, entry) => {
        return sum + (entry.break_minutes || 0);
      }, 0) || 0;

      const totalOvertime = entries?.reduce((sum, entry) => {
        return sum + (entry.overtime_minutes || 0);
      }, 0) || 0;

      // Generate export ID
      const exportId = Math.random().toString(36).substring(2, 15);

      const exportData = {
        id: exportId,
        type: 'time_tracking',
        format: options.format,
        generated_at: new Date().toISOString(),
        user_id: userId,
        period: {
          start_date: options.startDate,
          end_date: options.endDate
        },
        summary: {
          total_entries: entries?.length || 0,
          total_hours: Math.round(totalHours / 60 * 100) / 100,
          total_breaks_minutes: totalBreaks,
          total_overtime_minutes: totalOvertime,
          average_hours_per_day: entries?.length > 0 ? Math.round((totalHours / 60) / entries.length * 100) / 100 : 0
        },
        entries: entries?.map(entry => ({
          id: entry.id,
          date: new Date(entry.clock_in).toLocaleDateString(),
          clock_in: new Date(entry.clock_in).toLocaleTimeString(),
          clock_out: entry.clock_out ? new Date(entry.clock_out).toLocaleTimeString() : 'Still active',
          duration_hours: Math.round((entry.duration_minutes || 0) / 60 * 100) / 100,
          break_minutes: entry.break_minutes || 0,
          overtime_minutes: entry.overtime_minutes || 0,
          group: entry.group?.name || 'Personal'
        })) || []
      };

      return { data: exportData, error: null };
    });
  },

  async generateHabits(userId: string, options: {
    startDate: string;
    endDate: string;
    format: 'csv' | 'pdf';
    habitName?: string;
    category?: string;
  }) {
    return dbQuery(async () => {
      // Get habit entries for the specified period
      let query = supabase
        .from('habit_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('entry_date', options.startDate)
        .lte('entry_date', options.endDate)
        .order('entry_date', { ascending: true });

      if (options.habitName) {
        query = query.eq('habit_name', options.habitName);
      }

      if (options.category) {
        query = query.eq('habit_category', options.category);
      }

      const { data: entries, error } = await query;
      if (error) throw error;

      // Calculate stats
      const uniqueHabits = new Set(entries?.map(entry => entry.habit_name) || []);
      const completedDays = new Set(entries?.map(entry => entry.entry_date) || []).size;

      // Generate export ID
      const exportId = Math.random().toString(36).substring(2, 15);

      const exportData = {
        id: exportId,
        type: 'habits',
        format: options.format,
        generated_at: new Date().toISOString(),
        user_id: userId,
        period: {
          start_date: options.startDate,
          end_date: options.endDate
        },
        summary: {
          total_entries: entries?.length || 0,
          unique_habits: uniqueHabits.size,
          completed_days: completedDays,
          average_entries_per_day: completedDays > 0 ? Math.round((entries?.length || 0) / completedDays * 100) / 100 : 0
        },
        entries: entries?.map(entry => ({
          id: entry.id,
          date: entry.entry_date,
          habit_name: entry.habit_name,
          category: entry.habit_category,
          type: entry.entry_type,
          completed_at: entry.completed_at ? new Date(entry.completed_at).toLocaleString() : null,
          duration_minutes: entry.duration_minutes,
          count_value: entry.count_value,
          mood_rating: entry.mood_rating,
          notes: entry.notes
        })) || []
      };

      return { data: exportData, error: null };
    });
  },

  async get(exportId: string) {
    // This would typically be stored in a database table for persistent exports
    // For now, we'll return a placeholder
    return dbQuery(() => Promise.resolve({
      data: {
        id: exportId,
        status: 'completed',
        download_url: `/api/v1/exports/${exportId}/download`
      },
      error: null
    }));
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