# Tasks: Time Tracking Application with Subscription Service

**Input**: Design documents from `/specs/001-build-a-simple/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Next.js Web App**: Frontend components in `src/components/`, API routes in `src/app/api/`
- **Database**: SQL files in `database/`, utilities in `src/lib/`
- **Tests**: Contract tests in `tests/contract/`, integration in `tests/integration/`

## Phase 3.1: Project Setup

- [x] **T001** Initialize Next.js 14 project with TypeScript and App Router
- [x] **T002** [P] Install dependencies: Supabase client, Stripe SDK, Tailwind CSS, testing libraries
- [x] **T003** [P] Configure ESLint, Prettier, and Husky pre-commit hooks
- [x] **T004** [P] Set up environment configuration with .env.local.example
- [x] **T005** Create project structure: src/components/, src/app/, src/lib/, tests/
- [x] **T006** [P] Configure Tailwind CSS with custom design tokens

## Phase 3.2: Database Setup

- [x] **T007** Create Supabase database schema in `database/schema.sql`
- [x] **T008** [P] Create user_profiles table with RLS policies in `database/tables/user_profiles.sql`
- [x] **T009** [P] Create time_entries table with RLS policies in `database/tables/time_entries.sql`
- [x] **T010** [P] Create subscriptions table with RLS policies in `database/tables/subscriptions.sql`
- [x] **T011** [P] Create export_configurations table with RLS policies in `database/tables/export_configurations.sql`
- [x] **T012** [P] Create labor_rule_applications table with RLS policies in `database/tables/labor_rule_applications.sql`
- [x] **T013** Create database indexes for performance in `database/indexes.sql`
- [x] **T014** Create database setup script `scripts/setup-database.js`

## Phase 3.3: Authentication & Core Services

- [x] **T015** Set up Supabase client configuration in `src/lib/supabase.ts`
- [x] **T016** Create authentication middleware in `src/middleware.ts`
- [x] **T017** [P] Create auth utilities in `src/lib/auth.ts`
- [x] **T018** [P] Create database utilities in `src/lib/database.ts`

## Phase 3.4: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.5
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests (API Endpoints)
- [x] **T019** [P] Contract test GET /api/v1/auth/session in `tests/contract/auth-session.test.ts`
- [x] **T020** [P] Contract test GET /api/v1/profile in `tests/contract/profile-get.test.ts`
- [ ] **T021** [P] Contract test PATCH /api/v1/profile in `tests/contract/profile-patch.test.ts`
- [ ] **T022** [P] Contract test GET /api/v1/time-entries in `tests/contract/time-entries-get.test.ts`
- [x] **T023** [P] Contract test POST /api/v1/time-entries in `tests/contract/time-entries-post.test.ts`
- [x] **T024** [P] Contract test PATCH /api/v1/time-entries/{id} in `tests/contract/time-entries-patch.test.ts`
- [ ] **T025** [P] Contract test GET /api/v1/time-entries/active in `tests/contract/time-entries-active.test.ts`
- [ ] **T026** [P] Contract test GET /api/v1/subscription in `tests/contract/subscription-get.test.ts`
- [x] **T027** [P] Contract test POST /api/v1/subscription in `tests/contract/subscription-post.test.ts`
- [ ] **T028** [P] Contract test GET /api/v1/exports in `tests/contract/exports-get.test.ts`
- [ ] **T029** [P] Contract test POST /api/v1/exports/generate in `tests/contract/exports-generate.test.ts`

### Integration Tests (User Scenarios)
- [x] **T030** [P] Integration test: New user signup and subscription flow in `tests/integration/user-onboarding.test.ts`
- [x] **T031** [P] Integration test: Clock in/out basic flow in `tests/integration/time-tracking-basic.test.ts`
- [ ] **T032** [P] Integration test: California labor rules application in `tests/integration/california-labor-rules.test.ts`
- [ ] **T033** [P] Integration test: Export functionality all formats in `tests/integration/export-functionality.test.ts`
- [ ] **T034** [P] Integration test: Subscription management flow in `tests/integration/subscription-management.test.ts`

## Phase 3.5: Data Models & Services (ONLY after tests are failing)

### Type Definitions
- [ ] **T035** [P] Create User types in `src/types/user.ts`
- [ ] **T036** [P] Create TimeEntry types in `src/types/time-entry.ts`
- [ ] **T037** [P] Create Subscription types in `src/types/subscription.ts`
- [ ] **T038** [P] Create Export types in `src/types/export.ts`

### Service Layer
- [ ] **T039** [P] Create UserService class in `src/services/UserService.ts`
- [ ] **T040** [P] Create TimeEntryService class in `src/services/TimeEntryService.ts`
- [ ] **T041** [P] Create SubscriptionService class in `src/services/SubscriptionService.ts`
- [ ] **T042** [P] Create ExportService class in `src/services/ExportService.ts`
- [ ] **T043** [P] Create LaborRulesService class in `src/services/LaborRulesService.ts`

## Phase 3.6: API Route Implementation

### Authentication Routes
- [ ] **T044** Implement GET /api/v1/auth/session in `src/app/api/v1/auth/session/route.ts`

### Profile Routes
- [ ] **T045** Implement GET /api/v1/profile in `src/app/api/v1/profile/route.ts`
- [ ] **T046** Implement PATCH /api/v1/profile in `src/app/api/v1/profile/route.ts`

### Time Entry Routes
- [ ] **T047** Implement GET /api/v1/time-entries in `src/app/api/v1/time-entries/route.ts`
- [ ] **T048** Implement POST /api/v1/time-entries in `src/app/api/v1/time-entries/route.ts`
- [ ] **T049** Implement PATCH /api/v1/time-entries/[id] in `src/app/api/v1/time-entries/[id]/route.ts`
- [ ] **T050** Implement GET /api/v1/time-entries/active in `src/app/api/v1/time-entries/active/route.ts`

### Subscription Routes
- [ ] **T051** Implement GET /api/v1/subscription in `src/app/api/v1/subscription/route.ts`
- [ ] **T052** Implement POST /api/v1/subscription in `src/app/api/v1/subscription/route.ts`
- [ ] **T053** Implement POST /api/v1/subscription/portal in `src/app/api/v1/subscription/portal/route.ts`

### Export Routes
- [ ] **T054** Implement GET /api/v1/exports in `src/app/api/v1/exports/route.ts`
- [ ] **T055** Implement POST /api/v1/exports in `src/app/api/v1/exports/route.ts`
- [ ] **T056** Implement PUT /api/v1/exports/[id] in `src/app/api/v1/exports/[id]/route.ts`
- [ ] **T057** Implement DELETE /api/v1/exports/[id] in `src/app/api/v1/exports/[id]/route.ts`
- [ ] **T058** Implement POST /api/v1/exports/generate in `src/app/api/v1/exports/generate/route.ts`

### Webhook Routes
- [ ] **T059** Implement POST /api/webhooks/stripe in `src/app/api/webhooks/stripe/route.ts`

## Phase 3.7: Frontend Components

### Core UI Components
- [ ] **T060** [P] Create Button component in `src/components/ui/Button.tsx`
- [ ] **T061** [P] Create Input component in `src/components/ui/Input.tsx`
- [ ] **T062** [P] Create Modal component in `src/components/ui/Modal.tsx`
- [ ] **T063** [P] Create Loading component in `src/components/ui/Loading.tsx`

### Layout Components
- [ ] **T064** [P] Create Header component in `src/components/layout/Header.tsx`
- [ ] **T065** [P] Create Sidebar component in `src/components/layout/Sidebar.tsx`
- [ ] **T066** [P] Create Footer component in `src/components/layout/Footer.tsx`

### Feature Components
- [ ] **T067** [P] Create ClockButton component in `src/components/time/ClockButton.tsx`
- [ ] **T068** [P] Create TimeDisplay component in `src/components/time/TimeDisplay.tsx`
- [ ] **T069** [P] Create TimeEntryList component in `src/components/time/TimeEntryList.tsx`
- [ ] **T070** [P] Create ExportDialog component in `src/components/export/ExportDialog.tsx`
- [ ] **T071** [P] Create SubscriptionStatus component in `src/components/subscription/SubscriptionStatus.tsx`

## Phase 3.8: Pages & Routes

### Public Pages
- [ ] **T072** Create landing page in `src/app/page.tsx`
- [ ] **T073** [P] Create login page in `src/app/login/page.tsx`
- [ ] **T074** [P] Create signup page in `src/app/signup/page.tsx`

### Protected Pages
- [ ] **T075** Create dashboard page in `src/app/dashboard/page.tsx`
- [ ] **T076** [P] Create profile settings page in `src/app/settings/profile/page.tsx`
- [ ] **T077** [P] Create export management page in `src/app/exports/page.tsx`
- [ ] **T078** [P] Create subscription management page in `src/app/subscription/page.tsx`
- [ ] **T079** [P] Create time entries history page in `src/app/history/page.tsx`

## Phase 3.9: Integration & Advanced Features

### Export System Implementation
- [ ] **T080** [P] Create CSV export generator in `src/lib/exporters/csv.ts`
- [ ] **T081** [P] Create PDF export generator in `src/lib/exporters/pdf.ts`
- [ ] **T082** [P] Create Excel export generator in `src/lib/exporters/xlsx.ts`
- [ ] **T083** Create export scheduler service in `src/services/ExportScheduler.ts`

### California Labor Rules
- [ ] **T084** [P] Create overtime calculation utilities in `src/lib/labor-rules/overtime.ts`
- [ ] **T085** [P] Create meal period tracking utilities in `src/lib/labor-rules/meal-periods.ts`
- [ ] **T086** Create labor rules processor in `src/services/LaborRulesProcessor.ts`

### Real-time Features
- [ ] **T087** Set up Supabase real-time subscriptions in `src/lib/realtime.ts`
- [ ] **T088** Create real-time time entry updates in dashboard

## Phase 3.10: Testing & Quality

### Unit Tests
- [ ] **T089** [P] Unit tests for UserService in `tests/unit/services/UserService.test.ts`
- [ ] **T090** [P] Unit tests for TimeEntryService in `tests/unit/services/TimeEntryService.test.ts`
- [ ] **T091** [P] Unit tests for LaborRulesService in `tests/unit/services/LaborRulesService.test.ts`
- [ ] **T092** [P] Unit tests for export generators in `tests/unit/exporters/`
- [ ] **T093** [P] Unit tests for UI components in `tests/unit/components/`

### End-to-End Tests
- [ ] **T094** [P] E2E test: Complete user journey in `tests/e2e/user-journey.spec.ts`
- [ ] **T095** [P] E2E test: Time tracking workflow in `tests/e2e/time-tracking.spec.ts`
- [ ] **T096** [P] E2E test: Subscription flow in `tests/e2e/subscription.spec.ts`

## Phase 3.11: Performance & Security

- [ ] **T097** [P] Implement API rate limiting middleware
- [ ] **T098** [P] Add database query optimization and caching
- [ ] **T099** [P] Implement error monitoring with Sentry
- [ ] **T100** [P] Add performance monitoring for Core Web Vitals
- [ ] **T101** Security audit and penetration testing
- [ ] **T102** Performance testing with 1000+ concurrent users

## Phase 3.12: Deployment & Polish

- [ ] **T103** [P] Create deployment configuration for Vercel
- [ ] **T104** [P] Set up CI/CD pipeline with GitHub Actions
- [ ] **T105** [P] Create Docker configuration for local development
- [ ] **T106** [P] Update README.md with setup and deployment instructions
- [ ] **T107** Create production environment setup checklist
- [ ] **T108** Run complete quickstart validation
- [ ] **T109** Performance optimization and bundle analysis
- [ ] **T110** Final security review and compliance check

## Dependencies

### Critical Path
1. **Setup** (T001-T006) → **Database** (T007-T014) → **Auth** (T015-T018)
2. **Tests** (T019-T034) → **Implementation** (T035-T102)
3. **Core API** (T044-T059) → **Frontend** (T060-T079)
4. **Integration** (T080-T088) → **Testing** (T089-T096) → **Deployment** (T103-T110)

### Parallel Execution Blocks
- **T002, T003, T004, T006** can run together (different config files)
- **T008-T012** can run together (different table files)
- **T019-T034** can run together (different test files)
- **T035-T038** can run together (different type files)
- **T039-T043** can run together (different service files)
- **T060-T066** can run together (different component files)

## Parallel Execution Examples

### Block 1: Initial Setup
```bash
# Launch T002-T004, T006 together:
Task: "Install dependencies: Supabase client, Stripe SDK, Tailwind CSS, testing libraries"
Task: "Configure ESLint, Prettier, and Husky pre-commit hooks"
Task: "Set up environment configuration with .env.local.example"
Task: "Configure Tailwind CSS with custom design tokens"
```

### Block 2: Database Tables
```bash
# Launch T008-T012 together:
Task: "Create user_profiles table with RLS policies in database/tables/user_profiles.sql"
Task: "Create time_entries table with RLS policies in database/tables/time_entries.sql"
Task: "Create subscriptions table with RLS policies in database/tables/subscriptions.sql"
Task: "Create export_configurations table with RLS policies in database/tables/export_configurations.sql"
Task: "Create labor_rule_applications table with RLS policies in database/tables/labor_rule_applications.sql"
```

### Block 3: Contract Tests
```bash
# Launch T019-T029 together:
Task: "Contract test GET /api/v1/auth/session in tests/contract/auth-session.test.ts"
Task: "Contract test GET /api/v1/profile in tests/contract/profile-get.test.ts"
Task: "Contract test PATCH /api/v1/profile in tests/contract/profile-patch.test.ts"
# ... (continue with all contract tests)
```

## Validation Checklist
*GATE: Checked by main() before returning*

- [x] All contracts have corresponding tests (T019-T029)
- [x] All entities have model/service tasks (T035-T043)
- [x] All tests come before implementation (T019-T034 before T035+)
- [x] Parallel tasks truly independent (different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] TDD order maintained (tests first, then implementation)
- [x] All API endpoints from contract implemented (T044-T058)
- [x] All user scenarios have integration tests (T030-T034)

## Notes

- **[P] tasks** = different files, no dependencies, can run in parallel
- **Critical**: Verify all tests fail before implementing (T019-T034 before T035+)
- **Commit after each task** to maintain clean git history
- **California users only**: Labor rules apply based on user location_state = 'CA'
- **Stripe test mode**: Use test keys during development
- **Performance targets**: <2s initial load, <500ms API responses
- **Security**: All API routes require authentication except public landing page

_Tasks generated: 2025-09-24 | Total: 110 tasks | Estimated: 35-40 hours_