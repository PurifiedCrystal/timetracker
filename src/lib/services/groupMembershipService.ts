import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database.types';
import type {
  GroupMembership,
  GroupMembershipInsert,
  GroupMembershipUpdate,
  MembershipWithUser,
  AddMemberRequest,
  UpdateMemberRequest,
  GroupRole,
  MemberListResponse,
} from '../types/group.types';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export class GroupMembershipService {
  /**
   * Get all members of a group
   */
  static async getGroupMembers(groupId: string, userId: string): Promise<MembershipWithUser[]> {
    try {
      // Verify user has access to this group
      const hasAccess = await this.userHasGroupAccess(groupId, userId);
      if (!hasAccess) {
        throw new Error('Access denied to group members');
      }

      const { data, error } = await supabase
        .from('group_memberships')
        .select(`
          *,
          user_profiles(full_name, email)
        `)
        .eq('group_id', groupId)
        .eq('is_active', true)
        .is('removed_at', null)
        .order('joined_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching group members:', error);
      throw error;
    }
  }

  /**
   * Add a member to a group
   */
  static async addMember(
    groupId: string,
    request: AddMemberRequest,
    addedBy: string
  ): Promise<GroupMembership> {
    try {
      // Check if user can add members (must be admin or group manager)
      const canAdd = await this.userCanManageMembers(groupId, addedBy);
      if (!canAdd) {
        throw new Error('Insufficient permissions to add members');
      }

      // Check if user is already a member
      const existingMembership = await this.getExistingMembership(groupId, request.user_id);
      if (existingMembership && existingMembership.is_active && !existingMembership.removed_at) {
        throw new Error('User is already an active member of this group');
      }

      // Check group capacity
      await this.checkGroupCapacity(groupId);

      // Create or reactivate membership
      if (existingMembership) {
        // Reactivate existing membership
        const { data, error } = await supabase
          .from('group_memberships')
          .update({
            is_active: true,
            removed_at: null,
            removed_by: null,
            role: request.role || 'member',
            can_export_data: request.can_export_data || false,
            can_view_reports: request.can_view_reports !== false, // Default true
            hourly_rate: request.hourly_rate || null,
            notes: request.notes || null,
            added_by: addedBy,
            last_activity_at: new Date().toISOString(),
          })
          .eq('id', existingMembership.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new membership
        const membershipData: GroupMembershipInsert = {
          group_id: groupId,
          user_id: request.user_id,
          role: request.role || 'member',
          added_by: addedBy,
          can_export_data: request.can_export_data || false,
          can_view_reports: request.can_view_reports !== false, // Default true
          hourly_rate: request.hourly_rate || null,
          notes: request.notes || null,
          is_active: true,
        };

        const { data, error } = await supabase
          .from('group_memberships')
          .insert(membershipData)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error adding group member:', error);
      throw error;
    }
  }

  /**
   * Update a member's details
   */
  static async updateMember(
    groupId: string,
    memberId: string,
    request: UpdateMemberRequest,
    updatedBy: string
  ): Promise<GroupMembership> {
    try {
      // Check if user can update members
      const canUpdate = await this.userCanManageMembers(groupId, updatedBy);
      if (!canUpdate) {
        throw new Error('Insufficient permissions to update members');
      }

      // Get existing membership
      const membership = await this.getMembershipById(memberId);
      if (!membership || membership.group_id !== groupId) {
        throw new Error('Member not found in this group');
      }

      // Prepare update data
      const updateData: GroupMembershipUpdate = {
        last_activity_at: new Date().toISOString(),
      };

      if (request.role !== undefined) updateData.role = request.role;
      if (request.can_export_data !== undefined) updateData.can_export_data = request.can_export_data;
      if (request.can_view_reports !== undefined) updateData.can_view_reports = request.can_view_reports;
      if (request.hourly_rate !== undefined) updateData.hourly_rate = request.hourly_rate;
      if (request.notes !== undefined) updateData.notes = request.notes;

      const { data, error } = await supabase
        .from('group_memberships')
        .update(updateData)
        .eq('id', memberId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating group member:', error);
      throw error;
    }
  }

  /**
   * Remove a member from a group (soft delete)
   */
  static async removeMember(
    groupId: string,
    memberId: string,
    removedBy: string
  ): Promise<void> {
    try {
      // Check if user can remove members
      const canRemove = await this.userCanManageMembers(groupId, removedBy);
      if (!canRemove) {
        throw new Error('Insufficient permissions to remove members');
      }

      // Get existing membership
      const membership = await this.getMembershipById(memberId);
      if (!membership || membership.group_id !== groupId) {
        throw new Error('Member not found in this group');
      }

      // Don't allow removing the group manager
      const isGroupManager = await this.isGroupManager(groupId, membership.user_id);
      if (isGroupManager) {
        throw new Error('Cannot remove the group manager');
      }

      // Soft delete membership
      const { error } = await supabase
        .from('group_memberships')
        .update({
          is_active: false,
          removed_at: new Date().toISOString(),
          removed_by: removedBy,
        })
        .eq('id', memberId);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing group member:', error);
      throw error;
    }
  }

  /**
   * Update member's hourly rate
   */
  static async updateMemberHourlyRate(
    groupId: string,
    memberId: string,
    hourlyRate: number | null,
    updatedBy: string
  ): Promise<void> {
    try {
      const canUpdate = await this.userCanManageMembers(groupId, updatedBy);
      if (!canUpdate) {
        throw new Error('Insufficient permissions to update hourly rates');
      }

      const { error } = await supabase
        .from('group_memberships')
        .update({
          hourly_rate: hourlyRate,
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', memberId)
        .eq('group_id', groupId);

      if (error) throw error;

      // Also update the hourly_rates table if needed
      if (hourlyRate !== null) {
        const membership = await this.getMembershipById(memberId);
        if (membership) {
          await supabase
            .from('hourly_rates')
            .upsert({
              user_id: membership.user_id,
              group_id: groupId,
              hourly_rate: hourlyRate,
              set_by: updatedBy,
              is_active: true,
              currency: 'USD', // Default currency
            });
        }
      }
    } catch (error) {
      console.error('Error updating member hourly rate:', error);
      throw error;
    }
  }

  /**
   * Get member permissions in a group
   */
  static async getMemberPermissions(groupId: string, userId: string) {
    try {
      const membership = await this.getExistingMembership(groupId, userId);
      if (!membership || !membership.is_active || membership.removed_at) {
        return null;
      }

      const isManager = await this.isGroupManager(groupId, userId);

      return {
        can_export_data: membership.can_export_data || membership.role === 'admin' || isManager,
        can_view_reports: membership.can_view_reports || membership.role === 'admin' || isManager,
        can_manage_members: membership.role === 'admin' || isManager,
        can_create_invitations: membership.role === 'admin' || isManager,
        can_edit_group: isManager,
        can_delete_group: isManager,
        is_admin: membership.role === 'admin',
        is_manager: isManager,
        hourly_rate: membership.hourly_rate,
      };
    } catch (error) {
      console.error('Error getting member permissions:', error);
      return null;
    }
  }

  /**
   * Get membership statistics for a group
   */
  static async getGroupMembershipStats(groupId: string, userId: string) {
    try {
      const hasAccess = await this.userHasGroupAccess(groupId, userId);
      if (!hasAccess) {
        throw new Error('Access denied to group statistics');
      }

      const { data: memberships, error } = await supabase
        .from('group_memberships')
        .select('role, is_active, removed_at, joined_at')
        .eq('group_id', groupId);

      if (error) throw error;

      const stats = {
        total_members: 0,
        active_members: 0,
        admin_count: 0,
        member_count: 0,
        removed_members: 0,
        recent_joins: 0, // Joined in last 30 days
      };

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      memberships.forEach(membership => {
        stats.total_members++;

        if (membership.is_active && !membership.removed_at) {
          stats.active_members++;
          if (membership.role === 'admin') {
            stats.admin_count++;
          } else {
            stats.member_count++;
          }

          if (membership.joined_at && new Date(membership.joined_at) > thirtyDaysAgo) {
            stats.recent_joins++;
          }
        } else {
          stats.removed_members++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting group membership stats:', error);
      throw error;
    }
  }

  // Helper methods

  /**
   * Check if user has access to group
   */
  private static async userHasGroupAccess(groupId: string, userId: string): Promise<boolean> {
    try {
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
   * Check if user can manage members
   */
  private static async userCanManageMembers(groupId: string, userId: string): Promise<boolean> {
    try {
      // Check if user is group manager
      const isManager = await this.isGroupManager(groupId, userId);
      if (isManager) return true;

      // Check if user is admin
      const { data, error } = await supabase
        .from('group_memberships')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .is('removed_at', null)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data?.role === 'admin';
    } catch (error) {
      console.error('Error checking member management permissions:', error);
      return false;
    }
  }

  /**
   * Check if user is group manager
   */
  private static async isGroupManager(groupId: string, userId: string): Promise<boolean> {
    try {
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
   * Get existing membership
   */
  private static async getExistingMembership(groupId: string, userId: string): Promise<GroupMembership | null> {
    try {
      const { data, error } = await supabase
        .from('group_memberships')
        .select('*')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Error getting existing membership:', error);
      return null;
    }
  }

  /**
   * Get membership by ID
   */
  private static async getMembershipById(memberId: string): Promise<GroupMembership | null> {
    try {
      const { data, error } = await supabase
        .from('group_memberships')
        .select('*')
        .eq('id', memberId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Error getting membership by ID:', error);
      return null;
    }
  }

  /**
   * Check group capacity
   */
  private static async checkGroupCapacity(groupId: string): Promise<void> {
    try {
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('max_members')
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;

      const { data: members, error: memberError } = await supabase
        .from('group_memberships')
        .select('id', { count: 'exact' })
        .eq('group_id', groupId)
        .eq('is_active', true)
        .is('removed_at', null);

      if (memberError) throw memberError;

      const currentCount = members?.length || 0;
      if (currentCount >= group.max_members) {
        throw new Error(`Group has reached its maximum capacity of ${group.max_members} members`);
      }
    } catch (error) {
      console.error('Error checking group capacity:', error);
      throw error;
    }
  }
}