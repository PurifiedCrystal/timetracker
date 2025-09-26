import { createRouteHandlerClient } from '@/lib/supabase-server';
import type {
  Group,
  GroupWithMembers,
  GroupMembership,
  CreateGroupRequest,
  UpdateGroupRequest,
  AddMemberRequest,
  UpdateMemberRoleRequest,
  GroupMember,
  GroupStats
} from '@/types/group';

export class GroupService {

  static async createGroup(userId: string, data: CreateGroupRequest): Promise<{ data: Group | null; error: string | null }> {
    try {
      const supabase = createRouteHandlerClient();

      const groupData = {
        name: data.name,
        description: data.description || null,
        manager_id: userId,
        max_members: data.max_members || 3
      };

      const { data: group, error } = await supabase
        .from('groups')
        .insert([groupData])
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: group, error: null };
    } catch (error) {
      return { data: null, error: 'Failed to create group' };
    }
  }

  static async getGroup(groupId: string): Promise<{ data: GroupWithMembers | null; error: string | null }> {
    try {
      const supabase = createRouteHandlerClient();

      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select(`
          *,
          memberships:group_memberships(
            id,
            user_id,
            role,
            joined_at,
            user_profiles!inner(
              full_name,
              email
            )
          )
        `)
        .eq('id', groupId)
        .single();

      if (groupError) {
        return { data: null, error: groupError.message };
      }

      const groupWithMembers: GroupWithMembers = {
        ...group,
        member_count: group.memberships?.length || 0,
        memberships: group.memberships || []
      };

      return { data: groupWithMembers, error: null };
    } catch (error) {
      return { data: null, error: 'Failed to fetch group' };
    }
  }

  static async getUserGroups(userId: string): Promise<{ data: GroupWithMembers[]; error: string | null }> {
    try {
      const supabase = createRouteHandlerClient();

      // Get groups where user is manager or member
      const { data: groups, error } = await supabase
        .from('groups')
        .select(`
          *,
          memberships:group_memberships(
            id,
            user_id,
            role,
            joined_at,
            user_profiles!inner(
              full_name,
              email
            )
          )
        `)
        .or(`manager_id.eq.${userId},id.in.(${await this.getUserGroupIds(userId)})`);

      if (error) {
        return { data: [], error: error.message };
      }

      const groupsWithMembers: GroupWithMembers[] = (groups || []).map(group => ({
        ...group,
        member_count: group.memberships?.length || 0,
        memberships: group.memberships || []
      }));

      return { data: groupsWithMembers, error: null };
    } catch (error) {
      return { data: [], error: 'Failed to fetch user groups' };
    }
  }

  private static async getUserGroupIds(userId: string): Promise<string> {
    try {
      const supabase = createRouteHandlerClient();

      const { data: memberships, error } = await supabase
        .from('group_memberships')
        .select('group_id')
        .eq('user_id', userId);

      if (error || !memberships) {
        return '';
      }

      return memberships.map(m => m.group_id).join(',');
    } catch (error) {
      return '';
    }
  }

  static async updateGroup(groupId: string, data: UpdateGroupRequest): Promise<{ data: Group | null; error: string | null }> {
    try {
      const supabase = createRouteHandlerClient();

      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.max_members !== undefined) updateData.max_members = data.max_members;

      const { data: group, error } = await supabase
        .from('groups')
        .update(updateData)
        .eq('id', groupId)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: group, error: null };
    } catch (error) {
      return { data: null, error: 'Failed to update group' };
    }
  }

  static async deleteGroup(groupId: string): Promise<{ error: string | null }> {
    try {
      const supabase = createRouteHandlerClient();

      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: 'Failed to delete group' };
    }
  }

  static async addMember(groupId: string, data: AddMemberRequest): Promise<{ data: GroupMembership | null; error: string | null }> {
    try {
      const supabase = createRouteHandlerClient();

      // Check if group is at capacity
      const { data: currentMembers } = await supabase
        .from('group_memberships')
        .select('id')
        .eq('group_id', groupId);

      const { data: group } = await supabase
        .from('groups')
        .select('max_members')
        .eq('id', groupId)
        .single();

      if (currentMembers && group && currentMembers.length >= group.max_members) {
        return { data: null, error: 'Group is at maximum capacity' };
      }

      const membershipData = {
        group_id: groupId,
        user_id: data.user_id,
        role: data.role || 'member'
      };

      const { data: membership, error } = await supabase
        .from('group_memberships')
        .insert([membershipData])
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: membership, error: null };
    } catch (error) {
      return { data: null, error: 'Failed to add member' };
    }
  }

  static async removeMember(groupId: string, userId: string): Promise<{ error: string | null }> {
    try {
      const supabase = createRouteHandlerClient();

      const { error } = await supabase
        .from('group_memberships')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: 'Failed to remove member' };
    }
  }

  static async updateMemberRole(groupId: string, userId: string, data: UpdateMemberRoleRequest): Promise<{ data: GroupMembership | null; error: string | null }> {
    try {
      const supabase = createRouteHandlerClient();

      const { data: membership, error } = await supabase
        .from('group_memberships')
        .update({ role: data.role })
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: membership, error: null };
    } catch (error) {
      return { data: null, error: 'Failed to update member role' };
    }
  }

  static async getGroupMembers(groupId: string): Promise<{ data: GroupMember[]; error: string | null }> {
    try {
      const supabase = createRouteHandlerClient();

      const { data: members, error } = await supabase
        .from('group_memberships')
        .select(`
          id,
          user_id,
          role,
          joined_at,
          user_profiles!inner(
            full_name,
            email
          ),
          hourly_rates(
            hourly_rate,
            currency,
            is_active
          )
        `)
        .eq('group_id', groupId)
        .eq('hourly_rates.is_active', true);

      if (error) {
        return { data: [], error: error.message };
      }

      const groupMembers: GroupMember[] = (members || []).map((member: any) => ({
        id: member.id,
        user_id: member.user_id,
        full_name: member.user_profiles?.full_name,
        email: member.user_profiles?.email,
        role: member.role,
        joined_at: member.joined_at,
        hourly_rate: member.hourly_rates?.[0]?.hourly_rate,
        currency: member.hourly_rates?.[0]?.currency
      }));

      return { data: groupMembers, error: null };
    } catch (error) {
      return { data: [], error: 'Failed to fetch group members' };
    }
  }

  static async getGroupStats(groupId: string, startDate?: string, endDate?: string): Promise<{ data: GroupStats | null; error: string | null }> {
    try {
      const supabase = createRouteHandlerClient();

      // Get member count
      const { data: members } = await supabase
        .from('group_memberships')
        .select('id')
        .eq('group_id', groupId);

      // Get time entries for the group within date range
      let query = supabase
        .from('time_entries')
        .select('duration_minutes, user_id')
        .eq('group_id', groupId)
        .not('clock_out', 'is', null);

      if (startDate) query = query.gte('clock_in', startDate);
      if (endDate) query = query.lte('clock_in', endDate);

      const { data: timeEntries } = await query;

      const totalHoursToday = 0; // Would need date filtering
      const totalHoursWeek = timeEntries?.reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0) || 0;

      const stats: GroupStats = {
        total_members: members?.length || 0,
        active_members: members?.length || 0, // Could be refined with recent activity
        total_hours_today: totalHoursToday / 60,
        total_hours_week: totalHoursWeek / 60
      };

      return { data: stats, error: null };
    } catch (error) {
      return { data: null, error: 'Failed to fetch group stats' };
    }
  }
}