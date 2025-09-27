# Data Model: Database-Backed Group Management System

**Date**: 2025-01-15
**Feature**: Database-Backed Group Management System
**Status**: Complete

## Database Schema

### Core Tables

#### groups
Primary entity for team organization
```sql
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    creator_id UUID NOT NULL REFERENCES auth.users(id),
    max_members INTEGER DEFAULT 20 CHECK (max_members > 0 AND max_members <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    deleted_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT groups_name_not_empty CHECK (trim(name) != '')
);
```

**Business Rules**:
- FR-002: Name and description storage
- FR-001: Database persistence with UUID for stability
- FR-003: Creator tracking for admin rights
- Soft delete via deleted_at for FR-010

#### group_memberships
Links users to groups with role management
```sql
CREATE TABLE group_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    invited_by UUID REFERENCES auth.users(id),
    deleted_at TIMESTAMP WITH TIME ZONE,

    UNIQUE(group_id, user_id, deleted_at) -- Prevent duplicate active memberships
);
```

**Business Rules**:
- FR-009: Role management (admin/member)
- FR-005: Membership persistence
- FR-014: Soft delete preserves audit trail
- Unique constraint prevents duplicate active memberships (FR-016)

#### group_invitations
QR code invitation tracking with expiration
```sql
CREATE TABLE group_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    code VARCHAR(32) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    max_uses INTEGER DEFAULT 1 CHECK (max_uses > 0),
    used_count INTEGER DEFAULT 0 CHECK (used_count >= 0),

    CHECK (expires_at > created_at),
    CHECK (used_count <= max_uses)
);
```

**Business Rules**:
- FR-004: QR code functionality preservation
- FR-015: Admin-configurable expiration
- Usage tracking for invitation limits
- Automatic cleanup on group deletion

#### time_entry_groups
Many-to-many relationship for time tracking association
```sql
CREATE TABLE time_entry_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    time_entry_id UUID NOT NULL, -- References existing time_entries table
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

    UNIQUE(time_entry_id, group_id) -- Prevent duplicate associations
);
```

**Business Rules**:
- FR-006: Associate time tracking with groups
- FR-007: Enable group-based export filtering
- Support multiple group memberships per user

## Entity Relationships

```
auth.users (existing)
    ├── groups.creator_id (1:many)
    ├── group_memberships.user_id (1:many)
    ├── group_memberships.invited_by (1:many)
    └── group_invitations.created_by (1:many)

groups
    ├── group_memberships.group_id (1:many)
    ├── group_invitations.group_id (1:many)
    └── time_entry_groups.group_id (1:many)

time_entries (existing)
    └── time_entry_groups.time_entry_id (1:many)
```

## Data Validation Rules

### Groups
- Name: Required, 1-100 characters, not empty after trim
- Description: Optional, up to 1000 characters
- Max members: 1-100, default 20
- Creator: Must be authenticated user

### Group Memberships
- Role: Must be 'admin' or 'member'
- User can only have one active membership per group
- Creator automatically becomes admin
- Soft delete preserves historical data

### Group Invitations
- Code: Unique 32-character string
- Expiration: Must be future timestamp
- Usage: Cannot exceed max_uses
- Admin-only creation

### Time Entry Associations
- Time entry must exist
- Group must exist and not be deleted
- No duplicate associations

## Row Level Security (RLS) Policies

### groups table
```sql
-- Users can read groups they're members of or created
CREATE POLICY "Users can view their groups" ON groups
    FOR SELECT USING (
        auth.uid() = creator_id OR
        EXISTS (
            SELECT 1 FROM group_memberships
            WHERE group_id = groups.id
            AND user_id = auth.uid()
            AND deleted_at IS NULL
        )
    );

-- Users can create groups
CREATE POLICY "Users can create groups" ON groups
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Only creators can update/delete groups
CREATE POLICY "Creators can manage groups" ON groups
    FOR UPDATE USING (auth.uid() = creator_id);
```

### group_memberships table
```sql
-- Users can view memberships for their groups
CREATE POLICY "Users can view group memberships" ON group_memberships
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM groups g
            JOIN group_memberships gm ON g.id = gm.group_id
            WHERE g.id = group_memberships.group_id
            AND gm.user_id = auth.uid()
            AND gm.deleted_at IS NULL
        )
    );
```

### group_invitations table
```sql
-- Only group members can view invitations
CREATE POLICY "Group members can view invitations" ON group_invitations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM group_memberships gm
            WHERE gm.group_id = group_invitations.group_id
            AND gm.user_id = auth.uid()
            AND gm.deleted_at IS NULL
        )
    );
```

## Migration Strategy

### Phase 1: Core Tables
1. Create groups table
2. Create group_memberships table
3. Create group_invitations table
4. Set up RLS policies

### Phase 2: Time Integration
1. Create time_entry_groups table
2. Add foreign key constraints
3. Migrate existing time entries if needed

### Phase 3: Data Seeding
1. Convert localStorage groups to database
2. Create memberships for existing users
3. Clean up localStorage references

## Performance Considerations

### Indexes
```sql
-- Essential indexes for query performance
CREATE INDEX idx_groups_creator_deleted ON groups(creator_id, deleted_at);
CREATE INDEX idx_memberships_user_deleted ON group_memberships(user_id, deleted_at);
CREATE INDEX idx_memberships_group_role ON group_memberships(group_id, role, deleted_at);
CREATE INDEX idx_invitations_code ON group_invitations(code) WHERE expires_at > now();
CREATE INDEX idx_time_groups_entry ON time_entry_groups(time_entry_id);
CREATE INDEX idx_time_groups_group ON time_entry_groups(group_id);
```

### Query Optimization
- Use compound indexes for common filter combinations
- Leverage partial indexes for active records only
- Implement soft delete cleanup procedures
- Consider materialized views for complex group statistics

## Security Considerations

1. **RLS Enforcement**: All tables enforce row-level security
2. **Input Validation**: Check constraints prevent invalid data
3. **Audit Trail**: Soft deletes preserve membership history
4. **Access Control**: Admin-only operations clearly defined
5. **Invitation Security**: Time-limited codes with usage tracking