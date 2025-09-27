import type { Tables, TablesInsert, TablesUpdate } from '../../types/database.types';
import type { Group } from './group.types';

// Base types from database
export type Invitation = Tables<'invitations'>;
export type InvitationInsert = TablesInsert<'invitations'>;
export type InvitationUpdate = TablesUpdate<'invitations'>;

// Extended invitation types
export interface InvitationWithGroup extends Invitation {
  groups: Pick<Group, 'id' | 'name' | 'description' | 'max_members'>;
}

export interface InvitationDetails extends Invitation {
  groups: Group;
  invited_by_profile: {
    full_name: string | null;
    email: string;
  };
  is_valid: boolean;
  is_expired: boolean;
  can_be_used: boolean;
}

// QR Code specific types
export interface QRCodeData {
  invitation_code: string;
  group_name: string;
  expires_at: string;
  invited_by: string;
  url: string;
}

export interface QRCodeInvitation extends Invitation {
  qr_code_url: string;
  qr_code_svg: string;
  share_url: string;
}

// API request types
export interface CreateInvitationRequest {
  group_id: string;
  expires_at?: string;
  invited_email?: string;
  max_uses?: number;
}

export interface UpdateInvitationRequest {
  status?: InvitationStatus;
  expires_at?: string;
  invited_email?: string;
}

export interface JoinGroupByInvitationRequest {
  invitation_code: string;
  user_agent?: string;
  ip_address?: string;
}

// API response types
export interface CreateInvitationResponse {
  invitation: QRCodeInvitation;
  qr_code_data: QRCodeData;
}

export interface InvitationDetailsResponse {
  invitation: InvitationDetails;
  group_info: {
    name: string;
    description: string | null;
    member_count: number;
    max_members: number;
  };
}

export interface JoinGroupResponse {
  success: boolean;
  group: Group;
  membership: {
    id: string;
    role: string;
    joined_at: string;
  };
  message: string;
}

// Status types
export const INVITATION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
} as const;

export type InvitationStatus = typeof INVITATION_STATUS[keyof typeof INVITATION_STATUS];

// Validation types
export interface InvitationValidationRules {
  code: {
    length: number;
    pattern: RegExp;
    allowedChars: string;
  };
  expiry: {
    minMinutes: number;
    maxDays: number;
    defaultHours: number;
  };
  usage: {
    defaultMaxUses: number;
    maxAllowedUses: number;
  };
  email: {
    required: boolean;
    pattern: RegExp;
  };
}

export const INVITATION_VALIDATION_RULES: InvitationValidationRules = {
  code: {
    length: 32,
    pattern: /^[A-Za-z0-9]+$/,
    allowedChars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  },
  expiry: {
    minMinutes: 5,
    maxDays: 30,
    defaultHours: 24,
  },
  usage: {
    defaultMaxUses: 1,
    maxAllowedUses: 100,
  },
  email: {
    required: false,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
};

// Error types
export interface InvitationError {
  code: string;
  message: string;
  details?: {
    invitation_code?: string;
    group_id?: string;
    user_id?: string;
    reason?: string;
  };
}

export const INVITATION_ERROR_CODES = {
  INVALID_CODE: 'INVALID_CODE',
  EXPIRED: 'EXPIRED',
  ALREADY_USED: 'ALREADY_USED',
  ALREADY_MEMBER: 'ALREADY_MEMBER',
  GROUP_FULL: 'GROUP_FULL',
  GROUP_NOT_FOUND: 'GROUP_NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  MAX_USES_EXCEEDED: 'MAX_USES_EXCEEDED',
} as const;

export type InvitationErrorCode = typeof INVITATION_ERROR_CODES[keyof typeof INVITATION_ERROR_CODES];

// Utility types
export interface InvitationMetrics {
  total_created: number;
  total_accepted: number;
  total_expired: number;
  total_pending: number;
  acceptance_rate: number;
  average_time_to_accept: number; // in hours
}

export interface GroupInvitationSummary {
  group_id: string;
  group_name: string;
  active_invitations: number;
  pending_invitations: number;
  accepted_invitations: number;
  total_invitations: number;
  last_invitation_sent: string | null;
}

// Helper functions types
export interface InvitationHelpers {
  generateCode: () => string;
  isExpired: (invitation: Invitation) => boolean;
  isValid: (invitation: Invitation) => boolean;
  canBeUsed: (invitation: Invitation) => boolean;
  getExpiryDate: (hours?: number) => string;
  formatCode: (code: string) => string;
  generateQRCodeData: (invitation: Invitation, group: Group) => QRCodeData;
}

// URL generation types
export interface InvitationURLs {
  join_url: string;
  qr_code_url: string;
  share_url: string;
  details_url: string;
}

export interface URLGenerationOptions {
  base_url: string;
  include_qr: boolean;
  include_metadata: boolean;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}