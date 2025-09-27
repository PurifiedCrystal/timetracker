-- Create time_entry_groups table for many-to-many relationship
-- Note: This assumes there's an existing time_entries table
CREATE TABLE IF NOT EXISTS time_entry_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    time_entry_id UUID NOT NULL, -- References existing time_entries table
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

    -- Prevent duplicate associations
    UNIQUE(time_entry_id, group_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_time_groups_entry ON time_entry_groups(time_entry_id);
CREATE INDEX IF NOT EXISTS idx_time_groups_group ON time_entry_groups(group_id);
CREATE INDEX IF NOT EXISTS idx_time_groups_created ON time_entry_groups(created_at);

-- Add RLS (Row Level Security) policy
ALTER TABLE time_entry_groups ENABLE ROW LEVEL SECURITY;

-- Users can view time entry associations for groups they're members of
CREATE POLICY "Users can view time entry groups" ON time_entry_groups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM group_memberships gm
            WHERE gm.group_id = time_entry_groups.group_id
            AND gm.user_id = auth.uid()
            AND gm.deleted_at IS NULL
        )
    );

-- Users can create time entry associations for their own entries
CREATE POLICY "Users can create time entry groups" ON time_entry_groups
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM group_memberships gm
            WHERE gm.group_id = time_entry_groups.group_id
            AND gm.user_id = auth.uid()
            AND gm.deleted_at IS NULL
        )
    );

-- Group admins can manage time entry associations
CREATE POLICY "Group admins can manage time entry groups" ON time_entry_groups
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM groups g
            JOIN group_memberships gm ON g.id = gm.group_id
            WHERE g.id = time_entry_groups.group_id
            AND gm.user_id = auth.uid()
            AND gm.role = 'admin'
            AND gm.deleted_at IS NULL
            AND g.deleted_at IS NULL
        )
    );

-- Function to automatically associate time entries with user's groups
CREATE OR REPLACE FUNCTION associate_time_entry_with_groups(
    p_time_entry_id UUID,
    p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
    -- Associate the time entry with all groups the user is a member of
    INSERT INTO time_entry_groups (time_entry_id, group_id)
    SELECT p_time_entry_id, gm.group_id
    FROM group_memberships gm
    JOIN groups g ON gm.group_id = g.id
    WHERE gm.user_id = p_user_id
    AND gm.deleted_at IS NULL
    AND g.deleted_at IS NULL
    ON CONFLICT (time_entry_id, group_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;