# Tasks: Group Management and Sharing Fixes

**Input**: Design documents from `/specs/006-group-creation-qr/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory ✅
   → Extract: Next.js 14.2.33, TypeScript 5.x, React 18, QRCode.js, Supabase
2. Load optional design documents: ✅
   → data-model.md: Group, GroupInvitation entities
   → contracts/: QR generation, shareable links, group deletion APIs
   → research.md: QRCode library, JWT tokens, soft delete decisions
3. Generate tasks by category:
   → Setup: database migrations, dependencies
   → Tests: contract tests, integration tests
   → Core: API routes, services, UI components
   → Integration: middleware, validation, error handling
   → Polish: unit tests, performance, documentation
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness ✅
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Next.js Web app**: `src/app/api/` (backend), `src/app/` (frontend), `src/components/`, `src/lib/`
- **Tests**: Root level `__tests__/` or co-located test files

## Phase 3.1: Setup
- [x] T001 Database migration: Add QR and sharing fields to invitations table (supabase/migrations/)
- [x] T002 Database migration: Add soft delete fields to groups table (supabase/migrations/)
- [x] T003 [P] Install and configure QRCode.js dependency if missing
- [x] T004 [P] Create shared types for invitation management in src/lib/types/invitations.ts

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [x] T005 [P] Contract test POST /api/v1/groups/{id}/invitations/qr in __tests__/api/qr-generation.test.ts
- [x] T006 [P] Contract test POST /api/v1/groups/{id}/invitations/link in __tests__/api/shareable-links.test.ts
- [x] T007 [P] Contract test GET /invite/{code} invitation access in __tests__/api/invitation-access.test.ts
- [x] T008 [P] Contract test DELETE /api/v1/groups/{id} group deletion in __tests__/api/group-deletion.test.ts
- [x] T009 [P] Contract test GET /api/v1/groups/{id}/deletion-preview in __tests__/api/deletion-preview.test.ts
- [x] T010 [P] Integration test QR code generation flow in __tests__/integration/qr-flow.test.ts
- [x] T011 [P] Integration test shareable link flow in __tests__/integration/sharing-flow.test.ts
- [x] T012 [P] Integration test group deletion flow in __tests__/integration/deletion-flow.test.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Database and Services Layer
- [x] T013 [P] Create QRCodeService in src/lib/services/QRCodeService.ts
- [x] T014 [P] Create ShareableLinkService in src/lib/services/ShareableLinkService.ts
- [x] T015 [P] Create GroupDeletionService in src/lib/services/GroupDeletionService.ts
- [x] T016 [P] Create InvitationService updates in src/lib/services/InvitationService.ts
- [x] T017 [P] JWT token utilities for shareable links in src/lib/utils/invitation-tokens.ts

### API Routes Implementation
- [x] T018 QR Code generation API route in src/app/api/v1/groups/[id]/invitations/qr/route.ts
- [x] T019 Shareable link creation API route in src/app/api/v1/groups/[id]/invitations/link/route.ts
- [x] T020 Share action tracking API route in src/app/api/v1/groups/invitations/[code]/share/route.ts
- [x] T021 Invitation access page API route in src/app/api/v1/invite/[code]/route.ts
- [x] T022 Group deletion API route updates in src/app/api/v1/groups/[id]/route.ts (DELETE method)
- [x] T023 Group deletion preview API route in src/app/api/v1/groups/[id]/deletion-preview/route.ts

### Frontend Components
- [x] T024 [P] QR Code generation component in src/components/groups/QRCodeGenerator.tsx
- [x] T025 [P] Shareable link component in src/components/groups/ShareableLinks.tsx
- [x] T026 [P] Share button component with Web Share API in src/components/groups/ShareButton.tsx
- [x] T027 [P] Group deletion confirmation modal in src/components/groups/DeleteGroupModal.tsx
- [x] T028 [P] Invitation acceptance page in src/app/invite/[code]/page.tsx

### Frontend Pages and Integration
- [x] T029 Update groups management page with QR and sharing features in src/app/dashboard/groups/[id]/page.tsx
- [x] T030 Update groups list page with soft delete filtering in src/app/dashboard/groups/page.tsx

## Phase 3.4: Integration
- [x] T031 Add invitation middleware for authentication handling in src/lib/middleware/invitation-auth.ts
- [x] T032 Update group queries to filter soft-deleted groups in src/lib/services/GroupService.ts
- [x] T033 Error handling for QR generation failures in QR API route
- [x] T034 Error handling for JWT token validation in invitation processing
- [x] T035 Rate limiting for invitation generation endpoints
- [x] T036 Logging and monitoring for group deletion actions

## Phase 3.5: Polish
- [x] T037 [P] Unit tests for QRCodeService in __tests__/unit/QRCodeService.test.ts
- [x] T038 [P] Unit tests for ShareableLinkService in __tests__/unit/ShareableLinkService.test.ts
- [x] T039 [P] Unit tests for GroupDeletionService in __tests__/unit/GroupDeletionService.test.ts
- [x] T040 [P] Unit tests for JWT token utilities in __tests__/unit/invitation-tokens.test.ts
- [ ] T041 Performance test: QR generation under 500ms load testing
- [ ] T042 Performance test: Link creation under 200ms load testing
- [ ] T043 Mobile compatibility testing using device simulation
- [x] T044 Execute quickstart.md validation scenarios
- [ ] T045 Security audit of JWT token handling and QR code validation
- [x] T046 Update component documentation and add code comments

## Dependencies
```
Setup (T001-T004) → Tests (T005-T012) → Core (T013-T030) → Integration (T031-T036) → Polish (T037-T046)

