import { createRouteHandlerClient } from '@/lib/supabase-server';
import type {
  HourlyRate,
  HourlyRateWithDetails,
  CreateHourlyRateRequest,
  UpdateHourlyRateRequest,
  HourlyRateHistory,
  EarningsCalculation
} from '@/types/hourly-rate';

export class HourlyRateService {

  static async createHourlyRate(managerId: string, data: CreateHourlyRateRequest): Promise<{ data: HourlyRate | null; error: string | null }> {
    try {
      const supabase = createRouteHandlerClient();

      // Verify manager has permission to set rates for this group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('id')
        .eq('id', data.group_id)
        .eq('manager_id', managerId)
        .single();

      if (groupError || !group) {
        return { data: null, error: 'Unauthorized to set rates for this group' };
      }

      // Verify user is a member of the group
      const { data: membership, error: membershipError } = await supabase
        .from('group_memberships')
        .select('id')
        .eq('group_id', data.group_id)
        .eq('user_id', data.user_id)
        .single();

      if (membershipError || !membership) {
        return { data: null, error: 'User is not a member of this group' };
      }

      const rateData = {
        group_id: data.group_id,
        user_id: data.user_id,
        set_by: managerId,
        hourly_rate: data.hourly_rate,
        currency: data.currency || 'USD',
        effective_from: data.effective_from || new Date().toISOString(),
        is_active: true
      };

      const { data: hourlyRate, error } = await supabase
        .from('hourly_rates')
        .insert([rateData])
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: hourlyRate, error: null };
    } catch (error) {
      return { data: null, error: 'Failed to create hourly rate' };
    }
  }

  static async getHourlyRate(rateId: string): Promise<{ data: HourlyRateWithDetails | null; error: string | null }> {
    try {
      const supabase = createRouteHandlerClient();

      const { data: rate, error } = await supabase
        .from('hourly_rates')
        .select(`
          *,
          user_profile:user_profiles!user_id(
            full_name,
            email
          ),
          set_by_profile:user_profiles!set_by(
            full_name
          ),
          group:groups!group_id(
            name
          )
        `)
        .eq('id', rateId)
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      const rateWithDetails: HourlyRateWithDetails = {
        ...rate,
        user_name: rate.user_profile?.full_name,
        user_email: rate.user_profile?.email,
        set_by_name: rate.set_by_profile?.full_name,
        group_name: rate.group?.name
      };

      return { data: rateWithDetails, error: null };
    } catch (error) {
      return { data: null, error: 'Failed to fetch hourly rate' };
    }
  }

  static async getGroupHourlyRates(groupId: string): Promise<{ data: HourlyRateWithDetails[]; error: string | null }> {
    try {
      const supabase = createRouteHandlerClient();

      const { data: rates, error } = await supabase
        .from('hourly_rates')
        .select(`
          *,
          user_profile:user_profiles!user_id(
            full_name,
            email
          ),
          set_by_profile:user_profiles!set_by(
            full_name
          )
        `)
        .eq('group_id', groupId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: [], error: error.message };
      }

      const ratesWithDetails: HourlyRateWithDetails[] = (rates || []).map(rate => ({
        ...rate,
        user_name: rate.user_profile?.full_name,
        user_email: rate.user_profile?.email,
        set_by_name: rate.set_by_profile?.full_name
      }));

      return { data: ratesWithDetails, error: null };
    } catch (error) {
      return { data: [], error: 'Failed to fetch group hourly rates' };
    }
  }

  static async getUserHourlyRate(groupId: string, userId: string): Promise<{ data: HourlyRateWithDetails | null; error: string | null }> {
    try {
      const supabase = createRouteHandlerClient();

      const { data: rate, error } = await supabase
        .from('hourly_rates')
        .select(`
          *,
          user_profile:user_profiles!user_id(
            full_name,
            email
          ),
          set_by_profile:user_profiles!set_by(
            full_name
          ),
          group:groups!group_id(
            name
          )
        `)
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      const rateWithDetails: HourlyRateWithDetails = {
        ...rate,
        user_name: rate.user_profile?.full_name,
        user_email: rate.user_profile?.email,
        set_by_name: rate.set_by_profile?.full_name,
        group_name: rate.group?.name
      };

      return { data: rateWithDetails, error: null };
    } catch (error) {
      return { data: null, error: 'Failed to fetch user hourly rate' };
    }
  }

  static async updateHourlyRate(rateId: string, data: UpdateHourlyRateRequest): Promise<{ data: HourlyRate | null; error: string | null }> {
    try {
      const supabase = createRouteHandlerClient();

      const updateData: any = {};
      if (data.hourly_rate !== undefined) updateData.hourly_rate = data.hourly_rate;
      if (data.currency !== undefined) updateData.currency = data.currency;
      if (data.effective_from !== undefined) updateData.effective_from = data.effective_from;
      if (data.effective_until !== undefined) updateData.effective_until = data.effective_until;

      const { data: hourlyRate, error } = await supabase
        .from('hourly_rates')
        .update(updateData)
        .eq('id', rateId)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: hourlyRate, error: null };
    } catch (error) {
      return { data: null, error: 'Failed to update hourly rate' };
    }
  }

  static async deactivateHourlyRate(rateId: string): Promise<{ error: string | null }> {
    try {
      const supabase = createRouteHandlerClient();

      const { error } = await supabase
        .from('hourly_rates')
        .update({
          is_active: false,
          effective_until: new Date().toISOString()
        })
        .eq('id', rateId);

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: 'Failed to deactivate hourly rate' };
    }
  }

  static async deleteHourlyRate(rateId: string): Promise<{ error: string | null }> {
    try {
      const supabase = createRouteHandlerClient();

      const { error } = await supabase
        .from('hourly_rates')
        .delete()
        .eq('id', rateId);

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: 'Failed to delete hourly rate' };
    }
  }

  static async getHourlyRateHistory(groupId: string, userId: string): Promise<{ data: HourlyRateHistory | null; error: string | null }> {
    try {
      const supabase = createRouteHandlerClient();

      const { data: rates, error } = await supabase
        .from('hourly_rates')
        .select(`
          *,
          user_profile:user_profiles!user_id(
            full_name,
            email
          ),
          set_by_profile:user_profiles!set_by(
            full_name
          )
        `)
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error: error.message };
      }

      const ratesWithDetails: HourlyRateWithDetails[] = (rates || []).map(rate => ({
        ...rate,
        user_name: rate.user_profile?.full_name,
        user_email: rate.user_profile?.email,
        set_by_name: rate.set_by_profile?.full_name
      }));

      const currentRate = ratesWithDetails.find(rate => rate.is_active);

      const history: HourlyRateHistory = {
        rates: ratesWithDetails,
        current_rate: currentRate,
        total_changes: ratesWithDetails.length
      };

      return { data: history, error: null };
    } catch (error) {
      return { data: null, error: 'Failed to fetch hourly rate history' };
    }
  }

  static async calculateEarnings(
    groupId: string,
    userId: string,
    startDate: string,
    endDate: string,
    californiaMode: boolean = false
  ): Promise<{ data: EarningsCalculation | null; error: string | null }> {
    try {
      const supabase = createRouteHandlerClient();

      // Get user's current hourly rate
      const { data: rateData } = await this.getUserHourlyRate(groupId, userId);
      if (!rateData) {
        return { data: null, error: 'No hourly rate found for user' };
      }

      // Get time entries for the period
      const { data: timeEntries, error: timeError } = await supabase
        .from('time_entries')
        .select('duration_minutes, clock_in, clock_out')
        .eq('user_id', userId)
        .eq('group_id', groupId)
        .gte('clock_in', startDate)
        .lte('clock_in', endDate)
        .not('clock_out', 'is', null);

      if (timeError) {
        return { data: null, error: timeError.message };
      }

      const totalMinutes = (timeEntries || []).reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0);
      const totalHours = totalMinutes / 60;

      let regularHours = totalHours;
      let overtimeHours = 0;

      if (californiaMode) {
        // California overtime rules: >8 hours per day OR >40 hours per week
        // This is simplified - full implementation would need daily/weekly calculations
        if (totalHours > 40) {
          regularHours = 40;
          overtimeHours = totalHours - 40;
        }
      } else {
        // Standard overtime: >40 hours per week
        if (totalHours > 40) {
          regularHours = 40;
          overtimeHours = totalHours - 40;
        }
      }

      const regularEarnings = regularHours * rateData.hourly_rate;
      const overtimeEarnings = overtimeHours * rateData.hourly_rate * 1.5; // 1.5x for overtime
      const totalEarnings = regularEarnings + overtimeEarnings;

      const calculation: EarningsCalculation = {
        user_id: userId,
        user_name: rateData.user_name,
        hours_worked: totalHours,
        regular_hours: regularHours,
        overtime_hours: overtimeHours,
        hourly_rate: rateData.hourly_rate,
        regular_earnings: regularEarnings,
        overtime_earnings: overtimeEarnings,
        total_earnings: totalEarnings,
        currency: rateData.currency,
        period_start: startDate,
        period_end: endDate
      };

      return { data: calculation, error: null };
    } catch (error) {
      return { data: null, error: 'Failed to calculate earnings' };
    }
  }

  static async calculateGroupEarnings(
    groupId: string,
    startDate: string,
    endDate: string,
    californiaMode: boolean = false
  ): Promise<{ data: EarningsCalculation[]; error: string | null }> {
    try {
      const supabase = createRouteHandlerClient();

      // Get all group members with hourly rates
      const { data: members, error: membersError } = await supabase
        .from('group_memberships')
        .select('user_id')
        .eq('group_id', groupId);

      if (membersError) {
        return { data: [], error: membersError.message };
      }

      const calculations: EarningsCalculation[] = [];

      for (const member of members || []) {
        const { data: calculation, error } = await this.calculateEarnings(
          groupId,
          member.user_id,
          startDate,
          endDate,
          californiaMode
        );

        if (calculation && !error) {
          calculations.push(calculation);
        }
      }

      return { data: calculations, error: null };
    } catch (error) {
      return { data: [], error: 'Failed to calculate group earnings' };
    }
  }
}