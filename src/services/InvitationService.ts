import { createRouteHandlerClient } from '@/lib/supabase-server';
import type {
  Invitation,
  InvitationWithDetails,
  CreateInvitationRequest,
  GenerateQRRequest,
  QRCodeResponse,
  JoinGroupRequest,
  InvitationInfo,
  JoinGroupResponse
} from '@/types/invitation';

export class InvitationService {

  static async generateQRInvitation(userId: string, data: GenerateQRRequest): Promise<{ data: QRCodeResponse | null; error: string | null }> {
    try {
      const supabase = createRouteHandlerClient();

      // Verify user is manager of the group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('name, description')
        .eq('id', data.group_id)
        .eq('manager_id', userId)
        .single();

      if (groupError || !group) {
        return { data: null, error: 'Group not found or unauthorized' };
      }

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + (data.expires_in_hours || 24));

      const invitationData = {
        group_id: data.group_id,
        invited_by: userId,
        expires_at: expiresAt.toISOString()
      };

      const { data: invitation, error } = await supabase
        .from('invitations')
        .insert([invitationData])
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      // Generate QR code data (URL that points to join endpoint)
      const joinUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/join/${invitation.invitation_code}`;

      const qrCodeData = this.generateQRCodeDataURL(joinUrl);

      // Update invitation with QR code data
      const { error: updateError } = await supabase
        .from('invitations')
        .update({ qr_code_data: qrCodeData })
        .eq('id', invitation.id);

      if (updateError) {
        return { data: null, error: 'Failed to generate QR code' };
      }

      const response: QRCodeResponse = {
        invitation_code: invitation.invitation_code,
        qr_code_data: qrCodeData,
        expires_at: invitation.expires_at,
        group_name: group.name
      };

      return { data: response, error: null };
    } catch (error) {
      return { data: null, error: 'Failed to generate QR invitation' };
    }
  }

  static async getInvitationInfo(invitationCode: string): Promise<{ data: InvitationInfo | null; error: string | null }> {
    try {
      const supabase = createRouteHandlerClient();

      const { data: invitation, error } = await supabase
        .from('invitations')
        .select(`
          *,
          groups!inner(
            name,
            description,
            max_members
          ),
          user_profiles!invited_by(
            full_name
          ),
          group_memberships!group_id(
            id
          )
        `)
        .eq('invitation_code', invitationCode)
        .single();

      if (error || !invitation) {
        return { data: null, error: 'Invitation not found' };
      }

      const isExpired = new Date(invitation.expires_at) < new Date();
      const memberCount = invitation.group_memberships?.length || 0;
      const maxMembers = invitation.groups?.max_members || 3;
      const canJoin = !isExpired && invitation.status === 'pending' && memberCount < maxMembers;

      const info: InvitationInfo = {
        group_name: invitation.groups?.name || 'Unknown Group',
        group_description: invitation.groups?.description,
        invited_by_name: invitation.user_profiles?.full_name,
        expires_at: invitation.expires_at,
        is_expired: isExpired,
        member_count: memberCount,
        max_members: maxMembers,
        can_join: canJoin
      };

      return { data: info, error: null };
    } catch (error) {
      return { data: null, error: 'Failed to fetch invitation info' };
    }
  }

  static async joinGroup(userId: string, data: JoinGroupRequest): Promise<{ data: JoinGroupResponse | null; error: string | null }> {
    try {
      const supabase = createRouteHandlerClient();

      // Get invitation details
      const { data: invitation, error: inviteError } = await supabase
        .from('invitations')
        .select(`
          *,
          groups!inner(
            id,
            name,
            max_members
          )
        `)
        .eq('invitation_code', data.invitation_code)
        .eq('status', 'pending')
        .single();

      if (inviteError || !invitation) {
        return {
          data: { success: false, message: 'Invalid or expired invitation' },
          error: null
        };
      }

      // Check if invitation is expired
      if (new Date(invitation.expires_at) < new Date()) {
        await supabase
          .from('invitations')
          .update({ status: 'expired' })
          .eq('id', invitation.id);

        return {
          data: { success: false, message: 'Invitation has expired' },
          error: null
        };
      }

      // Check if user is already a member
      const { data: existingMembership } = await supabase
        .from('group_memberships')
        .select('id')
        .eq('group_id', invitation.group_id)
        .eq('user_id', userId)
        .single();

      if (existingMembership) {
        return {
          data: { success: false, message: 'You are already a member of this group' },
          error: null
        };
      }

      // Check group capacity
      const { data: currentMembers } = await supabase
        .from('group_memberships')
        .select('id')
        .eq('group_id', invitation.group_id);

      if (currentMembers && currentMembers.length >= invitation.groups.max_members) {
        return {
          data: { success: false, message: 'Group is at maximum capacity' },
          error: null
        };
      }

      // Add user to group
      const { data: membership, error: membershipError } = await supabase
        .from('group_memberships')
        .insert([{
          group_id: invitation.group_id,
          user_id: userId,
          role: 'member'
        }])
        .select()
        .single();

      if (membershipError) {
        return { data: null, error: membershipError.message };
      }

      // Update invitation status
      await supabase
        .from('invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          accepted_by: userId
        })
        .eq('id', invitation.id);

      const response: JoinGroupResponse = {
        success: true,
        message: `Successfully joined ${invitation.groups.name}`,
        group_id: invitation.group_id,
        membership_id: membership.id
      };

      return { data: response, error: null };
    } catch (error) {
      return { data: null, error: 'Failed to join group' };
    }
  }

  static async getUserInvitations(userId: string): Promise<{ data: InvitationWithDetails[]; error: string | null }> {
    try {
      const supabase = createRouteHandlerClient();

      const { data: invitations, error } = await supabase
        .from('invitations')
        .select(`
          *,
          groups!inner(name),
          invited_by_profile:user_profiles!invited_by(full_name),
          accepted_by_profile:user_profiles!accepted_by(full_name)
        `)
        .eq('invited_by', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: [], error: error.message };
      }

      const invitationsWithDetails: InvitationWithDetails[] = (invitations || []).map(inv => ({
        ...inv,
        group_name: inv.groups?.name || 'Unknown Group',
        invited_by_name: inv.invited_by_profile?.full_name,
        accepted_by_name: inv.accepted_by_profile?.full_name
      }));

      return { data: invitationsWithDetails, error: null };
    } catch (error) {
      return { data: [], error: 'Failed to fetch invitations' };
    }
  }

  static async expireInvitation(invitationId: string): Promise<{ error: string | null }> {
    try {
      const supabase = createRouteHandlerClient();

      const { error } = await supabase
        .from('invitations')
        .update({ status: 'expired' })
        .eq('id', invitationId);

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: 'Failed to expire invitation' };
    }
  }

  static async deleteInvitation(invitationId: string): Promise<{ error: string | null }> {
    try {
      const supabase = createRouteHandlerClient();

      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId);

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: 'Failed to delete invitation' };
    }
  }

  private static generateQRCodeDataURL(url: string): string {
    // This is a simplified QR code data URL generation
    // In a real implementation, you would use a QR code library like 'qrcode'
    // For now, return a placeholder data URL that contains the URL
    const base64Data = Buffer.from(url).toString('base64');
    return `data:text/plain;base64,${base64Data}`;
  }

  // Cleanup expired invitations (can be called by a cron job)
  static async cleanupExpiredInvitations(): Promise<{ cleaned: number; error: string | null }> {
    try {
      const supabase = createRouteHandlerClient();

      const { data: expiredInvitations, error } = await supabase
        .from('invitations')
        .update({ status: 'expired' })
        .lt('expires_at', new Date().toISOString())
        .eq('status', 'pending')
        .select();

      if (error) {
        return { cleaned: 0, error: error.message };
      }

      return { cleaned: expiredInvitations?.length || 0, error: null };
    } catch (error) {
      return { cleaned: 0, error: 'Failed to cleanup expired invitations' };
    }
  }
}