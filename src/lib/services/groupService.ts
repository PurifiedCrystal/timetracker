import type { Database } from '../../types/database.types';
import type {
  Group,
  GroupInsert,
  GroupUpdate,
  GroupWithMembers,
  GroupWithDetails,
  CreateGroupRequest,
  UpdateGroupRequest,
  ApiResponse,
  ApiError,
  GroupListResponse,
  GroupExportFilter,
  GroupTimeEntry,
  GroupExportData,
} from '../types/group.types';
import { createRouteHandlerClient } from '../supabase-server';

export class GroupService {
  /**
   * Get all groups for the current user
   */
  static async getUserGroups(userId: string): Promise<GroupWithMembers[]> {
    try {
      const supabase = createRouteHandlerClient();
      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          group_memberships!inner(
            *,
            user_profiles(full_name, email)
          )
        `)
        .or(`manager_id.eq.${userId},group_memberships.user_id.eq.${userId}`)
        .eq('group_memberships.is_active', true)
        .is('group_memberships.removed_at', null);

      if (error) throw error;

      // Transform data to include member count
      const groupsWithMembers = data.map(group => ({
        ...group,
        member_count: group.group_memberships.length,
      }));

      return groupsWithMembers;
    } catch (error) {
      console.error('Error fetching user groups:', error);
      throw new Error('Failed to fetch groups');
    }
  }

  /**
   * Get a specific group by ID with full details
   */
  static async getGroupById(groupId: string, userId: string): Promise<GroupWithDetails | null> {
    try {
      // First check if user has access to this group
      const hasAccess = await this.userHasGroupAccess(groupId, userId);
      if (!hasAccess) {
        throw new Error('Access denied to this group');
      }

      const supabase = createRouteHandlerClient();
      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          group_memberships(
            *,
            user_profiles(full_name, email)
          ),
          invitations(
            *
          )
        `)
        .eq('id', groupId)
        .single();

      if (error) throw error;
      if (!data) return null;

      // Count active invitations
      const activeInvitations = data.invitations.filter(
        (inv: any) => inv.status === 'pending' && new Date(inv.expires_at!) > new Date()
      );

      return {
        ...data,
        member_count: data.group_memberships.filter((m: any) => m.is_active && !m.removed_at).length,
        active_invitations_count: activeInvitations.length,
      };
    } catch (error) {
      console.error('Error fetching group:', error);
      throw error;
    }
  }

  /**
   * Create a new group
   */
  static async createGroup(request: CreateGroupRequest, userId: string): Promise<Group> {
    try {
      const groupData: GroupInsert = {
        name: request.name.trim(),
        description: request.description?.trim() || null,
        manager_id: userId,
        max_members: request.max_members || 20,
      };

      const supabase = createRouteHandlerClient();
      const { data, error } = await supabase
        .from('groups')
        .insert(groupData)
        .select()
        .single();

      if (error) throw error;

      // Create admin membership for the creator
      await supabase
        .from('group_memberships')
        .insert({
          group_id: data.id,
          user_id: userId,
          role: 'admin',
          added_by: userId,
          can_export_data: true,
          can_view_reports: true,
          is_active: true,
        });

      return data;
    } catch (error) {
      console.error('Error creating group:', error);
      throw new Error('Failed to create group');
    }
  }

  /**
   * Update an existing group
   */
  static async updateGroup(
    groupId: string,
    request: UpdateGroupRequest,
    userId: string
  ): Promise<Group> {
    try {
      // Check if user is group manager
      const isManager = await this.isGroupManager(groupId, userId);
      if (!isManager) {
        throw new Error('Only group managers can update group details');
      }

      const updateData: GroupUpdate = {};
      if (request.name !== undefined) updateData.name = request.name.trim();
      if (request.description !== undefined) updateData.description = request.description?.trim() || null;
      if (request.max_members !== undefined) updateData.max_members = request.max_members;

      const supabase = createRouteHandlerClient();
      const { data, error } = await supabase
        .from('groups')
        .update(updateData)
        .eq('id', groupId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating group:', error);
      throw error;
    }
  }

  /**
   * Delete a group (soft delete - sets manager_id to null)
   */
  static async deleteGroup(groupId: string, userId: string): Promise<void> {
    try {
      // Check if user is group manager
      const isManager = await this.isGroupManager(groupId, userId);
      if (!isManager) {
        throw new Error('Only group managers can delete groups');
      }

      const supabase = createRouteHandlerClient();

      // Soft delete by setting manager_id to null and deactivating all memberships
      const { error: updateError } = await supabase
        .from('groups')
        .update({ manager_id: 'deleted' }) // Using a placeholder since manager_id is required
        .eq('id', groupId);

      if (updateError) throw updateError;

      // Deactivate all memberships
      const { error: membershipError } = await supabase
        .from('group_memberships')
        .update({
          is_active: false,
          removed_at: new Date().toISOString(),
          removed_by: userId,
        })
        .eq('group_id', groupId);

      if (membershipError) throw membershipError;

      // Cancel all pending invitations
      const { error: invitationError } = await supabase
        .from('invitations')
        .update({ status: 'cancelled' })
        .eq('group_id', groupId)
        .eq('status', 'pending');

      if (invitationError) throw invitationError;
    } catch (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
  }

  /**
   * Get time entries for group export
   */
  static async getGroupTimeEntries(filter: GroupExportFilter): Promise<GroupTimeEntry[]> {
    try {
      const supabase = createRouteHandlerClient();
      const { data, error } = await supabase
        .from('time_entries')
        .select(`
          *,
          user_profiles(full_name, email)
        `)
        .eq('group_id', filter.group_id)
        .gte('clock_in', filter.date_range_start)
        .lte('clock_in', filter.date_range_end)
        .in('user_id', filter.include_members.length > 0 ? filter.include_members : [''])
        .order('clock_in', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching group time entries:', error);
      throw new Error('Failed to fetch group time entries');
    }
  }

  /**
   * Generate group export data
   */
  static async generateGroupExportData(filter: GroupExportFilter, userId: string): Promise<GroupExportData> {
    try {
      // Verify user has export permissions
      const canExport = await this.userCanExportData(filter.group_id, userId);
      if (!canExport) {
        throw new Error('User does not have permission to export group data');
      }

      const [group, members, timeEntries] = await Promise.all([
        this.getGroupById(filter.group_id, userId),
        this.getGroupMembers(filter.group_id, userId),
        this.getGroupTimeEntries(filter),
      ]);

      if (!group) {
        throw new Error('Group not found');
      }

      // Calculate summary
      const totalHours = timeEntries.reduce((sum, entry) => {
        return sum + (entry.duration_minutes || 0) / 60;
      }, 0);

      return {
        group,
        members,
        time_entries: timeEntries,
        export_summary: {
          total_hours: totalHours,
          total_members: members.length,
          date_range: {
            start: filter.date_range_start,
            end: filter.date_range_end,
          },
        },
      };
    } catch (error) {
      console.error('Error generating group export data:', error);
      throw error;
    }
  }

  /**
   * Helper: Check if user has access to group
   */
  static async userHasGroupAccess(groupId: string, userId: string): Promise<boolean> {
    try {
      const supabase = createRouteHandlerClient();
      const { data, error } = await supabase
        .from('group_memberships')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .is('removed_at', null)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking group access:', error);
      return false;
    }
  }

  /**
   * Helper: Check if user is group manager
   */
  static async isGroupManager(groupId: string, userId: string): Promise<boolean> {
    try {
      const supabase = createRouteHandlerClient();
      const { data, error } = await supabase
        .from('groups')
        .select('manager_id')
        .eq('id', groupId)
        .single();

      if (error) throw error;
      return data.manager_id === userId;
    } catch (error) {
      console.error('Error checking group manager status:', error);
      return false;
    }
  }

  /**
   * Helper: Check if user can export data
   */
  static async userCanExportData(groupId: string, userId: string): Promise<boolean> {
    try {
      const supabase = createRouteHandlerClient();
      const { data, error } = await supabase
        .from('group_memberships')
        .select('can_export_data, role')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .is('removed_at', null)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return false;

      return data.can_export_data || data.role === 'admin';
    } catch (error) {
      console.error('Error checking export permissions:', error);
      return false;
    }
  }

  /**
   * Helper: Get group members (used by export functionality)
   */
  static async getGroupMembers(groupId: string, userId: string) {
    try {
      const hasAccess = await this.userHasGroupAccess(groupId, userId);
      if (!hasAccess) {
        throw new Error('Access denied to group members');
      }

      const supabase = createRouteHandlerClient();
      const { data, error } = await supabase
        .from('group_memberships')
        .select(`
          *,
          user_profiles(full_name, email)
        `)
        .eq('group_id', groupId)
        .eq('is_active', true)
        .is('removed_at', null);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching group members:', error);
      throw error;
    }
  }
}