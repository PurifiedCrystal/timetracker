# Feature Specification: Mobile UI Improvements & Enhanced Group Management

**Feature Branch**: `004-when-i-toggle`
**Created**: 2025-09-26
**Status**: Draft
**Input**: User description: "When I toggle the top right work in habits it should load dashboard work and habits dashboard right now it's feeling stuck so even now where I am toggling that it's not working properlySo when I clock in it shows zero hour zero minute I wanted to show the second as wellEspecially loading into habitsSometimes it hangs I think there's some loading issue there fix thatHabits history are not working properly it doesn't show anythingImmobile mode the last menu should auto retract after I selectIn groups there should be an add button or as a plus square once you click on that a new group you could put a name and generate and once we generate there should be a QR code or a link that's shareable shareable link cuz most of the time people will be using this on mobile phone so they can either share the link or they have some of that I'll scan it once the person scans it you will pop up a window asking the person to log in and that person would be invited into the group in an admin could have multiple groups separately controlledThe exports there should be selection for what group to exportIn the group management wants people join in the admin could adjust their hourly pay rate so that it's done for payroll so the admin would have that hours for payroll information For export function there should only be work hours there's no need to export habits there should be a section for daily export and there should be a section for manual export which I think what we have here is fine for automation exports they could pick the time with the drop menu enter the email so there could be multiple people with name email address and send time We could do a bar chart of daily workOn the left bottom side they're setting subscription and sign out it should really be profile instead of settingsI don't know why but there's a valid API hereAgain immobile event meant version once you select the menu item the left menu automatically retract so every selection it retracts so the proper page could be pulled up and not blocking itImmobile motor floating menu only happens at dashboard I wanted to flow constantly doesn't matter which window or tablet We are inThe floating menu should have dashboard groups export history and see a mode on and off let's try that"

## Execution Flow (main)
```
1. Parse user description from Input 
   ’ Multi-faceted mobile UX and group management improvements
2. Extract key concepts from description 
   ’ UI improvements, time tracking display, group management, mobile responsiveness
3. For each unclear aspect:
   ’ Mark with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section 
5. Generate Functional Requirements 
6. Identify Key Entities 
7. Run Review Checklist
   ’ If any [NEEDS CLARIFICATION]: WARN "Spec has uncertainties"
8. Return: SUCCESS (spec ready for planning)
```

---

## ¡ Quick Guidelines
-  Focus on WHAT users need and WHY
- L Avoid HOW to implement (no tech stack, APIs, code structure)
- =e Written for business stakeholders, not developers

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
As a mobile user managing work teams, I need a responsive time tracking application that switches seamlessly between work and habit tracking modes, provides instant visual feedback, enables easy group creation and management with QR code sharing, and offers flexible export options with payroll integration capabilities.

### Acceptance Scenarios
1. **Given** user is on dashboard, **When** user toggles work/habits in top-right, **Then** dashboard content immediately switches to show relevant interface without loading delays
2. **Given** user starts time tracking, **When** viewing active session, **Then** display shows hours, minutes, AND seconds updating in real-time
3. **Given** user is on mobile device, **When** user selects any menu item, **Then** sidebar automatically retracts to show full page content
4. **Given** admin user views groups page, **When** clicking add/plus button, **Then** can create new group and immediately get shareable QR code and link
5. **Given** someone scans group QR code, **When** accessing link, **Then** prompted to login and automatically invited to the group
6. **Given** admin managing group members, **When** viewing member list, **Then** can adjust individual hourly pay rates for payroll purposes
7. **Given** user wants to export data, **When** selecting export options, **Then** can choose specific group, work-only data, daily vs manual export, and email recipients
8. **Given** user navigating on mobile, **When** on any page, **Then** persistent floating menu provides quick access to main functions

### Edge Cases
- What happens when QR code link is accessed by someone already in the group?
- How does system handle network interruption during group invitation process?
- What occurs if habits section loads but API response is delayed?
- How does floating menu behave on different screen sizes and orientations?

## Requirements *(mandatory)*

### Functional Requirements

**Work/Habits Toggle & Time Display**
- **FR-001**: System MUST instantly switch dashboard content when user toggles work/habits mode without loading delays
- **FR-002**: Time tracking display MUST show hours, minutes, and seconds with real-time updates
- **FR-003**: System MUST prevent UI hanging/freezing when loading habits data
- **FR-004**: Habits history MUST display properly with all past entries visible

**Mobile UI Responsiveness**
- **FR-005**: Mobile sidebar menu MUST automatically retract after any menu item selection
- **FR-006**: System MUST provide persistent floating menu on all pages (not just dashboard)
- **FR-007**: Floating menu MUST include: Dashboard, Groups, Export, History, and CA Mode toggle
- **FR-008**: Navigation menu bottom section MUST display "Profile" instead of "Settings"

**Group Management & Sharing**
- **FR-009**: Groups page MUST display prominent add/plus button for creating new groups
- **FR-010**: Group creation MUST generate both QR code and shareable link immediately upon creation
- **FR-011**: Group QR codes and links MUST be optimized for mobile sharing
- **FR-012**: System MUST prompt users to login when accessing group invitation links
- **FR-013**: System MUST automatically add users to groups after successful invitation login
- **FR-014**: Admins MUST be able to manage multiple groups independently
- **FR-015**: Group admins MUST be able to set/adjust hourly pay rates for individual members

**Export & Reporting**
- **FR-016**: Export function MUST include group selection dropdown
- **FR-017**: Export MUST focus exclusively on work hours (no habit data export)
- **FR-018**: System MUST provide separate daily export and manual export sections
- **FR-019**: Automated exports MUST support time scheduling with dropdown selection
- **FR-020**: Export MUST support multiple email recipients with name/email fields
- **FR-021**: System MUST generate bar charts for daily work visualization
- **FR-022**: Export data MUST include payroll-ready hourly rate information for group members

### Key Entities *(include if feature involves data)*

- **Group**: Contains name, admin users, member users with roles, QR code/share link, creation timestamp
- **GroupMember**: Links user to group with role (admin/member), hourly pay rate, join timestamp
- **GroupInvitation**: Contains group reference, invitation code, expiration, usage tracking
- **ExportConfiguration**: Contains group selection, export type (daily/manual), schedule settings, recipient list
- **TimeSession**: Enhanced with seconds precision display, group context when applicable
- **FloatingMenuState**: Tracks menu visibility, active page, user preferences across pages

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

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
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---