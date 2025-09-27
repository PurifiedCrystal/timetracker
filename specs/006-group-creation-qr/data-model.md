# Data Model: Group Management and Sharing Fixes

**Feature**: 006-group-creation-qr
**Created**: 2025-09-26
**Source**: [spec.md](./spec.md)

## Entity Definitions

### Group
**Purpose**: Represents a team/organization with manager, members, settings, and invitation methods

**Fields**:
- `id` (UUID, Primary Key) - Unique group identifier
- `name` (String, Required) - Group display name
- `description` (String, Optional) - Group description
- `manager_id` (UUID, Foreign Key) - Reference to user who manages the group
- `created_at` (Timestamp) - Group creation time
- `updated_at` (Timestamp) - Last modification time
- `deleted_at` (Timestamp, Nullable) - Soft delete timestamp
- `member_limit` (Integer, Default: 50) - Maximum number of members allowed
- `settings` (JSONB) - Group configuration and preferences

**Relationships**:
- `manager` → User (belongs_to)
- `memberships` → GroupMembership[] (has_many)
- `invitations` → GroupInvitation[] (has_many)
- `time_entries` → TimeEntry[] (has_many)

**Validation Rules**:
- Name: 3-100 characters, non-empty
- Member limit: 1-100 members
- Manager must be valid user
- Deleted groups cannot be modified

**State Transitions**:
- Active → Deleted (soft delete)
- Deleted → Cannot be restored (business rule)

### QRCode
**Purpose**: Visual invitation method containing encoded group join information with validity status

**Fields**:
- `id` (UUID, Primary Key) - Unique QR code identifier
- `group_id` (UUID, Foreign Key) - Associated group
- `invitation_id` (UUID, Foreign Key) - Associated invitation
- `qr_data_url` (Text, Required) - Base64 encoded QR code image
- `encoded_url` (Text, Required) - URL encoded in the QR code
- `error_correction_level` (String, Default: 'M') - QR error correction level
- `generated_at` (Timestamp) - QR code generation time
- `scan_count` (Integer, Default: 0) - Number of times scanned
- `is_valid` (Boolean, Default: true) - Whether QR code is still valid

**Relationships**:
- `group` → Group (belongs_to)
- `invitation` → GroupInvitation (belongs_to)

**Validation Rules**:
- QR data URL must be valid base64 image
- Encoded URL must be valid invitation URL
- Error correction level: 'L', 'M', 'Q', 'H'
- Cannot modify after generation

### ShareableLink
**Purpose**: URL-based invitation containing group access token with expiration and usage tracking

**Fields**:
- `id` (UUID, Primary Key) - Unique link identifier
- `group_id` (UUID, Foreign Key) - Associated group
- `invitation_id` (UUID, Foreign Key) - Associated invitation
- `token` (String, Required, Unique) - JWT token for secure access
- `short_code` (String, Required, Unique) - Short identifier for URL
- `full_url` (Text, Required) - Complete shareable URL
- `expires_at` (Timestamp, Required) - Token expiration time
- `access_count` (Integer, Default: 0) - Number of times accessed
- `created_by` (UUID, Foreign Key) - User who created the link
- `created_at` (Timestamp) - Link creation time
- `last_accessed_at` (Timestamp, Nullable) - Last access time

**Relationships**:
- `group` → Group (belongs_to)
- `invitation` → GroupInvitation (belongs_to)
- `creator` → User (belongs_to)

**Validation Rules**:
- Token must be valid JWT
- Short code: 8-12 alphanumeric characters
- Expiration must be future date
- Cannot modify token after creation

**State Transitions**:
- Active → Expired (automatic on expiration)
- Active → Revoked (manual revocation)
- Expired/Revoked → Cannot be reactivated

### GroupInvitation
**Purpose**: Record of invitation attempts with status, method (QR/link), and tracking data

**Fields**:
- `id` (UUID, Primary Key) - Unique invitation identifier
- `group_id` (UUID, Foreign Key) - Target group
- `invited_by` (UUID, Foreign Key) - User who created invitation
- `invitation_code` (String, Required, Unique) - Unique invitation identifier
- `invitation_type` (Enum, Required) - 'qr_code', 'shareable_link', 'direct'
- `status` (Enum, Required) - 'pending', 'accepted', 'expired', 'revoked'
- `expires_at` (Timestamp, Required) - Invitation expiration
- `created_at` (Timestamp) - Invitation creation time
- `accepted_at` (Timestamp, Nullable) - When invitation was accepted
- `accepted_by` (UUID, Nullable, Foreign Key) - User who accepted
- `metadata` (JSONB) - Additional invitation data

**Relationships**:
- `group` → Group (belongs_to)
- `inviter` → User (belongs_to)
- `accepter` → User (belongs_to, nullable)
- `qr_code` → QRCode (has_one, nullable)
- `shareable_link` → ShareableLink (has_one, nullable)

