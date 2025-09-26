# Implementation Plan: Multi-Tenant Groups, California Toggle, and Habit Tracker

**Branch**: `002-i-want-to` | **Date**: 2025-09-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-i-want-to/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → Loaded: Multi-tenant groups, California toggle, habit tracker
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detected: Web application (frontend + backend API)
   → Structure Decision: Option 2 (Next.js with API routes)
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → Constitution is template placeholder - proceeding with standard web dev practices
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md
7. Re-evaluate Constitution Check section
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 8. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Primary requirement: Extend existing time tracker with multi-tenant group functionality (3 member max), California labor law toggle, and integrated habit tracker. Features include email-based group invitations, manager controls, dual-mode tracking (work/habits), and enhanced reporting with both individual and group exports.

## Technical Context
**Language/Version**: TypeScript/Node.js (Latest LTS), React 18+
**Primary Dependencies**: Next.js 14+, Supabase (auth/database), Stripe API, Tailwind CSS, Nodemailer/SendGrid
**Storage**: PostgreSQL via Supabase (existing), new tables for groups, invitations, habit entries
**Testing**: Jest, React Testing Library, Playwright for E2E
**Target Platform**: Web application (responsive), deployment via Vercel/Netlify
**Project Type**: Web application (frontend + backend API routes)
**Performance Goals**: <2s initial load, <500ms navigation, real-time updates, <5min email delivery
**Constraints**: Mobile-responsive, GDPR compliant, max 3 members per group, 24hr invitation expiry
**Scale/Scope**: Existing users + group functionality, habit tracking integration, enhanced reporting

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: PASS - No specific constitution defined. Using standard web development best practices:
- Test-driven development approach
- Clean separation of concerns (UI, API, data)
- Secure authentication and payment handling
- Responsive, accessible design
- Data privacy compliance

## Project Structure

### Documentation (this feature)
```
specs/002-i-want-to/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 2: Web application (Next.js)
src/
├── app/
│   ├── api/v1/
│   │   ├── groups/
│   │   ├── invitations/
│   │   ├── habits/
│   │   └── reports/
│   ├── dashboard/
│   │   ├── groups/
│   │   ├── habits/
│   │   └── reports/
│   └── components/
│       ├── groups/
│       ├── habits/
│       └── reports/
├── services/
├── types/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

database/
├── migrations/
└── tables/
    ├── groups.sql
    ├── group_memberships.sql
    ├── invitations.sql
    ├── habit_entries.sql
    └── hourly_rates.sql
```

**Structure Decision**: Option 2 - Web application with Next.js API routes, extending existing structure

## Phase 0: Outline & Research

1. **Extract unknowns from Technical Context** above:
   - Email service integration for group invitations
   - Group permission model and security
   - Habit tracking data structure and UI patterns
   - California labor law calculation updates
   - Multi-tenant data isolation

2. **Generate and dispatch research agents**:
   ```
   Task: "Research email invitation patterns for multi-tenant SaaS apps"
   Task: "Find best practices for group-based permission systems in Next.js/Supabase"
   Task: "Research habit tracking UI/UX patterns for web applications"
   Task: "Find California overtime calculation requirements and edge cases"
   Task: "Research multi-tenant data models with PostgreSQL RLS"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with technology decisions documented

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Group, Invitation, HabitEntry, HourlyRate, GroupReport entities
   - Relationships and validation rules
   - State transitions for invitations and group membership

2. **Generate API contracts** from functional requirements:
   - Group CRUD operations
   - Invitation send/accept/decline endpoints
   - Habit tracking CRUD operations
   - Enhanced reporting with filtering
   - Output OpenAPI schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - Test files for each new API endpoint
   - Assert request/response schemas
   - Tests must fail initially

4. **Extract test scenarios** from user stories:
   - Group invitation flow integration test
   - Multi-mode tracking integration test
   - California overtime calculation test
   - Group reporting integration test

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/powershell/update-agent-context.ps1 -AgentType claude`
   - Add group management, habit tracking, enhanced reporting context
   - Preserve existing manual additions
   - Keep under 150 lines

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, CLAUDE.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Extend existing database schema with new tables
- Create new API endpoints for groups, invitations, habits
- Update existing time entry model to support group assignment
- Add California toggle to settings with updated overtime logic
- Build new UI components for group management and habit tracking
- Create enhanced reporting section with filtering
- Implement email notification system for invitations

**Specific Task Categories**:
1. **Database Extensions** - New tables, updated RLS policies, migrations
2. **Group Management** - Create, invite, manage, remove functionality
3. **Habit Tracking** - Dual-mode UI, separate data model, reporting
4. **Enhanced Settings** - California toggle, mode preferences
5. **Reporting System** - Separate work/habit views, group exports
6. **Email Integration** - Invitation sending, templates, tracking
7. **Testing** - Contract tests, integration tests, E2E scenarios

**Ordering Strategy**:
- Database schema first (foundation)
- API endpoints with contract tests
- Core services and business logic
- UI components and pages
- Integration features (email, reporting)
- End-to-end testing and validation

**Estimated Output**: 35-40 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following constitutional principles)
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*No constitutional violations identified - proceeding with standard approach*

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none required)

**Artifacts Generated**:
- [x] research.md - Technology decisions and integration patterns
- [x] data-model.md - Extended database schema with new entities
- [x] contracts/api-spec.yaml - OpenAPI specification for new endpoints
- [x] quickstart.md - End-to-end validation scenarios
- [x] CLAUDE.md - Updated agent context with new features

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*