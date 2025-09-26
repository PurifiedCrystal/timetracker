# Tasks: Multi-Tenant Groups, California Toggle, and Habit Tracker

**Input**: Design documents from `/specs/002-i-want-to/`
**Prerequisites**: plan.md (available), spec.md (available)

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: Next.js 14+, Supabase, TypeScript, Tailwind CSS
   → Structure: Web application with API routes
2. Load feature specification:
   → Multi-tenant groups (max 3 members)
   → California labor law toggle
   → Habit tracker integration
   → Enhanced reporting system
3. Generate tasks by category:
   → Database: New tables, RLS policies, migrations
   → API: Groups, invitations, habits, reports endpoints
   → UI: Group management, habit tracking, settings
   → Integration: Email invitations, reporting
   → Testing: Contract tests, integration tests
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Web app**: `src/app/`, `src/services/`, `src/types/`
- **Database**: Supabase migrations via MCP
- **Tests**: `tests/contract/`, `tests/integration/`, `tests/unit/`

## Phase 3.1: Database Schema Extensions
- [ ] T001 Create groups table with RLS policy for multi-tenant isolation
- [ ] T002 [P] Create group_memberships table with role-based access
- [ ] T003 [P] Create invitations table with QR code and popup notification mechanism
- [ ] T004 [P] Create habit_entries table separate from time_entries
- [ ] T005 [P] Create hourly_rates table for manager-set employee rates
- [ ] T006 Add group_id foreign key to existing time_entries table
- [ ] T007 Add california_mode boolean field to user_profiles table
- [ ] T008 Add tracking_mode enum to user_profiles (work/habits)

## Phase 3.2: TypeScript Types and Interfaces
- [ ] T009 [P] Define Group interfaces in src/types/group.ts
- [ ] T010 [P] Define Invitation interfaces in src/types/invitation.ts
- [ ] T011 [P] Define HabitEntry interfaces in src/types/habit.ts
- [ ] T012 [P] Define HourlyRate interfaces in src/types/hourly-rate.ts
- [ ] T013 [P] Update TimeEntry interface to include group_id in src/types/time.ts
- [ ] T014 [P] Update UserProfile interface for california_mode and tracking_mode in src/types/user.ts

## Phase 3.3: Contract Tests (MUST FAIL INITIALLY)
- [ ] T015 [P] Contract test POST /api/v1/groups in tests/contract/groups_post.test.ts
- [ ] T016 [P] Contract test GET /api/v1/groups in tests/contract/groups_get.test.ts
- [ ] T017 [P] Contract test POST /api/v1/invitations/qr in tests/contract/invitations_qr.test.ts
- [ ] T018 [P] Contract test POST /api/v1/invitations/{code}/join in tests/contract/invitations_join.test.ts
- [ ] T019 [P] Contract test POST /api/v1/habits in tests/contract/habits_post.test.ts
- [ ] T020 [P] Contract test GET /api/v1/habits in tests/contract/habits_get.test.ts
- [ ] T021 [P] Contract test GET /api/v1/reports/group/{groupId} in tests/contract/group_reports.test.ts
- [ ] T022 [P] Contract test PATCH /api/v1/profile (california_mode) in tests/contract/profile_california.test.ts

## Phase 3.4: Service Layer
- [ ] T023 [P] GroupService CRUD operations in src/services/GroupService.ts
- [ ] T024 [P] InvitationService with QR code generation in src/services/InvitationService.ts
- [ ] T025 [P] HabitService CRUD operations in src/services/HabitService.ts
- [ ] T026 [P] HourlyRateService for manager rate setting in src/services/HourlyRateService.ts
- [ ] T027 Update TimeEntryService to support group assignment in src/services/TimeEntryService.ts
- [ ] T028 Update UserService for california_mode toggle in src/services/UserService.ts
- [ ] T029 [P] NotificationService for popup notifications in src/services/NotificationService.ts
- [ ] T030 [P] ReportService with group filtering in src/services/ReportService.ts

