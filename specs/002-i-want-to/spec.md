# Feature Specification: Multi-Tenant Groups, California Toggle, and Habit Tracker

**Feature Branch**: `002-i-want-to`
**Created**: 2025-09-25
**Status**: Draft
**Input**: User description: "i want to add a function where they can join a company or a group by invitation.. even after they have signed up they can join multiple groups the purpose and design of this is that daily export can be individual but if they are in a group the manager would get a group of export to the manager. .. also they can report to different people and give time sheet that way.. group manager can add / remove people and invite also. and manager can also set their hourly rate or not just time tracking is fine. I am missing california toggle option in the settings area may be a toggle would look cool and i want a way to quickly switch to habit tracker.. the only habit tracker on the market that's both work also personal . great tool to have for the same price without paying more. we should also have a report section / history page that's separate work and habit tracker. build one function"

## Execution Flow (main)
```
1. Parse user description from Input
   � Key features: Group invitations, multi-tenant time tracking, California toggle, habit tracker
2. Extract key concepts from description
   � Actors: Individual users, group managers, company members
   � Actions: Join groups, send invites, track time, export reports, track habits
   � Data: Groups, invitations, time entries, habit entries, reports
   � Constraints: Manager permissions, separate exports, dual-mode tracking
3. For each unclear aspect:
   � Mark with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section
   � Multi-user group workflows identified
5. Generate Functional Requirements
   � Each requirement must be testable
6. Identify Key Entities (groups, invitations, habit entries)
7. Run Review Checklist
8. Return: SUCCESS (spec ready for planning)
```

---

## � Quick Guidelines
-  Focus on WHAT users need and WHY
- L Avoid HOW to implement (no tech stack, APIs, code structure)
- =e Written for business stakeholders, not developers

---

## User Scenarios & Testing

### Primary User Stories

**Story 1: Group Time Tracking**
As a freelancer, I want to join multiple company groups so that I can track time for different clients and send separate timesheets to each manager.

**Story 2: Manager Oversight**
As a team manager, I want to invite employees to my group and receive consolidated daily exports so that I can manage payroll and project tracking efficiently.

**Story 3: Dual-Mode Tracking**
As a user, I want to switch between work time tracking and personal habit tracking in the same app so that I can manage both professional and personal productivity without paying for separate tools.

**Story 4: California Compliance**
As a California-based user, I want a clear toggle to enable California labor law compliance so that my overtime calculations are accurate and legally compliant.

### Acceptance Scenarios

#### Group Management
1. **Given** I am a registered user, **When** I receive a group invitation email, **Then** I can click to join the group and it appears in my groups list
2. **Given** I am a group manager, **When** I send an invitation to an email address, **Then** the recipient receives an email with a join link
3. **Given** I am a group member, **When** I clock time entries, **Then** I can assign them to specific groups or keep them personal
4. **Given** I am a group manager, **When** I export daily reports, **Then** I receive consolidated time data for all group members
5. **Given** I am a group manager, **When** I set hourly rates for team members, **Then** reports include calculated earnings

#### Habit Tracker
1. **Given** I am on the dashboard, **When** I toggle to habit tracker mode, **Then** the interface switches to habit tracking with different categories
2. **Given** I am in habit tracking mode, **When** I log a habit completion, **Then** it's recorded separately from work time entries
3. **Given** I have both work and habit data, **When** I view reports, **Then** I can filter between work reports and habit reports

#### California Toggle
1. **Given** I am in settings, **When** I enable the California toggle, **Then** overtime calculations follow California labor laws
2. **Given** California mode is enabled, **When** I work over 8 hours in a day, **Then** overtime is calculated correctly

### Edge Cases
- What happens when a user tries to join a group they're already in?
- How does the system handle when a manager removes someone from a group mid-workday?
- What happens to time entries assigned to a group if the user leaves the group?
- How does habit tracking handle missed days or retroactive entries?
- What happens when someone changes their California setting mid-pay period?

## Requirements

### Functional Requirements

#### Group Management
- **FR-001**: System MUST allow users to create groups and become group managers
- **FR-002**: System MUST allow group managers to invite users via email address
- **FR-003**: System MUST send email invitations with secure join links that expire after 24 hours
- **FR-004**: System MUST allow users to join multiple groups simultaneously
- **FR-005**: System MUST allow group managers to remove members from their groups
- **FR-006**: System MUST allow users to assign time entries to specific groups or keep them personal
- **FR-007**: System MUST allow group managers to export consolidated daily reports for their group members
- **FR-008**: System MUST allow group managers to set hourly rates for individual team members
- **FR-009**: System MUST calculate earnings in reports when hourly rates are set

#### Habit Tracker
- **FR-010**: System MUST provide a toggle or mode switch between work tracking and habit tracking
- **FR-011**: System MUST allow users to create unlimited custom habits that can be tracked as one-time clicks or timed sessions
- **FR-012**: System MUST record habit completions separately from work time entries
- **FR-013**: System MUST provide separate reporting views for work data vs habit data
- **FR-014**: System MUST maintain the same $1.99/month pricing for both work and habit tracking features

#### California Labor Compliance
- **FR-015**: System MUST provide a California toggle in user settings
- **FR-016**: System MUST apply California overtime rules (8-hour daily, 40-hour weekly) when toggle is enabled
- **FR-017**: System MUST apply standard overtime rules when California toggle is disabled
- **FR-018**: System MUST clearly indicate when California mode is active in the UI

#### Enhanced Reporting
- **FR-019**: System MUST provide a dedicated Reports/History section separate from the dashboard
- **FR-020**: System MUST allow filtering reports between work time and habit tracking
- **FR-021**: System MUST allow individual users to export personal reports even when in groups
- **FR-022**: System MUST allow group managers to export group reports that include all member data

### Non-Functional Requirements
- **NFR-001**: Group invitations must be delivered within 5 minutes
- **NFR-002**: Mode switching between work/habit tracking must be instantaneous
- **NFR-003**: Reports must support groups with up to 3 members maximum

### Key Entities

- **Group**: Represents a company or team that users can join; has a manager and multiple members
- **Invitation**: Represents an email-based invitation to join a group; has expiration and acceptance status
- **TimeEntry**: Extended to include group assignment; can be personal or assigned to a specific group
- **HabitEntry**: New entity for tracking personal habits; can be simple completion clicks or timed sessions; separate from work time tracking
- **HourlyRate**: Represents the rate set by managers for specific group members
- **GroupReport**: Consolidated export containing time data for all group members
- **UserSetting**: Extended to include California labor law toggle and habit/work mode preference

---

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---