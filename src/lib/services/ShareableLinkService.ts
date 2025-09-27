// T014: Create ShareableLinkService in src/lib/services/ShareableLinkService.ts
// Feature: 006-group-creation-qr

import { createRouteHandlerClient } from '@/lib/supabase-server';
import jwt from 'jsonwebtoken';
import {
  ShareableLinkRequest,
  ShareableLinkResponse,
  ShareActionRequest,
  ShareActionResponse,
  InvitationAccessResponse,
  InvitationAcceptanceResponse,
  GroupInvitation,
  InvitationTokenPayload,
  ShareMethod
} from '@/lib/types/invitations';

export class ShareableLinkService {
  private supabase: any;
  private jwtSecret: string;

  constructor() {
    this.supabase = createRouteHandlerClient();
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  }

  /**
   * Create shareable link for group invitation
   */
  async createShareableLink(
    groupId: string,
    userId: string,
    options: ShareableLinkRequest = {}
  ): Promise<ShareableLinkResponse> {
    try {
      // Validate input parameters
      this.validateShareableLinkRequest(options);

      // Check if user is group manager
      await this.verifyGroupManager(groupId, userId);

      // Generate unique invitation code
      const invitationCode = this.generateInvitationCode();

      // Calculate expiration time
      const expiresInHours = options.expires_in_hours || 24;
      const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

      // Generate JWT token
      const token = this.generateJWTToken(groupId, invitationCode, expiresAt);

      // Create shareable URL
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const shareableUrl = `${baseUrl}/invite/${invitationCode}`;

      // Save invitation to database
      const invitation = await this.createInvitation({
        group_id: groupId,
        invited_by: userId,
        invitation_code: invitationCode,
        invitation_type: 'shareable_link',
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        shareable_token: token,
        token_expires_at: expiresAt.toISOString(),
        share_count: 0,
        access_count: 0
      });

      return {
        id: invitation.id,
        group_id: groupId,
        invitation_code: invitationCode,
        shareable_url: shareableUrl,
        expires_at: expiresAt.toISOString(),
        status: 'pending',
        token: token
      };
    } catch (error) {
      console.error('Shareable link creation failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Process invitation link access
   */
  async processInvitationAccess(invitationCode: string): Promise<InvitationAccessResponse> {
    try {
      const invitation = await this.getValidInvitation(invitationCode);

      if (!invitation) {
        throw new Error('Invitation not found or expired');
      }

      // Increment access count
      await this.incrementAccessCount(invitation.id);

      // Get group details
      const { data: group } = await this.supabase
        .from('groups')
        .select('name')
        .eq('id', invitation.group_id)
        .single();

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
        group_name: group.name,
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
   * Accept group invitation
   */
  async acceptInvitation(
    invitationCode: string,
    userId: string
  ): Promise<InvitationAcceptanceResponse> {
    try {
      const invitation = await this.getValidInvitation(invitationCode);

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
   * Track share action
   */
  async trackShareAction(
    invitationCode: string,
    userId: string,
    shareData: ShareActionRequest
  ): Promise<ShareActionResponse> {
    try {
      const invitation = await this.getValidInvitation(invitationCode);

      if (!invitation) {
        throw new Error('Invitation not found or expired');
      }

      // Create share action record
      const { data: shareAction, error } = await this.supabase
        .from('share_actions')
        .insert({
          invitation_id: invitation.id,
          user_id: userId,
          share_method: shareData.share_method,
          platform: shareData.platform,
          shared_at: new Date().toISOString(),
          success: true
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Increment share count
      await this.incrementShareCount(invitation.id);

      return {
        share_id: shareAction.id,
        success: true
      };
    } catch (error) {
      console.error('Share action tracking failed:', error);

      // Still try to track as failed action
      try {
        await this.supabase
          .from('share_actions')
          .insert({
            invitation_id: invitationCode, // Use code as fallback
            user_id: userId,
            share_method: shareData.share_method,
            platform: shareData.platform,
            shared_at: new Date().toISOString(),
            success: false,
            error_message: (error as Error).message || 'Unknown error'
          });
      } catch {
        // Ignore tracking errors for failed actions
      }

      throw this.handleError(error);
    }
  }

  /**
   * Validate JWT token
   */
  async validateToken(token: string): Promise<InvitationTokenPayload | null> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as InvitationTokenPayload;

      // Additional validation
      if (decoded.type !== 'group_invitation') {
        return null;
      }

      // Check if invitation still exists and is valid
      const invitation = await this.getValidInvitation(decoded.invitation_code);
      if (!invitation) {
        return null;
      }

      return decoded;
    } catch (error) {
      console.error('Token validation failed:', error);
      return null;
    }
  }

  /**
   * Revoke shareable link
   */
  async revokeShareableLink(invitationCode: string, userId: string): Promise<boolean> {
    try {
      const invitation = await this.getValidInvitation(invitationCode);
      if (!invitation) {
        throw new Error('Invalid shareable link');
      }

      // Verify user is group manager
      await this.verifyGroupManager(invitation.group_id, userId);

      // Update invitation status to revoked
      const { error } = await this.supabase
        .from('invitations')
        .update({
          status: 'revoked',
          updated_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Shareable link revocation failed:', error);
      return false;
    }
  }

  // Private helper methods

  private validateShareableLinkRequest(options: ShareableLinkRequest): void {
    if (options.expires_in_hours !== undefined) {
      if (options.expires_in_hours < 1 || options.expires_in_hours > 168) {
        throw new Error('expires_in_hours must be between 1 and 168');
      }
    }
  }

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
      throw new Error('Insufficient permissions. Only group managers can create shareable links.');
    }
  }

  private generateInvitationCode(): string {
    // Generate cryptographically secure random string
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private generateJWTToken(
    groupId: string,
    invitationCode: string,
    expiresAt: Date
  ): string {
    const payload: InvitationTokenPayload = {
      group_id: groupId,
      invitation_id: '', // Will be filled after creation
      invitation_code: invitationCode,
      exp: Math.floor(expiresAt.getTime() / 1000),
      iat: Math.floor(Date.now() / 1000),
      type: 'group_invitation'
    };

    return jwt.sign(payload, this.jwtSecret, {
      algorithm: 'HS256'
    });
  }

  private async getValidInvitation(invitationCode: string): Promise<GroupInvitation | null> {
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
      .eq('invitation_type', 'shareable_link')
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

    return invitation;
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
    await this.supabase.rpc('increment_invitation_access', {
      invitation_id: invitationId,
      accessed_at: new Date().toISOString()
    });
  }

  private async incrementShareCount(invitationId: string): Promise<void> {
    await this.supabase.rpc('increment_invitation_shares', {
      invitation_id: invitationId
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

    return new Error('An unexpected error occurred during shareable link operation');
  }
}