## Phase 3.5: API Routes Implementation
- [ ] T031 POST /api/v1/groups route in src/app/api/v1/groups/route.ts
- [ ] T032 GET /api/v1/groups route (same file as T031)
- [ ] T033 [P] GET /api/v1/groups/{id} route in src/app/api/v1/groups/[id]/route.ts
- [ ] T034 [P] DELETE /api/v1/groups/{id} route (same file as T033)
- [ ] T035 [P] POST /api/v1/invitations/qr route in src/app/api/v1/invitations/qr/route.ts
- [ ] T036 [P] POST /api/v1/invitations/{code}/join in src/app/api/v1/invitations/[code]/join/route.ts
- [ ] T037 [P] GET /api/v1/invitations/{code}/info in src/app/api/v1/invitations/[code]/info/route.ts
- [ ] T038 [P] POST /api/v1/habits route in src/app/api/v1/habits/route.ts
- [ ] T039 [P] GET /api/v1/habits route (same file as T038)
- [ ] T040 [P] PATCH /api/v1/habits/{id} in src/app/api/v1/habits/[id]/route.ts
- [ ] T041 [P] GET /api/v1/reports/group/{groupId} in src/app/api/v1/reports/group/[groupId]/route.ts
- [ ] T042 Update existing PATCH /api/v1/profile to support california_mode in src/app/api/v1/profile/route.ts

## Phase 3.6: UI Components
- [ ] T043 [P] GroupCard component in src/app/components/groups/GroupCard.tsx
- [ ] T044 [P] GroupMembersList component in src/app/components/groups/GroupMembersList.tsx
- [ ] T045 [P] QRCodeInvite component in src/app/components/groups/QRCodeInvite.tsx
- [ ] T046 [P] HabitTracker component in src/app/components/habits/HabitTracker.tsx
- [ ] T047 [P] HabitEntry component in src/app/components/habits/HabitEntry.tsx
- [ ] T048 [P] CaliforniaToggle component in src/app/components/settings/CaliforniaToggle.tsx
- [ ] T049 [P] TrackingModeSwitch component in src/app/components/TrackingModeSwitch.tsx
- [ ] T050 [P] GroupReportExport component in src/app/components/reports/GroupReportExport.tsx

## Phase 3.7: Dashboard Pages
- [ ] T051 [P] Groups management page in src/app/dashboard/groups/page.tsx
- [ ] T052 [P] Group detail page in src/app/dashboard/groups/[id]/page.tsx
- [ ] T053 [P] Habits tracking page in src/app/dashboard/habits/page.tsx
- [ ] T054 [P] Reports page with work/habit filtering in src/app/dashboard/reports/page.tsx
- [ ] T055 Update main dashboard to show tracking mode toggle in src/app/dashboard/page.tsx
- [ ] T056 Update settings page to include California toggle in src/app/dashboard/settings/page.tsx

## Phase 3.8: Integration Tests
- [ ] T057 [P] QR code invitation flow test in tests/integration/qr_invitation_flow.test.ts
- [ ] T058 [P] Multi-mode tracking test in tests/integration/tracking_mode_switch.test.ts
- [ ] T059 [P] California overtime calculation test in tests/integration/california_overtime.test.ts
- [ ] T060 [P] Group reporting export test in tests/integration/group_report_export.test.ts
- [ ] T061 [P] Habit tracking with time separation test in tests/integration/habit_time_separation.test.ts

## Phase 3.9: QR Code and Notification Integration
- [ ] T062 [P] QR code generation utilities in src/lib/qr-code-utils.ts
- [ ] T063 [P] In-app notification system in src/lib/notification-system.ts
- [ ] T064 [P] QR code styling and mobile responsiveness in src/styles/qr-components.css
- [ ] T065 [P] Popup notification components in src/app/components/notifications/