Specific Dependencies:
- T001,T002 (DB migrations) before all API implementations (T018-T023)
- T013-T017 (Services) before API routes (T018-T023)
- T018-T023 (API routes) before frontend components (T024-T028)
- T024-T028 (Components) before page integration (T029-T030)
- T031-T032 (Middleware/services) can run with core implementation
- All tests (T005-T012) must be written and failing before any implementation
```

## Parallel Execution Examples
```
# Setup Phase - All can run in parallel after DB migrations:
Task: "Install and configure QRCode.js dependency if missing"
Task: "Create shared types for invitation management in src/lib/types/invitations.ts"

# Test Phase - All contract tests in parallel:
Task: "Contract test POST /api/v1/groups/{id}/invitations/qr in __tests__/api/qr-generation.test.ts"
Task: "Contract test POST /api/v1/groups/{id}/invitations/link in __tests__/api/shareable-links.test.ts"
Task: "Contract test GET /invite/{code} invitation access in __tests__/api/invitation-access.test.ts"
Task: "Contract test DELETE /api/v1/groups/{id} group deletion in __tests__/api/group-deletion.test.ts"
Task: "Contract test GET /api/v1/groups/{id}/deletion-preview in __tests__/api/deletion-preview.test.ts"

# Service Layer - All services in parallel:
Task: "Create QRCodeService in src/lib/services/QRCodeService.ts"
Task: "Create ShareableLinkService in src/lib/services/ShareableLinkService.ts"
Task: "Create GroupDeletionService in src/lib/services/GroupDeletionService.ts"
Task: "Create InvitationService updates in src/lib/services/InvitationService.ts"
Task: "JWT token utilities for shareable links in src/lib/utils/invitation-tokens.ts"

# Frontend Components - All components in parallel:
Task: "QR Code generation component in src/components/groups/QRCodeGenerator.tsx"
Task: "Shareable link component in src/components/groups/ShareableLinks.tsx"
Task: "Share button component with Web Share API in src/components/groups/ShareButton.tsx"
Task: "Group deletion confirmation modal in src/components/groups/DeleteGroupModal.tsx"
Task: "Invitation acceptance page in src/app/invite/[code]/page.tsx"
```

## Critical Implementation Notes

### QR Code Generation Fix
- **Current Issue**: QR generation failing due to missing server-side implementation
- **Solution**: Implement server-side QR generation with QRCode.js in API route
- **Key Files**: T018 (API route), T013 (service), T024 (component)

### Group Deletion Fix
- **Current Issue**: Group deletion not working properly
- **Solution**: Implement soft delete with cascading cleanup and confirmation flow
- **Key Files**: T022 (API route), T015 (service), T027 (modal), T032 (query updates)

### Shareable Links (New Feature)
- **Implementation**: JWT-based tokens with Web Share API integration
- **Key Files**: T019 (API route), T014 (service), T025-T026 (components)

### Mobile Compatibility
- **QR Codes**: Medium error correction, high contrast, adequate size
- **Share Button**: Web Share API with clipboard fallback
- **Testing**: T043 covers mobile device simulation

## Validation Checklist
*GATE: Checked before task execution*

- [x] All contracts have corresponding tests (T005-T012)
- [x] All entities have service tasks (T013-T017)
- [x] All tests come before implementation (Phase 3.2 → 3.3)
- [x] Parallel tasks truly independent (different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Database migrations come first (T001-T002)
- [x] TDD approach: tests fail first, then implement to pass

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing (Critical for TDD)
- Commit after each completed task
- Focus on fixing QR generation and group deletion bugs first
- Shareable links are new feature additions
- Mobile compatibility is crucial for QR scanning