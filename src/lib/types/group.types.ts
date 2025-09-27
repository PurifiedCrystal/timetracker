import type { Tables, TablesInsert, TablesUpdate } from '../../types/database.types';

// Base types from database
export type Group = Tables<'groups'>;
export type GroupMembership = Tables<'group_memberships'>;
export type Invitation = Tables<'invitations'>;
export type TimeEntry = Tables<'time_entries'>;

// Insert types
export type GroupInsert = TablesInsert<'groups'>;
export type GroupMembershipInsert = TablesInsert<'group_memberships'>;
export type InvitationInsert = TablesInsert<'invitations'>;

// Update types
export type GroupUpdate = TablesUpdate<'groups'>;
export type GroupMembershipUpdate = TablesUpdate<'group_memberships'>;
export type InvitationUpdate = TablesUpdate<'invitations'>;

// Extended types for API responses
export interface GroupWithMembers extends Group {
  group_memberships: (GroupMembership & {
    user_profiles?: {
      full_name: string | null;
      email: string;
    };
  })[];
  member_count: number;
}

export interface GroupWithDetails extends Group {
  group_memberships: GroupMembership[];
  invitations: Invitation[];
  member_count: number;
  active_invitations_count: number;
}

export interface MembershipWithUser extends GroupMembership {
  user_profiles: {
    full_name: string | null;
    email: string;
  };
}

export interface InvitationWithGroup extends Invitation {
  groups: {
    name: string;
    description: string | null;
  };
}

// Role and permission types
export type GroupRole = 'admin' | 'member';

export interface GroupPermissions {
  canManageMembers: boolean;
  canEditGroup: boolean;
  canDeleteGroup: boolean;
  canCreateInvitations: boolean;
  canExportData: boolean;
  canViewReports: boolean;
  canSetHourlyRates: boolean;
}

// API request/response types
export interface CreateGroupRequest {
  name: string;
  description?: string;
  max_members?: number;
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  max_members?: number;
}

export interface AddMemberRequest {
  user_id: string;
  role?: GroupRole;
  can_export_data?: boolean;
  can_view_reports?: boolean;
  hourly_rate?: number;
  notes?: string;
}

export interface UpdateMemberRequest {
  role?: GroupRole;
  can_export_data?: boolean;
  can_view_reports?: boolean;
  hourly_rate?: number;
  notes?: string;
}

export interface CreateInvitationRequest {
  expires_at?: string;
  invited_email?: string;
}

export interface JoinGroupRequest {
  invitation_code: string;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  message: string;
  details?: any;
}

export interface GroupListResponse {
  groups: GroupWithMembers[];
  total: number;
}

export interface MemberListResponse {
  members: MembershipWithUser[];
  total: number;
}

export interface InvitationListResponse {
  invitations: InvitationWithGroup[];
  total: number;
}

// Validation types
export interface GroupValidation {
  name: {
    required: boolean;
    minLength: number;
    maxLength: number;
  };
  description: {
    maxLength: number;
  };
  max_members: {
    min: number;
    max: number;
  };
}

export interface InvitationValidation {
  code: {
    length: number;
    pattern: string;
  };
  expires_at: {
    minHours: number;
    maxHours: number;
  };
}

// Constants
export const GROUP_VALIDATION: GroupValidation = {
  name: {
    required: true,
    minLength: 1,
    maxLength: 100,
  },
  description: {
    maxLength: 500,
  },
  max_members: {
    min: 1,
    max: 100,
  },
};

export const INVITATION_VALIDATION: InvitationValidation = {
  code: {
    length: 32,
    pattern: '^[A-Za-z0-9]+$',
  },
  expires_at: {
    minHours: 1,
    maxHours: 168, // 7 days
  },
};

export const DEFAULT_INVITATION_EXPIRY_HOURS = 24;
export const DEFAULT_MAX_MEMBERS = 20;

// Status enums
export const INVITATION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  EXPIRED: 'expired',
} as const;

export type InvitationStatus = typeof INVITATION_STATUS[keyof typeof INVITATION_STATUS];

// Utility types for group operations
export interface GroupExportFilter {
  group_id: string;
  date_range_start: string;
  date_range_end: string;
  include_members: string[];
}

export interface GroupTimeEntry extends TimeEntry {
  user_profiles: {
    full_name: string | null;
    email: string;
  };
}

export interface GroupExportData {
  group: Group;
  members: MembershipWithUser[];
  time_entries: GroupTimeEntry[];
  export_summary: {
    total_hours: number;
    total_members: number;
    date_range: {
      start: string;
      end: string;
    };
  };
}