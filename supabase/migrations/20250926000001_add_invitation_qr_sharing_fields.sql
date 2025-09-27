-- Migration: Add QR and sharing fields to invitations table
-- Feature: 006-group-creation-qr
-- Date: 2025-09-26

-- Add QR code and shareable link fields to existing invitations table
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS qr_code_data TEXT;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS shareable_token TEXT;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS invitation_type VARCHAR(20) DEFAULT 'direct';
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS access_count INTEGER DEFAULT 0;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMP;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(shareable_token);
CREATE INDEX IF NOT EXISTS idx_invitations_code ON invitations(invitation_code);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON invitations(expires_at);
CREATE INDEX IF NOT EXISTS idx_invitations_type ON invitations(invitation_type);

-- Add constraints
ALTER TABLE invitations ADD CONSTRAINT IF NOT EXISTS chk_invitation_type
  CHECK (invitation_type IN ('direct', 'qr_code', 'shareable_link'));

-- Update existing invitations to have default type
UPDATE invitations SET invitation_type = 'direct' WHERE invitation_type IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN invitations.qr_code_data IS 'Base64 encoded QR code image data URL';
COMMENT ON COLUMN invitations.shareable_token IS 'JWT token for secure shareable links';
COMMENT ON COLUMN invitations.token_expires_at IS 'Expiration timestamp for shareable tokens';
COMMENT ON COLUMN invitations.share_count IS 'Number of times invitation has been shared';
COMMENT ON COLUMN invitations.invitation_type IS 'Type of invitation: direct, qr_code, or shareable_link';
COMMENT ON COLUMN invitations.access_count IS 'Number of times invitation link was accessed';
COMMENT ON COLUMN invitations.last_accessed_at IS 'Timestamp of last invitation access';