# Research: Database-Backed Group Management System

**Date**: 2025-01-15
**Feature**: Database-Backed Group Management System
**Status**: Complete

## Research Areas

### 1. Supabase Database Integration Patterns

**Decision**: Use Supabase client-side integration with Row Level Security (RLS)
**Rationale**:
- Existing codebase already uses Supabase for authentication
- RLS ensures data security at database level
- Client-side queries reduce API surface area
- Built-in real-time subscriptions for live updates

**Alternatives Considered**:
- Server-side only API routes: More secure but higher complexity
- Direct database access: Not suitable for web applications
- Third-party group management service: Adds external dependency

### 2. Database Schema for Groups and Memberships

**Decision**: Three-table design with soft deletes
```sql
-- groups table
groups (id, name, description, creator_id, created_at, updated_at, deleted_at, max_members)

-- group_memberships table
group_memberships (id, group_id, user_id, role, joined_at, invited_by, deleted_at)

-- group_invitations table
group_invitations (id, group_id, code, expires_at, created_by, created_at, max_uses, used_count)
```

**Rationale**:
- Soft deletes preserve data integrity per FR-010
- Separate invitations table enables expiration and usage tracking
- Role field supports admin/member distinction
- Audit trail via created_at, joined_at, invited_by fields

**Alternatives Considered**:
- Hard deletes: Would lose data required by FR-010
- Single table with JSON: Poor query performance and no referential integrity
- No invitations table: Cannot track expiration or usage limits

### 3. QR Code Integration Architecture

**Decision**: Extend existing QRCodeInvite component with database persistence
**Rationale**:
- Preserves existing working QR functionality (FR-004)
- Component already handles QR generation and scanning
- Add database persistence layer underneath existing interface
- Minimal breaking changes to existing user flows

**Alternatives Considered**:
- Complete rewrite of QR system: High risk, violates "don't mess that up" constraint
- Separate QR service: Adds complexity without benefit
- Remove QR functionality: Violates explicit requirement to preserve it

### 4. Time Entry Association with Groups

**Decision**: Many-to-many relationship through junction table
```sql
time_entry_groups (time_entry_id, group_id, created_at)
```

**Rationale**:
- Users can be in multiple groups simultaneously
- Single time entry can contribute to multiple group reports
- Maintains referential integrity
- Enables efficient group-based queries for export

**Alternatives Considered**:
- Single group_id on time_entries: Cannot handle multiple group memberships
- JSON array of group IDs: Poor query performance and no referential integrity
- Duplicate time entries per group: Data inconsistency and storage waste

### 5. Export Functionality Integration

**Decision**: Extend existing export API with group filtering
**Rationale**:
- Leverage existing export infrastructure and Excel/CSV generation
- Add group_id parameter to existing export endpoints
- Reuse existing date range and format selection logic
- Minimal changes to export page UI

**Alternatives Considered**:
- Separate group export endpoints: Code duplication
- Client-side filtering only: Poor performance with large datasets
- Real-time export generation: Unnecessary complexity for this use case

### 6. Testing Strategy

**Decision**: Integration tests with Supabase test database
**Rationale**:
- Database operations require real database testing
- Supabase provides test database setup utilities
- Contract testing for API endpoints
- Component testing for UI interactions

**Alternatives Considered**:
- Mock database: Cannot test actual SQL constraints and RLS policies
- Unit tests only: Insufficient for database-driven features
- Manual testing only: Not repeatable or automated

## Architecture Decisions Summary

1. **Database**: Supabase PostgreSQL with RLS policies
2. **Schema**: Three normalized tables with soft deletes
3. **QR Integration**: Extend existing component with persistence
4. **Time Association**: Many-to-many through junction table
5. **Export**: Extend existing endpoints with group filtering
6. **Testing**: Integration tests with test database

## Next Steps

Phase 1 will use these research findings to:
1. Design detailed data model with Supabase schema
2. Create API contracts for group CRUD operations
3. Design integration points with existing QR and export systems
4. Generate test scenarios based on functional requirements