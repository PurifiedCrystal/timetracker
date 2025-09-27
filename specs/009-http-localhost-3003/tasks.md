# Tasks: Database-Backed Group Management System

**Input**: Design documents from `D:\-=DropboxDoNotDelete=-\Dropbox\MyExecAssistant\00-Github-SpecKit+\timetracker\specs\009-http-localhost-3003\`
**Prerequisites**: plan.md (✓), research.md (✓), data-model.md (✓), contracts/ (✓), quickstart.md (✓)

## Tech Stack Summary
- **Language**: TypeScript with Next.js 14.2.33
- **Dependencies**: React, Supabase (auth + database), Lucide React icons
- **Storage**: Supabase PostgreSQL
- **Structure**: Web application with API routes
- **Testing**: Next.js testing framework

## Path Conventions
- **Frontend**: `src/app/`, `src/components/`
- **Backend**: `src/app/api/`
- **Tests**: `tests/contract/`, `tests/integration/`, `__tests__/`
- **Database**: `supabase/migrations/`

## Phase 3.1: Setup
- [ ] T001 Create Supabase migration files for groups schema
- [ ] T002 [P] Install additional dependencies for testing framework
- [ ] T003 [P] Configure TypeScript types for database entities

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests (API Endpoints)
- [ ] T004 [P] Contract test GET /api/v1/groups in `tests/contract/test_groups_get.ts`
- [ ] T005 [P] Contract test POST /api/v1/groups in `tests/contract/test_groups_post.ts`
- [ ] T006 [P] Contract test PUT /api/v1/groups/{id} in `tests/contract/test_groups_put.ts`
- [ ] T007 [P] Contract test DELETE /api/v1/groups/{id} in `tests/contract/test_groups_delete.ts`
- [ ] T008 [P] Contract test GET /api/v1/groups/{id}/members in `tests/contract/test_group_members_get.ts`
- [ ] T009 [P] Contract test POST /api/v1/groups/{id}/members in `tests/contract/test_group_members_post.ts`
- [ ] T010 [P] Contract test DELETE /api/v1/groups/{id}/members/{userId} in `tests/contract/test_group_members_delete.ts`
- [ ] T011 [P] Contract test POST /api/v1/groups/{id}/invitations in `tests/contract/test_invitations_post.ts`
- [ ] T012 [P] Contract test GET /api/v1/groups/{id}/invitations in `tests/contract/test_invitations_get.ts`
- [ ] T013 [P] Contract test DELETE /api/v1/groups/{id}/invitations/{id} in `tests/contract/test_invitations_delete.ts`
- [ ] T014 [P] Contract test POST /api/v1/invitations/{code}/join in `tests/contract/test_invitation_join.ts`
- [ ] T015 [P] Contract test GET /api/v1/invitations/{code} in `tests/contract/test_invitation_details.ts`

### Integration Tests (User Scenarios)
- [ ] T016 [P] Integration test group creation flow in `tests/integration/test_group_creation.ts`
- [ ] T017 [P] Integration test QR invitation generation in `tests/integration/test_qr_invitation.ts`
- [ ] T018 [P] Integration test group joining via QR code in `tests/integration/test_group_joining.ts`
- [ ] T019 [P] Integration test group export functionality in `tests/integration/test_group_export.ts`
- [ ] T020 [P] Integration test group deletion preserving user data in `tests/integration/test_group_deletion.ts`
- [ ] T021 [P] Integration test "already member" error handling in `tests/integration/test_duplicate_join.ts`
- [ ] T022 [P] Integration test empty group export message in `tests/integration/test_empty_export.ts`

## Phase 3.3: Database Implementation (ONLY after tests are failing)

### Database Migrations
- [ ] T023 Create groups table migration in `supabase/migrations/20250115_001_create_groups.sql`
- [ ] T024 Create group_memberships table migration in `supabase/migrations/20250115_002_create_group_memberships.sql`
- [ ] T025 Create group_invitations table migration in `supabase/migrations/20250115_003_create_group_invitations.sql`
- [ ] T026 Create time_entry_groups table migration in `supabase/migrations/20250115_004_create_time_entry_groups.sql`
- [ ] T027 Create RLS policies migration in `supabase/migrations/20250115_005_create_rls_policies.sql`
- [ ] T028 Create indexes migration in `supabase/migrations/20250115_006_create_indexes.sql`

### TypeScript Types
- [ ] T029 [P] Database types in `src/types/database.types.ts`
- [ ] T030 [P] Group entity types in `src/lib/types/group.types.ts`
- [ ] T031 [P] Invitation entity types in `src/lib/types/invitation.types.ts`

### API Route Implementation
- [ ] T032 GET /api/v1/groups endpoint in `src/app/api/v1/groups/route.ts`
- [ ] T033 POST /api/v1/groups endpoint in `src/app/api/v1/groups/route.ts`
- [ ] T034 PUT /api/v1/groups/[id] endpoint in `src/app/api/v1/groups/[id]/route.ts`
- [ ] T035 DELETE /api/v1/groups/[id] endpoint in `src/app/api/v1/groups/[id]/route.ts`
- [ ] T036 GET /api/v1/groups/[id]/members endpoint in `src/app/api/v1/groups/[id]/members/route.ts`
- [ ] T037 POST /api/v1/groups/[id]/members endpoint in `src/app/api/v1/groups/[id]/members/route.ts`
- [ ] T038 DELETE /api/v1/groups/[id]/members/[userId] endpoint in `src/app/api/v1/groups/[id]/members/[userId]/route.ts`
- [ ] T039 [P] POST /api/v1/groups/[id]/invitations endpoint in `src/app/api/v1/groups/[id]/invitations/route.ts`
- [ ] T040 [P] GET /api/v1/groups/[id]/invitations endpoint in `src/app/api/v1/groups/[id]/invitations/route.ts`
- [ ] T041 [P] DELETE /api/v1/groups/[id]/invitations/[invitationId] endpoint in `src/app/api/v1/groups/[id]/invitations/[invitationId]/route.ts`
- [ ] T042 [P] POST /api/v1/invitations/[code]/join endpoint in `src/app/api/v1/invitations/[code]/join/route.ts`
- [ ] T043 [P] GET /api/v1/invitations/[code] endpoint in `src/app/api/v1/invitations/[code]/route.ts`

### Service Layer
- [ ] T044 [P] GroupService class in `src/lib/services/groupService.ts`
- [ ] T045 [P] InvitationService class in `src/lib/services/invitationService.ts`
- [ ] T046 [P] GroupMembershipService class in `src/lib/services/groupMembershipService.ts`

## Phase 3.4: Frontend Integration

### UI Components Enhancement
- [ ] T047 Update existing groups page to use database API in `src/app/dashboard/groups/page.tsx`
- [ ] T048 Enhance QRCodeInvite component with database persistence in `src/app/components/groups/QRCodeInvite.tsx`
- [ ] T049 Update export page to include group filtering in `src/app/dashboard/export/page.tsx`
- [ ] T050 [P] Create GroupMembersList component in `src/components/groups/GroupMembersList.tsx`
- [ ] T051 [P] Create GroupSettings component in `src/components/groups/GroupSettings.tsx`

### Hooks and State Management
- [ ] T052 [P] useGroups hook in `src/hooks/useGroups.ts`
- [ ] T053 [P] useGroupMembers hook in `src/hooks/useGroupMembers.ts`
- [ ] T054 [P] useInvitations hook in `src/hooks/useInvitations.ts`

## Phase 3.5: Integration & Error Handling

### Data Integration
- [ ] T055 Time entry association with groups in existing time tracking components
- [ ] T056 Group-based export filtering in existing export logic
- [ ] T057 Error handling for "Already a member" scenario per FR-016
- [ ] T058 Error handling for "No data to export" scenario per FR-017
- [ ] T059 QR code expiration handling per FR-015

### Data Migration
- [ ] T060 localStorage to database migration utility in `src/lib/utils/migrateGroupsData.ts`
- [ ] T061 Run migration for existing users on first database access

## Phase 3.6: Polish & Testing

### Unit Tests
- [ ] T062 [P] Unit tests for GroupService in `__tests__/services/groupService.test.ts`
- [ ] T063 [P] Unit tests for InvitationService in `__tests__/services/invitationService.test.ts`
- [ ] T064 [P] Unit tests for group validation in `__tests__/utils/groupValidation.test.ts`
- [ ] T065 [P] Unit tests for QR code generation in `__tests__/components/QRCodeInvite.test.ts`

### Performance & Polish
- [ ] T066 Database query optimization for group loading
- [ ] T067 Implement proper loading states in group components
- [ ] T068 Add proper error boundaries for group operations
- [ ] T069 Performance testing for group operations (<2s load time)
- [ ] T070 Run quickstart.md validation scenarios

## Dependencies

### Critical Paths
- **Setup** (T001-T003) → **Tests** (T004-T022) → **Implementation** (T023-T061) → **Polish** (T062-T070)
- **Database migrations** (T023-T028) must complete before API endpoints (T032-T043)
- **Types** (T029-T031) must complete before services (T044-T046)
- **Services** (T044-T046) must complete before API endpoints (T032-T043)
- **API endpoints** must complete before frontend integration (T047-T054)

### Blocking Dependencies
- T023-T028 block T032-T043 (Database before API)
- T029-T031 block T044-T046 (Types before services)
- T044-T046 block T032-T043 (Services before endpoints)
- T032-T043 block T047-T054 (API before frontend)
- T047-T049 block T055-T061 (Core UI before integration)

## Parallel Execution Examples

### Phase 3.2 - Contract Tests (All Parallel)
```bash
# Launch T004-T015 together:
Task: "Contract test GET /api/v1/groups in tests/contract/test_groups_get.ts"
Task: "Contract test POST /api/v1/groups in tests/contract/test_groups_post.ts"
Task: "Contract test PUT /api/v1/groups/{id} in tests/contract/test_groups_put.ts"
Task: "Contract test DELETE /api/v1/groups/{id} in tests/contract/test_groups_delete.ts"
# ... (continue with all contract tests)
```

### Phase 3.2 - Integration Tests (All Parallel)
```bash
# Launch T016-T022 together:
Task: "Integration test group creation flow in tests/integration/test_group_creation.ts"
Task: "Integration test QR invitation generation in tests/integration/test_qr_invitation.ts"
Task: "Integration test group joining via QR code in tests/integration/test_group_joining.ts"
# ... (continue with all integration tests)
```

### Phase 3.3 - Types (Parallel)
```bash
# Launch T029-T031 together:
Task: "Database types in src/types/database.types.ts"
Task: "Group entity types in src/lib/types/group.types.ts"
Task: "Invitation entity types in src/lib/types/invitation.types.ts"
```

### Phase 3.3 - Services (Parallel)
```bash
# Launch T044-T046 together:
Task: "GroupService class in src/lib/services/groupService.ts"
Task: "InvitationService class in src/lib/services/invitationService.ts"
Task: "GroupMembershipService class in src/lib/services/groupMembershipService.ts"
```

### Phase 3.6 - Unit Tests (All Parallel)
```bash
# Launch T062-T065 together:
Task: "Unit tests for GroupService in __tests__/services/groupService.test.ts"
Task: "Unit tests for InvitationService in __tests__/services/invitationService.test.ts"
Task: "Unit tests for group validation in __tests__/utils/groupValidation.test.ts"
Task: "Unit tests for QR code generation in __tests__/components/QRCodeInvite.test.ts"
```

## Validation Checklist

### Contract Coverage
- [x] All groups API endpoints have tests (T004-T007)
- [x] All group members API endpoints have tests (T008-T010)
- [x] All invitations API endpoints have tests (T011-T015)

### Entity Coverage
- [x] Groups entity → database migration (T023) + types (T030) + service (T044)
- [x] GroupMemberships entity → database migration (T024) + service (T046)
- [x] GroupInvitations entity → database migration (T025) + types (T031) + service (T045)
- [x] TimeEntryGroups entity → database migration (T026)

### User Story Coverage
- [x] Group creation → integration test (T016)
- [x] QR invitation → integration test (T017)
- [x] Group joining → integration test (T018)
- [x] Group export → integration test (T019)
- [x] Group deletion → integration test (T020)
- [x] Error scenarios → integration tests (T021-T022)

### TDD Compliance
- [x] All tests (T004-T022) come before implementation (T023+)
- [x] Parallel tasks use different files
- [x] Sequential tasks marked appropriately
- [x] Each task specifies exact file path

## Notes
- **[P] tasks** = different files, no dependencies, can run in parallel
- **Sequential tasks** = same file or dependency chain, must run in order
- **TDD Critical**: Verify all tests fail before implementing (T023+)
- **Migration Order**: Apply database migrations before running API tests
- **QR Preservation**: Existing QRCodeInvite component enhanced, not replaced
- **Data Migration**: Include utility to migrate from localStorage to database