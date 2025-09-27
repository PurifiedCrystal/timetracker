// T016: Create InvitationService updates in src/lib/services/InvitationService.ts
// Feature: 006-group-creation-qr

import { createRouteHandlerClient } from '@/lib/supabase-server';
import {
  GroupInvitation,
  InvitationType,
  InvitationStatus,
  InvitationAccessResponse,
  InvitationAcceptanceResponse
} from '@/lib/types/invitations';

export class InvitationService {
  private supabase: any;

  constructor() {
    this.supabase = createRouteHandlerClient();
  }

  /**
   * Get invitation by code (unified for QR and shareable links)
   */
  async getInvitationByCode(invitationCode: string): Promise<GroupInvitation | null> {
    try {
      const { data: invitation, error } = await this.supabase
        .from('invitations')
        .select(`
          *,
          groups:group_id (
            id,
            name,
            manager_id,
            deleted_at,
            member_limit
          )
        `)
        .eq('invitation_code', invitationCode)
        .single();

      if (error || !invitation) {
        return null;
      }

      // Check if invitation is expired
      if (new Date(invitation.expires_at) < new Date()) {
        await this.expireInvitation(invitation.id);
        return null;
      }

      // Check if group is deleted
      if (invitation.groups.deleted_at) {
        return null;
      }

      // Check if invitation is already accepted or revoked
      if (invitation.status !== 'pending') {
        return null;
      }

      return invitation;
    } catch (error) {
      console.error('Failed to get invitation by code:', error);
      return null;
    }
  }

