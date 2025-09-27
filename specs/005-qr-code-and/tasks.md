# Tasks: Enhanced Group Management, Export System, and History Improvements

**Input**: Design documents from `/specs/005-qr-code-and/`
**Prerequisites**: plan.md (complete), research.md (complete), data-model.md (complete), contracts/ (complete)

## Execution Flow (main)
```
1. Load plan.md from feature directory ✓
   → Extract: Next.js 14, React 18, Supabase, TypeScript, Recharts
2. Load optional design documents: ✓
   → data-model.md: 5 entities → model tasks
   → contracts/: api-contracts.yaml → 9 endpoint groups → contract test tasks
   → quickstart.md: 7 scenarios → integration test tasks
3. Generate tasks by category:
   → Setup: Database migrations, dependencies
   → Tests: Contract tests, integration tests
   → Core: API endpoints, UI components
   → Integration: Charts, email delivery
   → Polish: Performance, validation
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Database before API before UI (dependency order)
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness ✓
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
Next.js application structure:
- **API routes**: `src/app/api/v1/`
- **Components**: `src/app/components/`
- **Pages**: `src/app/dashboard/`
- **Database**: Supabase migrations and types
- **Tests**: `tests/contract/`, `tests/integration/`

## Phase 3.1: Database Setup
- [x] T001 Create export_schedules table migration with indexes
- [x] T002 [P] Create export_logs table migration for audit trail
- [x] T003 [P] Extend group_invitations table with QR tracking fields
- [x] T004 [P] Extend group_memberships table with roles and rates
- [x] T005 Apply all database migrations and update Supabase types

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T006 [P] Contract test GET /api/v1/groups/{groupId}/members in tests/contract/test_group_members_get.ts
- [ ] T007 [P] Contract test POST /api/v1/groups/{groupId}/members in tests/contract/test_group_members_post.ts
- [ ] T008 [P] Contract test PATCH /api/v1/groups/{groupId}/members/{memberId} in tests/contract/test_group_members_patch.ts
- [ ] T009 [P] Contract test DELETE /api/v1/groups/{groupId}/members/{memberId} in tests/contract/test_group_members_delete.ts
- [ ] T010 [P] Contract test DELETE /api/v1/groups/{groupId} in tests/contract/test_groups_delete.ts
- [ ] T011 [P] Contract test POST /api/v1/groups/{groupId}/invitations/qr in tests/contract/test_qr_invitations_post.ts
- [ ] T012 [P] Contract test POST /api/v1/invitations/{code}/join in tests/contract/test_invitations_join.ts
- [ ] T013 [P] Contract test GET /api/v1/export-schedules in tests/contract/test_export_schedules_get.ts
- [ ] T014 [P] Contract test POST /api/v1/export-schedules in tests/contract/test_export_schedules_post.ts
- [ ] T015 [P] Contract test PATCH /api/v1/export-schedules/{scheduleId} in tests/contract/test_export_schedules_patch.ts
- [ ] T016 [P] Contract test DELETE /api/v1/export-schedules/{scheduleId} in tests/contract/test_export_schedules_delete.ts
- [ ] T017 [P] Contract test POST /api/v1/exports/generate in tests/contract/test_exports_generate.ts
- [ ] T018 [P] Contract test GET /api/v1/history/visualization in tests/contract/test_history_visualization.ts
- [ ] T019 [P] Integration test QR code generation and joining in tests/integration/test_qr_workflow.ts
- [ ] T020 [P] Integration test member management operations in tests/integration/test_member_management.ts
- [ ] T021 [P] Integration test group deletion workflow in tests/integration/test_group_deletion.ts
- [ ] T022 [P] Integration test enhanced export system in tests/integration/test_export_system.ts
- [ ] T023 [P] Integration test automated export scheduling in tests/integration/test_export_scheduling.ts
- [ ] T024 [P] Integration test history visualization in tests/integration/test_history_charts.ts
- [ ] T025 [P] Integration test role-based access control in tests/integration/test_rbac.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Database Models & Types
- [ ] T026 [P] ExportSchedule TypeScript interface in src/types/export-schedule.ts
- [ ] T027 [P] ExportLog TypeScript interface in src/types/export-log.ts
- [ ] T028 [P] Enhanced GroupInvitation interface in src/types/group-invitation.ts
- [ ] T029 [P] Enhanced GroupMembership interface in src/types/group-membership.ts

### API Endpoints - Group Management
- [ ] T030 GET /api/v1/groups/[groupId]/members route in src/app/api/v1/groups/[groupId]/members/route.ts
- [ ] T031 POST /api/v1/groups/[groupId]/members route (same file as T030)
- [ ] T032 PATCH /api/v1/groups/[groupId]/members/[memberId] route in src/app/api/v1/groups/[groupId]/members/[memberId]/route.ts
- [ ] T033 DELETE /api/v1/groups/[groupId]/members/[memberId] route (same file as T032)
- [ ] T034 DELETE /api/v1/groups/[groupId] route in src/app/api/v1/groups/[groupId]/route.ts

### API Endpoints - QR Code & Invitations
- [ ] T035 [P] POST /api/v1/groups/[groupId]/invitations/qr route in src/app/api/v1/groups/[groupId]/invitations/qr/route.ts
- [ ] T036 [P] POST /api/v1/invitations/[code]/join route in src/app/api/v1/invitations/[code]/join/route.ts

### API Endpoints - Export System
- [ ] T037 GET /api/v1/export-schedules route in src/app/api/v1/export-schedules/route.ts
- [ ] T038 POST /api/v1/export-schedules route (same file as T037)
- [ ] T039 PATCH /api/v1/export-schedules/[scheduleId] route in src/app/api/v1/export-schedules/[scheduleId]/route.ts
- [ ] T040 DELETE /api/v1/export-schedules/[scheduleId] route (same file as T039)
- [ ] T041 [P] POST /api/v1/exports/generate route in src/app/api/v1/exports/generate/route.ts

### API Endpoints - History & Visualization
- [ ] T042 [P] GET /api/v1/history/visualization route in src/app/api/v1/history/visualization/route.ts

### Frontend Components & Pages
- [ ] T043 [P] Enhanced Groups page with member management in src/app/dashboard/groups/page.tsx
- [ ] T044 [P] QR code generation component in src/components/QRCodeGenerator.tsx
- [ ] T045 [P] Member management interface in src/components/MemberManagement.tsx
- [ ] T046 Enhanced Export page with group selection in src/app/dashboard/export/page.tsx
- [ ] T047 Daily export automation section (same file as T046)
- [ ] T048 History page with table and charts in src/app/dashboard/history/page.tsx
- [ ] T049 [P] Time visualization charts component in src/components/TimeCharts.tsx

## Phase 3.4: Integration & Services

### Chart Integration
- [ ] T050 [P] Install and configure Recharts library
- [ ] T051 [P] Time series data formatting service in src/lib/chart-data.ts
- [ ] T052 Connect charts to history visualization API

### Export Services
- [ ] T053 [P] CSV export generation service in src/lib/export-csv.ts
- [ ] T054 [P] PDF export generation service in src/lib/export-pdf.ts
- [ ] T055 [P] Excel export generation service in src/lib/export-excel.ts
- [ ] T056 Email delivery service integration for scheduled exports

### Background Jobs
- [ ] T057 [P] Daily export scheduler implementation
- [ ] T058 [P] QR code expiration cleanup job
- [ ] T059 Export execution monitoring and retry logic

### Security & Permissions
- [ ] T060 Role-based permission middleware in src/lib/rbac.ts
- [ ] T061 Group manager authorization checks
- [ ] T062 Data isolation validation for cross-group access
- [ ] T063 Audit logging for sensitive operations

## Phase 3.5: Polish & Optimization

### Performance
- [ ] T064 [P] Optimize chart rendering for large datasets (1000+ entries)
- [ ] T065 [P] Database query optimization with proper indexing
- [ ] T066 [P] Export generation performance testing and optimization

### Error Handling & Validation
- [ ] T067 [P] Input validation for all API endpoints
- [ ] T068 [P] Enhanced error messages for QR code failures
- [ ] T069 [P] Email delivery failure handling and notifications

### Testing & Documentation
- [ ] T070 [P] Unit tests for chart data transformation in tests/unit/test_chart_data.ts
- [ ] T071 [P] Unit tests for export generation in tests/unit/test_export_services.ts
- [ ] T072 [P] Unit tests for permission validation in tests/unit/test_rbac.ts
- [ ] T073 Performance tests for export generation (<30s for large datasets)
- [ ] T074 [P] Execute quickstart.md validation scenarios
- [ ] T075 [P] Update API documentation with new endpoints

## Dependencies

### Critical Dependencies (Must Complete in Order)
- Database setup (T001-T005) before ALL API endpoints (T030-T042)
- Tests (T006-T025) before implementation (T026-T049)
- API endpoints before frontend components that consume them
- T030-T034 (member management APIs) before T043 (Groups page)
- T037-T041 (export APIs) before T046-T047 (Export page)
- T042 (history API) before T048-T049 (History page + charts)

### Specific File Dependencies
- T030/T031 share same file (sequential)
- T032/T033 share same file (sequential)
- T037/T038 share same file (sequential)
- T039/T040 share same file (sequential)
- T046/T047 share same file (sequential)

### Integration Dependencies
- T050-T051 before T049, T052 (charts setup before usage)
- T053-T055 before T041 (export services before generate endpoint)
- T060-T063 integrated throughout API implementation

## Parallel Execution Examples

### Database Setup (Can run together)
```
Task: "Create export_schedules table migration with indexes"
Task: "Create export_logs table migration for audit trail"
Task: "Extend group_invitations table with QR tracking fields"
Task: "Extend group_memberships table with roles and rates"
```

### Contract Tests Phase (All independent)
```
Task: "Contract test GET /api/v1/groups/{groupId}/members in tests/contract/test_group_members_get.ts"
Task: "Contract test POST /api/v1/groups/{groupId}/members in tests/contract/test_group_members_post.ts"
Task: "Contract test PATCH /api/v1/groups/{groupId}/members/{memberId} in tests/contract/test_group_members_patch.ts"
...
Task: "Contract test GET /api/v1/history/visualization in tests/contract/test_history_visualization.ts"
```

### TypeScript Interfaces (All independent)
```
Task: "ExportSchedule TypeScript interface in src/types/export-schedule.ts"
Task: "ExportLog TypeScript interface in src/types/export-log.ts"
Task: "Enhanced GroupInvitation interface in src/types/group-invitation.ts"
Task: "Enhanced GroupMembership interface in src/types/group-membership.ts"
```

### Independent Components
```
Task: "QR code generation component in src/components/QRCodeGenerator.tsx"
Task: "Member management interface in src/components/MemberManagement.tsx"
Task: "Time visualization charts component in src/components/TimeCharts.tsx"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task or logical group
- Follow existing Next.js patterns and Supabase integration
- Maintain TypeScript strict mode compliance
- Use existing UI component library (Tailwind CSS)

## Task Generation Rules Applied
1. **From Contracts**: 9 endpoint groups → 13 contract tests [P] + implementation tasks
2. **From Data Model**: 5 entities → 4 TypeScript interfaces [P]
3. **From User Stories**: 7 scenarios → 7 integration tests [P]
4. **Ordering**: Database → Tests → Models → APIs → UI → Integration → Polish
5. **Dependencies**: File sharing prevents parallel execution

## Validation Checklist ✓
- [x] All contracts have corresponding tests (T006-T018)
- [x] All entities have model tasks (T026-T029)
- [x] All tests come before implementation (Phase 3.2 before 3.3)
- [x] Parallel tasks truly independent (different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Database migrations before API implementation
- [x] Integration tests cover all 7 quickstart scenarios

**Total Tasks**: 75 tasks covering complete feature implementation
**Estimated Completion**: 35-40 hours (with parallel execution)
**Ready for execution**: All prerequisites met, dependency order established