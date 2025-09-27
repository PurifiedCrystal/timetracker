-- Migration: Add soft delete fields to groups table
-- Feature: 006-group-creation-qr
-- Date: 2025-09-26

-- Add soft delete and member limit fields to existing groups table
ALTER TABLE groups ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS member_limit INTEGER DEFAULT 50;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_groups_deleted_at ON groups(deleted_at);
CREATE INDEX IF NOT EXISTS idx_groups_active ON groups(id) WHERE deleted_at IS NULL;

-- Add constraints
ALTER TABLE groups ADD CONSTRAINT IF NOT EXISTS chk_member_limit_positive
  CHECK (member_limit > 0 AND member_limit <= 100);

-- Update existing groups to have default member limit
UPDATE groups SET member_limit = 50 WHERE member_limit IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN groups.deleted_at IS 'Soft delete timestamp - NULL means active group';
COMMENT ON COLUMN groups.member_limit IS 'Maximum number of members allowed in the group (1-100)';

-- Create view for active groups (commonly used query)
CREATE OR REPLACE VIEW active_groups AS
SELECT * FROM groups WHERE deleted_at IS NULL;

-- Add RLS policy updates for soft delete (if RLS is enabled)
-- This ensures deleted groups are not accessible via normal queries
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'groups'
    AND policyname = 'Users can view groups they are members of'
  ) THEN
    DROP POLICY "Users can view groups they are members of" ON groups;

    CREATE POLICY "Users can view active groups they are members of" ON groups
      FOR SELECT
      USING (
        deleted_at IS NULL AND
        (
          auth.uid() = manager_id OR
          EXISTS (
            SELECT 1 FROM group_memberships gm
            WHERE gm.group_id = groups.id
            AND gm.user_id = auth.uid()
            AND gm.is_active = true
          )
        )
      );
  END IF;
END $$;