# Research: Group Management and Sharing Fixes

**Feature**: 006-group-creation-qr
**Date**: 2025-09-26
**Status**: Complete

## Research Areas

### 1. QR Code Generation Libraries

**Decision**: Use existing `qrcode` npm package
**Rationale**:
- Already in dependencies (found in current codebase)
- Mature library with mobile device compatibility
- Supports data URL generation for direct embedding
- Configurable error correction levels

**Alternatives considered**:
- `qrcode-generator` - More lightweight but less feature-rich
- `react-qr-code` - React-specific but adds unnecessary abstraction
- Browser native QR APIs - Not yet widely supported

**Implementation approach**:
- Generate QR codes server-side in API routes
- Return base64 data URLs for frontend display
- Include error correction level 'M' for mobile scanning reliability

### 2. Shareable Link Strategy

**Decision**: JWT-based invitation tokens with expiration
**Rationale**:
- Secure and tamper-proof tokens
- Built-in expiration handling
- Can embed group_id and metadata
- Compatible with existing Supabase auth flow

**Alternatives considered**:
- UUID-based tokens in database - Requires additional DB lookups
- Simple query parameters - Security risk, easily manipulated
- Supabase magic links - Limited customization for group context

**Implementation approach**:
- Generate signed JWT tokens containing group_id and expiration
- Create dedicated invitation endpoint for token validation
- Handle both authenticated and unauthenticated users

### 3. Group Deletion Constraints

**Decision**: Soft delete with cascading membership cleanup
**Rationale**:
- Preserve time tracking history for regulatory compliance
- Allow for accidental deletion recovery
- Clean group membership associations immediately
- Maintain referential integrity

**Alternatives considered**:
- Hard delete - Loses historical data permanently
- Archive pattern - Complicates queries and UI
- Mark inactive only - Confusing for users

**Implementation approach**:
- Add `deleted_at` timestamp to groups table
- Update group queries to filter deleted groups
- Cascade membership deactivation
- Preserve time entries with group reference

### 4. Share Button Integration

**Decision**: Web Share API with fallback to clipboard
**Rationale**:
- Native mobile sharing experience when available
- Automatic fallback for desktop browsers
- Supports multiple sharing channels
- Progressive enhancement approach

**Alternatives considered**:
- Custom modal with share options - More complex implementation
- Email-only sharing - Limited user choice
- Third-party sharing widgets - External dependencies

**Implementation approach**:
- Detect Web Share API availability
- Generate shareable text with group name and link
- Fallback to clipboard copy with user feedback
- Include WhatsApp/email direct links as secondary options

### 5. Mobile QR Scanning Compatibility

**Decision**: High contrast QR codes with medium error correction
**Rationale**:
- Ensures scanning reliability across different lighting conditions
- Medium error correction balances data capacity and error tolerance
- High contrast (black/white) works with all camera types

**Research findings**:
- Minimum size: 21x21 modules for reliable scanning
- Error correction level 'M' (15%) optimal for invitation URLs
- Quiet zone of 4 modules around QR code essential
- Test on various mobile devices and camera qualities

### 6. Database Schema Updates Required

**Decision**: Extend existing invitations table
**Rationale**:
- Reuse existing invitation infrastructure
- Add fields for QR data and shareable tokens
- Maintain backward compatibility

**Schema changes needed**:
```sql
-- Add to existing invitations table
ALTER TABLE invitations ADD COLUMN qr_code_data TEXT;
ALTER TABLE invitations ADD COLUMN shareable_token TEXT;
ALTER TABLE invitations ADD COLUMN token_expires_at TIMESTAMP;
ALTER TABLE invitations ADD COLUMN share_count INTEGER DEFAULT 0;

-- Add to existing groups table
ALTER TABLE groups ADD COLUMN deleted_at TIMESTAMP;
```

## Technical Decisions Summary

| Component | Technology | Rationale |
|-----------|------------|-----------|
| QR Generation | qrcode npm package | Proven reliability, mobile compatibility |
| Shareable Links | JWT tokens | Security, built-in expiration, stateless |
| Group Deletion | Soft delete pattern | Data preservation, compliance, recovery |
| Share Button | Web Share API + clipboard | Native UX with universal fallback |
| Mobile Compatibility | High contrast, medium error correction | Cross-device scanning reliability |

## Risk Mitigation

**QR Code Scanning Issues**:
- Implement QR code validation endpoint
- Provide manual link entry as fallback
- Include troubleshooting guidance in UI

**Token Security**:
- Use short expiration times (24 hours default)
- Implement rate limiting on invitation endpoints
- Log invitation access for security monitoring

**Database Migration**:
- Use backward-compatible schema changes
- Test migration on copy of production data
- Implement rollback plan for schema changes

## Next Steps

All research complete - ready for Phase 1 design and contracts generation.

---
*Research completed: 2025-09-26*