-- Create groups table for team organization
CREATE TABLE IF NOT EXISTS groups (
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

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_groups_creator_deleted ON groups(creator_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_groups_deleted_at ON groups(deleted_at);
CREATE INDEX IF NOT EXISTS idx_groups_name ON groups(name) WHERE deleted_at IS NULL;

-- Add trigger for updating updated_at
CREATE OR REPLACE FUNCTION update_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER groups_update_updated_at
    BEFORE UPDATE ON groups
    FOR EACH ROW
    EXECUTE FUNCTION update_groups_updated_at();

-- Add RLS (Row Level Security) policy
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Users can view groups they created or are members of
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

CREATE POLICY "Creators can delete groups" ON groups
    FOR DELETE USING (auth.uid() = creator_id);