  /**
   * Process invitation access (GET request)
   */
  async processInvitationAccess(invitationCode: string): Promise<InvitationAccessResponse> {
    try {
      const invitation = await this.getInvitationByCode(invitationCode);

      if (!invitation) {
        throw new Error('Invitation not found or expired');
      }

      // Increment access count
      await this.incrementAccessCount(invitation.id);

      // Check if current user is already a member (if authenticated)
      let alreadyMember = false;
      let requiresAuth = true;

      try {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (user) {
          requiresAuth = false;
          const { data: membership } = await this.supabase
            .from('group_memberships')
            .select('id')
            .eq('group_id', invitation.group_id)
            .eq('user_id', user.id)
            .eq('is_active', true)
            .single();

          alreadyMember = !!membership;
        }
      } catch {
        // User not authenticated
        requiresAuth = true;
      }

      return {
        group_name: invitation.groups.name,
        group_id: invitation.group_id,
        invitation_valid: true,
        expires_at: invitation.expires_at,
        already_member: alreadyMember,
        requires_auth: requiresAuth
      };
    } catch (error) {
      console.error('Invitation access processing failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Accept group invitation (POST request)
   */
  async acceptInvitation(
    invitationCode: string,
    userId: string
  ): Promise<InvitationAcceptanceResponse> {
    try {
      const invitation = await this.getInvitationByCode(invitationCode);

      if (!invitation) {
        throw new Error('Invitation not found or expired');
      }

      // Check if user is already a member
      const { data: existingMembership } = await this.supabase
        .from('group_memberships')
        .select('id')
        .eq('group_id', invitation.group_id)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (existingMembership) {
        throw new Error('User is already a member of this group');
      }

      // Check group member limit
      await this.checkGroupMemberLimit(invitation.group_id);

      // Create group membership
      const { data: membership, error: membershipError } = await this.supabase
        .from('group_memberships')
        .insert({
          group_id: invitation.group_id,
          user_id: userId,
          is_active: true,
          joined_at: new Date().toISOString()
        })
        .select()
        .single();

      if (membershipError) {
        throw membershipError;
      }

      // Update invitation status
      await this.supabase
        .from('invitations')
        .update({
          status: 'accepted',
          accepted_by: userId,
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      return {
        success: true,
        group_id: invitation.group_id,
        membership_id: membership.id,
        redirect_url: `/dashboard/groups/${invitation.group_id}`
      };
    } catch (error) {
      console.error('Invitation acceptance failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Create direct invitation (email-based)
   */
  async createDirectInvitation(
    groupId: string,
    invitedBy: string,
    email: string,
    expiresInHours: number = 168 // 1 week default
  ): Promise<GroupInvitation> {
    try {
      // Verify user is group manager
      await this.verifyGroupManager(groupId, invitedBy);

      // Generate unique invitation code
      const invitationCode = this.generateInvitationCode();

      // Calculate expiration time
      const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

      // Create invitation
      const invitation = await this.createInvitation({
        group_id: groupId,
        invited_by: invitedBy,
        invitation_code: invitationCode,
        invitation_type: 'direct',
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        metadata: { email },
        share_count: 0,
        access_count: 0
      });

      return invitation;
    } catch (error) {
      console.error('Direct invitation creation failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * List invitations for a group
   */
  async listGroupInvitations(
    groupId: string,
    userId: string,
    status?: InvitationStatus
  ): Promise<GroupInvitation[]> {
    try {
      // Verify user is group manager
      await this.verifyGroupManager(groupId, userId);

      let query = this.supabase
        .from('invitations')
        .select(`
          *,
          inviter:invited_by (
            id,
            email,
            full_name
          ),
          accepter:accepted_by (
            id,
            email,
            full_name
          )
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data: invitations, error } = await query;

      if (error) {
        throw error;
      }

      return invitations || [];
    } catch (error) {
      console.error('Failed to list group invitations:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Revoke invitation
   */
  async revokeInvitation(
    invitationId: string,
    userId: string
  ): Promise<boolean> {
    try {
      // Get invitation to verify group ownership
      const { data: invitation, error } = await this.supabase
        .from('invitations')
        .select('group_id, status')
        .eq('id', invitationId)
        .single();

      if (error || !invitation) {
        throw new Error('Invitation not found');
      }

      if (invitation.status !== 'pending') {
        throw new Error('Can only revoke pending invitations');
      }

      // Verify user is group manager
      await this.verifyGroupManager(invitation.group_id, userId);

      // Update invitation status
      const { error: updateError } = await this.supabase
        .from('invitations')
        .update({
          status: 'revoked',
          updated_at: new Date().toISOString()
        })
        .eq('id', invitationId);

      if (updateError) {
        throw updateError;
      }

      return true;
    } catch (error) {
      console.error('Invitation revocation failed:', error);
      return false;
    }
  }

  /**
   * Get invitation statistics for a group
   */
  async getInvitationStats(groupId: string, userId: string): Promise<{
    total_sent: number;
    pending: number;
    accepted: number;
    expired: number;
    revoked: number;
    by_type: Record<InvitationType, number>;
  }> {
    try {
      await this.verifyGroupManager(groupId, userId);

      const { data: invitations, error } = await this.supabase
        .from('invitations')
        .select('status, invitation_type')
        .eq('group_id', groupId);

      if (error) {
        throw error;
      }

      const stats = {
        total_sent: invitations.length,
        pending: 0,
        accepted: 0,
        expired: 0,
        revoked: 0,
        by_type: {
          direct: 0,
          qr_code: 0,
          shareable_link: 0
        } as Record<InvitationType, number>
      };

      invitations.forEach(inv => {
        stats[inv.status as keyof typeof stats]++;
        stats.by_type[inv.invitation_type]++;
      });

      return stats;
    } catch (error) {
      console.error('Failed to get invitation stats:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Cleanup expired invitations
   */
  async cleanupExpiredInvitations(): Promise<number> {
    try {
      const now = new Date().toISOString();

      const { data: expiredInvitations, error } = await this.supabase
        .from('invitations')
        .update({ status: 'expired' })
        .eq('status', 'pending')
        .lt('expires_at', now)
        .select('id');

      if (error) {
        throw error;
      }

      return expiredInvitations?.length || 0;
    } catch (error) {
      console.error('Failed to cleanup expired invitations:', error);
      return 0;
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
      throw new Error('Group has been deleted');
    }

    if (group.manager_id !== userId) {
      throw new Error('Insufficient permissions. Only group managers can manage invitations.');
    }
  }

  private generateInvitationCode(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private async createInvitation(invitationData: Partial<GroupInvitation>): Promise<GroupInvitation> {
    const { data: invitation, error } = await this.supabase
      .from('invitations')
      .insert(invitationData)
      .select()
      .single();

    if (error) {
      console.error('Database error creating invitation:', error);
      throw new Error('Failed to create invitation');
    }

    return invitation;
  }

  private async expireInvitation(invitationId: string): Promise<void> {
    await this.supabase
      .from('invitations')
      .update({
        status: 'expired',
        updated_at: new Date().toISOString()
      })
      .eq('id', invitationId);
  }

  private async incrementAccessCount(invitationId: string): Promise<void> {
    // Use Supabase RPC function for atomic increment
    await this.supabase.rpc('increment_invitation_access', {
      invitation_id: invitationId,
      accessed_at: new Date().toISOString()
    });
  }

  private async checkGroupMemberLimit(groupId: string): Promise<void> {
    const { data: group } = await this.supabase
      .from('groups')
      .select('member_limit')
      .eq('id', groupId)
      .single();

    const { count: memberCount } = await this.supabase
      .from('group_memberships')
      .select('*', { count: 'exact' })
      .eq('group_id', groupId)
      .eq('is_active', true);

    if (memberCount >= (group.member_limit || 50)) {
      throw new Error('Group has reached its member limit');
    }
  }

  private handleError(error: any): Error {
    if (error.message) {
      return error;
    }

    if (typeof error === 'string') {
      return new Error(error);
    }

    return new Error('An unexpected error occurred during invitation operation');
  }
}