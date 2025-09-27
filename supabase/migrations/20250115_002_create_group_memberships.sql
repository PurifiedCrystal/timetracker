-- Create group_memberships table for linking users to groups
CREATE TABLE IF NOT EXISTS group_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    invited_by UUID REFERENCES auth.users(id),
    deleted_at TIMESTAMP WITH TIME ZONE,

    -- Prevent duplicate active memberships
    UNIQUE(group_id, user_id, deleted_at)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_memberships_user_deleted ON group_memberships(user_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_memberships_group_role ON group_memberships(group_id, role, deleted_at);
CREATE INDEX IF NOT EXISTS idx_memberships_group_user ON group_memberships(group_id, user_id) WHERE deleted_at IS NULL;

-- Add RLS (Row Level Security) policy
ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;

-- Users can view memberships for groups they're part of
CREATE POLICY "Users can view group memberships" ON group_memberships
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM groups g
            JOIN group_memberships gm ON g.id = gm.group_id
            WHERE g.id = group_memberships.group_id
            AND gm.user_id = auth.uid()
            AND gm.deleted_at IS NULL
            AND g.deleted_at IS NULL
        )
    );

-- Group admins can manage memberships
CREATE POLICY "Group admins can manage memberships" ON group_memberships
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM groups g
            WHERE g.id = group_memberships.group_id
            AND (
                g.creator_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM group_memberships gm
                    WHERE gm.group_id = g.id
                    AND gm.user_id = auth.uid()
                    AND gm.role = 'admin'
                    AND gm.deleted_at IS NULL
                )
            )
            AND g.deleted_at IS NULL
        )
    );

-- Users can join groups (via invitation)
CREATE POLICY "Users can join groups" ON group_memberships
    FOR INSERT WITH CHECK (user_id = auth.uid());