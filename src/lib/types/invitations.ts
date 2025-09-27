// Shared types for invitation management
// Feature: 006-group-creation-qr

export type InvitationType = 'direct' | 'qr_code' | 'shareable_link';

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export type ShareMethod =
  | 'web_share'
  | 'clipboard'
  | 'email'
  | 'sms'
  | 'whatsapp'
  | 'twitter'
  | 'facebook';

export type QRErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

// Database entity types (matching schema)
export interface GroupInvitation {
  id: string;
  group_id: string;
  invited_by: string;
  invitation_code: string;
  invitation_type: InvitationType;
  status: InvitationStatus;
  expires_at: string;
  created_at: string;
  accepted_at?: string;
  accepted_by?: string;
  metadata?: Record<string, any>;

  // QR and sharing fields
  qr_code_data?: string;
  shareable_token?: string;
  token_expires_at?: string;
  share_count: number;
  access_count: number;
  last_accessed_at?: string;
}

export interface QRCodeData {
  id: string;
  group_id: string;
  invitation_id: string;
  qr_data_url: string;
  encoded_url: string;
  error_correction_level: QRErrorCorrectionLevel;
  generated_at: string;
  scan_count: number;
  is_valid: boolean;
}

export interface ShareableLink {
  id: string;
  group_id: string;
  invitation_id: string;
  token: string;
  short_code: string;
  full_url: string;
  expires_at: string;
  access_count: number;
  created_by: string;
  created_at: string;
  last_accessed_at?: string;
}

export interface ShareAction {
  id: string;
  invitation_id: string;
  user_id: string;
  share_method: ShareMethod;
  platform?: string;
  shared_at: string;
  success: boolean;
  error_message?: string;
}

// API request/response types
export interface QRGenerationRequest {
  expires_in_hours?: number;
  error_correction_level?: QRErrorCorrectionLevel;
}

export interface QRGenerationResponse {
  id: string;
  group_id: string;
  invitation_code: string;
  qr_code_data: string;
  status: InvitationStatus;
  expires_at: string;
  invitation_url: string;
}

export interface ShareableLinkRequest {
  expires_in_hours?: number;
  allow_multiple_uses?: boolean;
  max_uses?: number;
}

export interface ShareableLinkResponse {
  id: string;
  group_id: string;
  invitation_code: string;
  shareable_url: string;
  expires_at: string;
  status: InvitationStatus;
  token: string;
}

export interface ShareActionRequest {
  share_method: ShareMethod;
  platform?: string;
  recipient_hint?: string;
  success?: boolean;
  error_message?: string;
}

export interface ShareActionResponse {
  share_id?: string;
  share_action_id?: string;
  invitation_id?: string;
  recorded_at?: string;
  success: boolean;
}

export interface InvitationAccessResponse {
  group_name: string;
  group_id: string;
  invitation_valid: boolean;
  expires_at: string;
  already_member: boolean;
  requires_auth: boolean;
}

export interface InvitationAcceptanceResponse {
  success: boolean;
  group_id: string;
  membership_id: string;
  redirect_url: string;
}

export interface GroupDeletionPreviewResponse {
  can_delete: boolean;
  impact_summary: {
    members_affected: number;
    time_entries_preserved: number;
    pending_invitations: number;
    active_sessions: number;
    qr_codes_active: number;
    shareable_links_active: number;
  };
  blockers: Array<{
    type: 'active_sessions' | 'pending_exports' | 'system_constraint';
    message: string;
    resolution: string;
  }>;
  warnings: Array<{
    type: 'data_loss' | 'member_impact' | 'compliance';
    message: string;
  }>;
}

export interface GroupDeletionRequest {
  confirm_deletion: boolean;
  reason?: string;
  preserve_time_entries?: boolean;
  notify_members?: boolean;
}

export interface GroupDeletionResponse {
  success: boolean;
  group_id: string;
  deleted_at: string;
  members_notified: number;
  time_entries_preserved: number;
  cleanup_summary: {
    memberships_deactivated: number;
    invitations_revoked: number;
    qr_codes_invalidated: number;
    shareable_links_revoked: number;
  };
}

// Error response type
export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, any>;
}

// JWT token payload for shareable links
export interface InvitationTokenPayload {
  group_id: string;
  invitation_id: string;
  invitation_code: string;
  exp: number; // expiration timestamp
  iat: number; // issued at timestamp
  type: 'group_invitation';
}

// Utility types for component props
export interface QRCodeGeneratorProps {
  groupId: string;
  onSuccess?: (response: QRGenerationResponse) => void;
  onError?: (error: string) => void;
}

export interface ShareableLinkProps {
  groupId: string;
  onSuccess?: (response: ShareableLinkResponse) => void;
  onError?: (error: string) => void;
}

export interface ShareButtonProps {
  invitationUrl: string;
  groupName: string;
  onShare?: (method: ShareMethod) => void;
  onError?: (error: string) => void;
}

export interface DeleteGroupModalProps {
  groupId: string;
  groupName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

// Validation schemas (for runtime type checking)
export const INVITATION_TYPE_VALUES: InvitationType[] = ['direct', 'qr_code', 'shareable_link'];
export const INVITATION_STATUS_VALUES: InvitationStatus[] = ['pending', 'accepted', 'expired', 'revoked'];
export const SHARE_METHOD_VALUES: ShareMethod[] = ['web_share', 'clipboard', 'email', 'sms', 'whatsapp', 'twitter', 'facebook'];
export const QR_ERROR_CORRECTION_LEVELS: QRErrorCorrectionLevel[] = ['L', 'M', 'Q', 'H'];

// Helper functions for type validation
export const isValidInvitationType = (type: string): type is InvitationType =>
  INVITATION_TYPE_VALUES.includes(type as InvitationType);

export const isValidInvitationStatus = (status: string): status is InvitationStatus =>
  INVITATION_STATUS_VALUES.includes(status as InvitationStatus);

export const isValidShareMethod = (method: string): method is ShareMethod =>
  SHARE_METHOD_VALUES.includes(method as ShareMethod);

export const isValidQRErrorCorrectionLevel = (level: string): level is QRErrorCorrectionLevel =>
  QR_ERROR_CORRECTION_LEVELS.includes(level as QRErrorCorrectionLevel);