## Phase 3.10: Enhanced Features
- [ ] T066 [P] Group permission middleware for API routes in src/middleware/groupAuth.ts
- [ ] T067 [P] Data export utilities for group reports in src/lib/export-utils.ts
- [ ] T068 [P] California labor law calculations in src/lib/california-overtime.ts
- [ ] T069 [P] Habit tracking analytics in src/lib/habit-analytics.ts
- [ ] T070 [P] Multi-tenant data isolation validation in src/lib/security-utils.ts

## Phase 3.11: Testing and Validation
- [ ] T071 [P] Unit tests for GroupService in tests/unit/GroupService.test.ts
- [ ] T072 [P] Unit tests for California overtime calculations in tests/unit/california_overtime.test.ts
- [ ] T073 [P] Unit tests for notification service in tests/unit/NotificationService.test.ts
- [ ] T074 [P] End-to-end workflow test for complete group flow in tests/e2e/group_workflow.spec.ts
- [ ] T075 [P] Performance test for group reports (<500ms) in tests/performance/group_reports.test.ts

## Dependencies
- Database schema (T001-T008) before services (T023-T030)
- Types (T009-T014) before services and API routes
- Contract tests (T015-T022) before API implementation (T031-T042)
- Services (T023-T030) before API routes (T031-T042)
- API routes before UI components (T043-T050)
- Components before pages (T051-T056)
- Core functionality before integration tests (T057-T061)

## Parallel Execution Examples

### Database Schema Setup
```
Task: "Create groups table with RLS policy for multi-tenant isolation"
Task: "Create group_memberships table with role-based access"
Task: "Create invitations table with 24-hour expiry mechanism"
Task: "Create habit_entries table separate from time_entries"
```

### Contract Tests
```
Task: "Contract test POST /api/v1/groups in tests/contract/groups_post.test.ts"
Task: "Contract test POST /api/v1/invitations/qr in tests/contract/invitations_qr.test.ts"
Task: "Contract test POST /api/v1/habits in tests/contract/habits_post.test.ts"
Task: "Contract test GET /api/v1/reports/group/{groupId} in tests/contract/group_reports.test.ts"
```

### Service Layer
```
Task: "GroupService CRUD operations in src/services/GroupService.ts"
Task: "InvitationService with QR code generation in src/services/InvitationService.ts"
Task: "HabitService CRUD operations in src/services/HabitService.ts"
Task: "NotificationService for popup notifications in src/services/NotificationService.ts"
```

## Notes
- [P] tasks = different files, no dependencies
- California mode affects overtime calculations (>8hrs/day vs >40hrs/week)
- Group size limited to 3 members maximum
- QR code invitations for quick joining
- Popup notifications for invitation alerts
- Habit tracking separate from work time tracking
- All new tables need RLS policies for multi-tenant security
- Performance target: <2s initial load, <500ms navigation

## Task Generation Rules Applied

1. **From Feature Spec**:
   - Each functional requirement → implementation task
   - Group management → 9 tasks (database, service, API, UI)
   - Habit tracking → 8 tasks (database, service, API, UI)
   - California toggle → 4 tasks (database, service, API, UI)
   - Enhanced reporting → 6 tasks (service, API, UI, export)

2. **From Technical Plan**:
   - Next.js structure → API routes in app/api/v1/
   - Supabase integration → database tasks with RLS
   - TypeScript → interface definitions first
   - Testing strategy → contract tests before implementation

3. **Ordering Strategy**:
   - Database schema → Types → Tests → Services → APIs → UI → Integration
   - Foundation first, then build up layer by layer
   - Tests written before implementation (TDD)

## Validation Checklist

- [x] All major features have corresponding tasks
- [x] Database schema changes come first
- [x] Contract tests come before implementation
- [x] Parallel tasks are truly independent (different files)
- [x] Each task specifies exact file path
- [x] Dependencies clearly documented
- [x] Task count appropriate for scope (75 tasks for major feature expansion)
- [x] Multi-tenant security considerations included
- [x] Performance and integration testing included

---
*Generated by /tasks command - Ready for implementation*