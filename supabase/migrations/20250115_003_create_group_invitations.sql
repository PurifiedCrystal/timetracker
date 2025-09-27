-- Create group_invitations table for QR code invitations
CREATE TABLE IF NOT EXISTS group_invitations (
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

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_invitations_code ON group_invitations(code) WHERE expires_at > now();
CREATE INDEX IF NOT EXISTS idx_invitations_group ON group_invitations(group_id);
CREATE INDEX IF NOT EXISTS idx_invitations_expires ON group_invitations(expires_at);
CREATE INDEX IF NOT EXISTS idx_invitations_active ON group_invitations(group_id, expires_at) WHERE expires_at > now() AND used_count < max_uses;

-- Add RLS (Row Level Security) policy
ALTER TABLE group_invitations ENABLE ROW LEVEL SECURITY;

-- Group members can view invitations for their groups
CREATE POLICY "Group members can view invitations" ON group_invitations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM group_memberships gm
            WHERE gm.group_id = group_invitations.group_id
            AND gm.user_id = auth.uid()
            AND gm.deleted_at IS NULL
        )
    );

-- Group admins can manage invitations
CREATE POLICY "Group admins can manage invitations" ON group_invitations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM groups g
            WHERE g.id = group_invitations.group_id
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

-- Function to generate unique invitation code
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    result TEXT := '';
    i INTEGER := 0;
BEGIN
    FOR i IN 1..32 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to check if invitation is valid
CREATE OR REPLACE FUNCTION is_invitation_valid(invitation_code TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM group_invitations
        WHERE code = invitation_code
        AND expires_at > now()
        AND used_count < max_uses
    );
END;
$$ LANGUAGE plpgsql;