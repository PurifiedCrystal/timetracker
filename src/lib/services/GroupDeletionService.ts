// T015: Create GroupDeletionService in src/lib/services/GroupDeletionService.ts
// Feature: 006-group-creation-qr

import { createRouteHandlerClient } from '@/lib/supabase-server';
import {
  GroupDeletionRequest,
  GroupDeletionResponse,
  GroupDeletionPreviewResponse
} from '@/lib/types/invitations';

export class GroupDeletionService {
  private supabase: any;

  constructor() {
    this.supabase = createRouteHandlerClient();
  }

  /**
   * Preview group deletion impact
   */
  async previewGroupDeletion(
    groupId: string,
    userId: string
  ): Promise<GroupDeletionPreviewResponse> {
    try {
      // Verify user is group manager
      await this.verifyGroupManager(groupId, userId);

      // Gather deletion impact data
      const [
        memberCount,
        timeEntryCount,
        pendingInvitations,
        activeSessions,
        qrCodesActive,
        shareableLinksActive
      ] = await Promise.all([
        this.getMemberCount(groupId),
        this.getTimeEntryCount(groupId),
        this.getPendingInvitationCount(groupId),
        this.getActiveSessionCount(groupId),
        this.getActiveQRCodeCount(groupId),
        this.getActiveShareableLinkCount(groupId)
      ]);

      // Check for blockers
      const blockers = [];
      if (activeSessions > 0) {
        const sessionUsers = await this.getActiveSessionUsers(groupId);
        blockers.push({
          type: 'active_sessions' as const,
          message: `${activeSessions} active time tracking session${activeSessions > 1 ? 's' : ''} must be ended first`,
          resolution: 'End all active time tracking sessions before deleting the group'
        });
      }

      // Check for pending exports (if applicable)
      const pendingExports = await this.getPendingExportCount(groupId);
      if (pendingExports > 0) {
        blockers.push({
          type: 'pending_exports' as const,
          message: `${pendingExports} export operation${pendingExports > 1 ? 's' : ''} in progress`,
          resolution: 'Wait for export operations to complete before deleting'
        });
      }

      // Generate warnings
      const warnings = [];
      if (memberCount > 0) {
        warnings.push({
          type: 'member_impact' as const,
          message: `${memberCount} team member${memberCount > 1 ? 's' : ''} will lose access to this group`
        });
      }

      if (timeEntryCount > 0) {
        warnings.push({
          type: 'compliance' as const,
          message: `${timeEntryCount} time entries will be preserved for compliance but group settings will be lost`
        });
      }

      warnings.push({
        type: 'data_loss' as const,
        message: 'Group settings and configurations will be permanently lost'
      });

      return {
        can_delete: blockers.length === 0,
        impact_summary: {
          members_affected: memberCount,
          time_entries_preserved: timeEntryCount,
          pending_invitations: pendingInvitations,
          active_sessions: activeSessions,
          qr_codes_active: qrCodesActive,
          shareable_links_active: shareableLinksActive
        },
        blockers,
        warnings
      };
    } catch (error) {
      console.error('Group deletion preview failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Delete group (soft delete with cleanup)
   */
  async deleteGroup(
    groupId: string,
    userId: string,
    request: GroupDeletionRequest
  ): Promise<GroupDeletionResponse> {
    try {
      // Validate request
      if (!request.confirm_deletion) {
        throw new Error('confirm_deletion must be true to delete group');
      }

      // Verify user is group manager
      await this.verifyGroupManager(groupId, userId);

      // Check if group can be deleted
      const preview = await this.previewGroupDeletion(groupId, userId);
      if (!preview.can_delete) {
        const blockerMessages = preview.blockers.map(b => b.message).join(', ');
        throw new Error(`Cannot delete group: ${blockerMessages}`);
      }

      // Start transaction for group deletion
      const deletionResult = await this.performGroupDeletion(groupId, request);

      return deletionResult;
    } catch (error) {
      console.error('Group deletion failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Restore soft-deleted group (if needed)
   */
  async restoreGroup(groupId: string, userId: string): Promise<boolean> {
    try {
      // Verify user was the group manager
      const { data: group, error } = await this.supabase
        .from('groups')
        .select('manager_id, deleted_at')
        .eq('id', groupId)
        .single();

      if (error || !group) {
        throw new Error('Group not found');
      }

      if (!group.deleted_at) {
        throw new Error('Group is not deleted');
      }

      if (group.manager_id !== userId) {
        throw new Error('Only the original group manager can restore the group');
      }

      // Restore group
      const { error: restoreError } = await this.supabase
        .from('groups')
        .update({
          deleted_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', groupId);

      if (restoreError) {
        throw restoreError;
      }

      // Reactivate memberships (but don't auto-rejoin members)
      // This would require manual re-invitation

      return true;
    } catch (error) {
      console.error('Group restoration failed:', error);
      return false;
    }
  }

  // Private helper methods

  private async verifyGroupManager(groupId: string, userId: string): Promise<void> {
    const { data: group, error } = await this.supabase
      .from('groups')
      .select('manager_id, deleted_at')
      .eq('id', groupId)
      .single();

    if (error || !group) {
      throw new Error('Group not found');
    }

    if (group.deleted_at) {
      throw new Error('Group has already been deleted');
    }

    if (group.manager_id !== userId) {
      throw new Error('Only group managers can delete groups');
    }
  }

  private async getMemberCount(groupId: string): Promise<number> {
    const { count } = await this.supabase
      .from('group_memberships')
      .select('*', { count: 'exact' })
      .eq('group_id', groupId)
      .eq('is_active', true);

    return count || 0;
  }

  private async getTimeEntryCount(groupId: string): Promise<number> {
    const { count } = await this.supabase
      .from('time_entries')
      .select('*', { count: 'exact' })
      .eq('group_id', groupId);

    return count || 0;
  }

  private async getPendingInvitationCount(groupId: string): Promise<number> {
    const { count } = await this.supabase
      .from('invitations')
      .select('*', { count: 'exact' })
      .eq('group_id', groupId)
      .eq('status', 'pending');

    return count || 0;
  }

  private async getActiveSessionCount(groupId: string): Promise<number> {
    const { count } = await this.supabase
      .from('time_entries')
      .select('*', { count: 'exact' })
      .eq('group_id', groupId)
      .is('end_time', null); // Active sessions have no end time

    return count || 0;
  }

  private async getActiveSessionUsers(groupId: string): Promise<string[]> {
    const { data: sessions } = await this.supabase
      .from('time_entries')
      .select('user_id')
      .eq('group_id', groupId)
      .is('end_time', null);

    return sessions ? sessions.map(s => s.user_id) : [];
  }

  private async getActiveQRCodeCount(groupId: string): Promise<number> {
    const { count } = await this.supabase
      .from('invitations')
      .select('*', { count: 'exact' })
      .eq('group_id', groupId)
      .eq('invitation_type', 'qr_code')
      .eq('status', 'pending');

    return count || 0;
  }

  private async getActiveShareableLinkCount(groupId: string): Promise<number> {
    const { count } = await this.supabase
      .from('invitations')
      .select('*', { count: 'exact' })
      .eq('group_id', groupId)
      .eq('invitation_type', 'shareable_link')
      .eq('status', 'pending');

    return count || 0;
  }

  private async getPendingExportCount(groupId: string): Promise<number> {
    // Check for pending export operations
    // This would depend on your export system implementation
    // For now, return 0 as a placeholder
    return 0;
  }

  private async performGroupDeletion(
    groupId: string,
    request: GroupDeletionRequest
  ): Promise<GroupDeletionResponse> {
    const deletedAt = new Date().toISOString();

    // Get current counts before deletion
    const [memberCount, timeEntryCount] = await Promise.all([
      this.getMemberCount(groupId),
      this.getTimeEntryCount(groupId)
    ]);

    // Start cleanup operations
    const cleanupResults = await Promise.all([
      this.deactivateMemberships(groupId),
      this.revokeInvitations(groupId),
      this.invalidateQRCodes(groupId),
      this.revokeShareableLinks(groupId)
    ]);

    // Soft delete the group
    const { error: deleteError } = await this.supabase
      .from('groups')
      .update({
        deleted_at: deletedAt,
        updated_at: deletedAt,
        deletion_reason: request.reason || null
      })
      .eq('id', groupId);

    if (deleteError) {
      throw deleteError;
    }

    // Notify members if requested
    let membersNotified = 0;
    if (request.notify_members) {
      membersNotified = await this.notifyMembers(groupId, deletedAt);
    }

    // Log deletion action
    await this.logDeletionAction(groupId, request);

    return {
      success: true,
      group_id: groupId,
      deleted_at: deletedAt,
      members_notified: membersNotified,
      time_entries_preserved: timeEntryCount,
      cleanup_summary: {
        memberships_deactivated: cleanupResults[0],
        invitations_revoked: cleanupResults[1],
        qr_codes_invalidated: cleanupResults[2],
        shareable_links_revoked: cleanupResults[3]
      }
    };
  }

  private async deactivateMemberships(groupId: string): Promise<number> {
    const { data: memberships } = await this.supabase
      .from('group_memberships')
      .update({
        is_active: false,
        deactivated_at: new Date().toISOString()
      })
      .eq('group_id', groupId)
      .eq('is_active', true)
      .select('id');

    return memberships ? memberships.length : 0;
  }

  private async revokeInvitations(groupId: string): Promise<number> {
    const { data: invitations } = await this.supabase
      .from('invitations')
      .update({
        status: 'revoked',
        updated_at: new Date().toISOString()
      })
      .eq('group_id', groupId)
      .eq('status', 'pending')
      .select('id');

    return invitations ? invitations.length : 0;
  }

  private async invalidateQRCodes(groupId: string): Promise<number> {
    const { data: qrCodes } = await this.supabase
      .from('invitations')
      .update({
        status: 'revoked',
        updated_at: new Date().toISOString()
      })
      .eq('group_id', groupId)
      .eq('invitation_type', 'qr_code')
      .eq('status', 'pending')
      .select('id');

    return qrCodes ? qrCodes.length : 0;
  }

  private async revokeShareableLinks(groupId: string): Promise<number> {
    const { data: links } = await this.supabase
      .from('invitations')
      .update({
        status: 'revoked',
        updated_at: new Date().toISOString()
      })
      .eq('group_id', groupId)
      .eq('invitation_type', 'shareable_link')
      .eq('status', 'pending')
      .select('id');

    return links ? links.length : 0;
  }

  private async notifyMembers(groupId: string, deletedAt: string): Promise<number> {
    // Get active members
    const { data: members } = await this.supabase
      .from('group_memberships')
      .select(`
        user_id,
        users:user_id (
          email,
          full_name
        )
      `)
      .eq('group_id', groupId)
      .eq('is_active', true);

    if (!members || members.length === 0) {
      return 0;
    }

    // Get group name for notification
    const { data: group } = await this.supabase
      .from('groups')
      .select('name')
      .eq('id', groupId)
      .single();

    // Send notifications (implement based on your notification system)
    // For now, just count the members that would be notified
    let notifiedCount = 0;

    for (const member of members) {
      try {
        // Here you would send actual notifications
        // e.g., email, in-app notification, etc.

        // Create notification record
        await this.supabase
          .from('notifications')
          .insert({
            user_id: member.user_id,
            type: 'group_deleted',
            title: 'Group Deleted',
            message: `The group "${group.name}" has been deleted.`,
            data: {
              group_id: groupId,
              group_name: group.name,
              deleted_at: deletedAt
            },
            created_at: new Date().toISOString()
          });

        notifiedCount++;
      } catch (error) {
        console.error(`Failed to notify member ${member.user_id}:`, error);
      }
    }

    return notifiedCount;
  }

  private async logDeletionAction(
    groupId: string,
    request: GroupDeletionRequest
  ): Promise<void> {
    try {
      await this.supabase
        .from('audit_logs')
        .insert({
          action: 'group_deleted',
          resource_type: 'group',
          resource_id: groupId,
          metadata: {
            reason: request.reason,
            preserve_time_entries: request.preserve_time_entries,
            notify_members: request.notify_members
          },
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log deletion action:', error);
      // Don't throw here - logging failure shouldn't stop deletion
    }
  }

  private handleError(error: any): Error {
    if (error.message) {
      return error;
    }

    if (typeof error === 'string') {
      return new Error(error);
    }

    return new Error('An unexpected error occurred during group deletion operation');
  }
}