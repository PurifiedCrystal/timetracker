export interface Invitation {
  id: string;
  group_id: string;
  invited_by: string;
  invited_email?: string;
  invitation_code: string;
  qr_code_data?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expires_at: string;
  created_at: string;
  accepted_at?: string;
  accepted_by?: string;
}

export interface InvitationWithDetails extends Invitation {
  group_name: string;
  invited_by_name?: string;
  accepted_by_name?: string;
}

export interface CreateInvitationRequest {
  group_id: string;
  invited_email?: string;
  expires_at?: string;
}

export interface GenerateQRRequest {
  group_id: string;
  expires_in_hours?: number;
}

export interface QRCodeResponse {
  invitation_code: string;
  qr_code_data: string;
  expires_at: string;
  group_name: string;
}

export interface JoinGroupRequest {
  invitation_code: string;
}

export interface InvitationInfo {
  group_name: string;
  group_description?: string;
  invited_by_name?: string;
  expires_at: string;
  is_expired: boolean;
  member_count: number;
  max_members: number;
  can_join: boolean;
}

export interface JoinGroupResponse {
  success: boolean;
  message: string;
  group_id?: string;
  membership_id?: string;
}