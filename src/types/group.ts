export interface Group {
  id: string;
  name: string;
  description?: string;
  manager_id: string;
  max_members: number;
  created_at: string;
  updated_at: string;
}

export interface GroupMembership {
  id: string;
  group_id: string;
  user_id: string;
  role: 'manager' | 'member';
  joined_at: string;
}

export interface GroupWithMembers extends Group {
  memberships: GroupMembership[];
  member_count: number;
  manager_name?: string;
}

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
  role?: 'member';
}

export interface UpdateMemberRoleRequest {
  role: 'manager' | 'member';
}

export interface GroupMember {
  id: string;
  user_id: string;
  full_name?: string;
  email?: string;
  role: 'manager' | 'member';
  joined_at: string;
  hourly_rate?: number;
  currency?: string;
}

export interface GroupStats {
  total_members: number;
  active_members: number;
  total_hours_today: number;
  total_hours_week: number;
  total_earnings_week?: number;
}