**Validation Rules**:
- Invitation code: unique across all invitations
- Status transitions: pending → accepted/expired/revoked
- Expiration must be future date
- Accepted invitations cannot be modified

**State Transitions**:
- Pending → Accepted (user joins group)
- Pending → Expired (automatic on expiration)
- Pending → Revoked (manual by manager)
- Accepted → Cannot change status
- Expired/Revoked → Cannot be reactivated

### ShareAction
**Purpose**: User interaction to distribute group invitations through various channels

**Fields**:
- `id` (UUID, Primary Key) - Unique action identifier
- `invitation_id` (UUID, Foreign Key) - Associated invitation
- `user_id` (UUID, Foreign Key) - User performing share action
- `share_method` (Enum, Required) - 'web_share', 'clipboard', 'email', 'sms', 'whatsapp'
- `platform` (String, Optional) - Platform/app used for sharing
- `shared_at` (Timestamp) - When share action occurred
- `success` (Boolean, Default: true) - Whether share action succeeded
- `error_message` (Text, Nullable) - Error details if share failed

**Relationships**:
- `invitation` → GroupInvitation (belongs_to)
- `user` → User (belongs_to)

**Validation Rules**:
- Share method must be supported platform
- Error message required if success = false
- Cannot modify after creation (audit trail)

## Database Schema Changes

### New Tables
No new tables required - extending existing `invitations` table and using current group structure.

### Table Modifications

#### invitations table additions:
```sql
ALTER TABLE invitations ADD COLUMN qr_code_data TEXT;
ALTER TABLE invitations ADD COLUMN shareable_token TEXT;
ALTER TABLE invitations ADD COLUMN token_expires_at TIMESTAMP;
ALTER TABLE invitations ADD COLUMN share_count INTEGER DEFAULT 0;
ALTER TABLE invitations ADD COLUMN invitation_type VARCHAR(20) DEFAULT 'direct';
ALTER TABLE invitations ADD COLUMN access_count INTEGER DEFAULT 0;
ALTER TABLE invitations ADD COLUMN last_accessed_at TIMESTAMP;
```

#### groups table additions:
```sql
ALTER TABLE groups ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE groups ADD COLUMN member_limit INTEGER DEFAULT 50;
```

### Indexes
```sql
CREATE INDEX idx_invitations_token ON invitations(shareable_token);
CREATE INDEX idx_invitations_code ON invitations(invitation_code);
CREATE INDEX idx_groups_deleted_at ON groups(deleted_at);
CREATE INDEX idx_invitations_expires_at ON invitations(expires_at);
```

## Entity Relationships Diagram

```
User
├─ manages → Group (manager_id)
├─ member of → GroupMembership → Group
├─ creates → GroupInvitation
├─ accepts → GroupInvitation (accepted_by)
└─ performs → ShareAction

Group
├─ managed by → User (manager_id)
├─ has → GroupMembership[]
├─ has → GroupInvitation[]
└─ tracks → TimeEntry[]

GroupInvitation
├─ belongs to → Group
├─ created by → User (invited_by)
├─ accepted by → User (accepted_by)
├─ has → QRCode (optional)
├─ has → ShareableLink (optional)
└─ tracked by → ShareAction[]

QRCode
└─ belongs to → GroupInvitation

ShareableLink
└─ belongs to → GroupInvitation

ShareAction
├─ belongs to → GroupInvitation
└─ performed by → User
```

## Business Rules

### Group Management
1. Only group managers can generate QR codes and shareable links
2. Soft-deleted groups cannot be accessed but preserve historical data
3. Group member limits are enforced on invitation acceptance
4. Time entries remain linked to groups even after group deletion

### Invitation Lifecycle
1. QR codes and shareable links expire after 24 hours by default
2. Each invitation can have multiple sharing methods (QR + link)
3. Invitation acceptance creates group membership automatically
4. Expired invitations cannot be reactivated (new invitation required)

### Security Constraints
1. JWT tokens must include group_id and expiration
2. QR codes use medium error correction for mobile scanning
3. Short codes must be cryptographically random
4. Access tracking required for security monitoring

## Data Integrity Constraints

### Foreign Key Constraints
- All group_id references must point to existing, non-deleted groups
- User references must point to active user accounts
- Invitation acceptance requires valid user and group

### Check Constraints
- Expiration dates must be in the future
- Member limits must be positive integers
- QR error correction levels must be valid ('L', 'M', 'Q', 'H')
- Status transitions must follow allowed state machine

### Unique Constraints
- Invitation codes unique across all invitations
- Shareable tokens unique across all invitations
- Short codes unique across all shareable links

---
*Generated from spec.md requirements analysis*