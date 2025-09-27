# Quickstart Guide: Enhanced Group Management, Export System, and History Improvements

**Feature**: `005-qr-code-and` | **Date**: 2025-09-26

## Overview

This quickstart guide provides step-by-step validation scenarios for testing the enhanced group management, export automation, and history visualization features. All scenarios should pass once implementation is complete.

## Prerequisites

- Time tracking application running locally
- Test database with sample data
- At least 2 test user accounts (one group manager, one regular member)
- Sample time entries spanning multiple weeks/months
- Email service configured for export delivery testing

## Test Scenarios

### Scenario 1: QR Code Generation and Group Joining

**Objective**: Verify QR code generation works without "group not found" errors

**Steps**:
1. **Setup**:
   - Login as group manager
   - Navigate to Groups page (`/dashboard/groups`)
   - Select an existing group

2. **Generate QR Code**:
   - Click "Generate QR Invite" button
   - Verify QR code displays without errors
   - Copy the invitation URL from QR code

3. **Test Invitation**:
   - Open invitation URL in new browser/incognito
   - Login as different user (or create new account)
   - Verify invitation shows correct group details
   - Click "Join Group"
   - Verify successful join message

4. **Validation**:
   - Return to group manager account
   - Refresh Groups page
   - Verify new member appears in member list
   - Verify member count incremented

**Expected Results**:
- ✅ QR code generates without "group not found" error
- ✅ Invitation URL works correctly
- ✅ New members can join successfully
- ✅ Group member list updates automatically

### Scenario 2: Member Management Operations

**Objective**: Test add, update, and remove member functionality

**Steps**:
1. **Add Member Manually**:
   - Navigate to Groups page as manager
   - Click on a group to view details
   - Click "Add Member" button
   - Enter email of existing user
   - Select "Member" role
   - Set hourly rate: $25.00
   - Click "Add Member"

2. **Update Member**:
   - Find the newly added member in list
   - Click "Edit" button next to member
   - Change role to "Manager"
   - Update hourly rate to $30.00
   - Add note: "Promoted to team lead"
   - Save changes

3. **Remove Member**:
   - Click "Remove" button next to a different member
   - Confirm removal in dialog
   - Verify member disappears from list

4. **Validation**:
   - Verify member role changes are reflected
   - Verify hourly rate updates are saved
   - Verify removed members no longer appear
   - Check audit trail for member changes

**Expected Results**:
- ✅ Manual member addition works correctly
- ✅ Member role and rate updates save properly
- ✅ Member removal functions without errors
- ✅ Permission changes take effect immediately

### Scenario 3: Group Deletion

**Objective**: Verify group deletion handles cleanup properly

**Steps**:
1. **Create Test Group**:
   - Create new group "Test Deletion Group"
   - Add 2-3 test members
   - Create 1 export schedule for the group

2. **Attempt Deletion with Active Content**:
   - Navigate to group settings
   - Click "Delete Group"
   - Verify warning about active schedules/members
   - Cancel deletion

3. **Clean and Delete**:
   - Remove all export schedules
   - Remove all members except manager
   - Attempt deletion again
   - Confirm deletion in dialog

4. **Validation**:
   - Verify group no longer appears in groups list
   - Verify related data cleaned up properly
   - Check that former members lost access

**Expected Results**:
- ✅ Groups with active content show appropriate warnings
- ✅ Group deletion removes all related data
- ✅ Former members lose access immediately
- ✅ Database constraints prevent orphaned data

### Scenario 4: Enhanced Export System

**Objective**: Test streamlined export interface and new options

**Steps**:
1. **Access Export Page**:
   - Navigate to `/dashboard/export`
   - Verify no habit tracking options appear
   - Verify work time focus is clear

2. **Test Group Selection**:
   - Verify dropdown shows all user's groups
   - Select different groups
   - Verify data preview updates per group

3. **Test Date Ranges**:
   - Test each predefined range: Today, This Week, This Month, This Quarter, This Year, All Time
   - Verify date ranges calculate correctly
   - Verify data preview shows expected entries

4. **Test Export Formats**:
   - Export as CSV - verify file downloads
   - Export as PDF - verify formatting is clean
   - Export as Excel - verify spreadsheet structure
   - Verify no JSON option appears

5. **Test Email Delivery**:
   - Select "Email" delivery method
   - Enter recipient email
   - Export as PDF
   - Verify email is sent and received

**Expected Results**:
- ✅ Export interface shows only work time data
- ✅ Group selection dropdown works correctly
- ✅ All date ranges calculate accurately
- ✅ CSV, PDF, Excel formats generate successfully
- ✅ Email delivery functions properly

### Scenario 5: Automated Export Scheduling

**Objective**: Test daily export automation for group managers

**Steps**:
1. **Create Export Schedule** (as Group Manager):
   - Navigate to Export page
   - Scroll to "Daily Export Automation" section
   - Click "Add New Schedule"
   - Fill form:
     - Recipient Name: "Daily Reports Team"
     - Email: test-reports@example.com
     - Export Time: 09:00
     - Hourly Basis: Yes
     - Target: Group
     - Group: Select test group
   - Save schedule

2. **View Schedule Table**:
   - Verify schedule appears in table
   - Verify all details are correct
   - Verify "Active" status shows

3. **Edit Schedule**:
   - Click "Edit" on created schedule
   - Change export time to 10:00
   - Change target to "Self"
   - Save changes
   - Verify table updates

4. **Delete Schedule**:
   - Click "Delete" on a test schedule
   - Confirm deletion
   - Verify schedule removed from table

5. **Test as Regular User**:
   - Login as regular team member
   - Navigate to Export page
   - Verify Daily Export Automation section is hidden
   - Verify only personal export options visible

**Expected Results**:
- ✅ Group managers can create/edit/delete schedules
- ✅ Schedule table displays correctly with all details
- ✅ Schedule modifications save and update immediately
- ✅ Regular users cannot access automation features
- ✅ Permission boundaries are enforced

### Scenario 6: History Page with Visualization

**Objective**: Verify time records display in tables and charts

**Steps**:
1. **Access History Page**:
   - Navigate to `/dashboard/history`
   - Verify page loads without "no records" message
   - Verify time entries appear in table format

2. **Verify Table Display**:
   - Check table shows: Date, Clock In, Clock Out, Duration
   - Verify pagination works for large datasets
   - Verify data sorting functions correctly
   - Test date range filtering

3. **Verify Line Charts**:
   - Confirm line chart displays below table
   - Verify chart shows daily time patterns
   - Test different date range selections
   - Verify chart updates with date changes

4. **Test Weekly Summary**:
   - Verify weekly summary section appears
   - Check weekly totals are accurate
   - Verify visual representation (bar chart/graph)
   - Test week navigation controls

5. **Test Monthly Summary**:
   - Verify monthly summary section appears
   - Check monthly totals are accurate
   - Verify monthly average calculations
   - Test month navigation controls

6. **Test as Group Manager**:
   - Login as group manager
   - Access History page
   - Verify can view group member data
   - Test filtering by group member

**Expected Results**:
- ✅ History page shows actual time records
- ✅ Table format is clean and readable
- ✅ Line charts render correctly with real data
- ✅ Weekly summaries calculate accurately
- ✅ Monthly summaries display properly
- ✅ Group managers can view team data

### Scenario 7: Role-Based Access Control

**Objective**: Verify permission boundaries are enforced

**Steps**:
1. **Test Regular User Limitations**:
   - Login as regular team member
   - Navigate to Groups page
   - Verify cannot generate QR codes
   - Verify cannot add/remove members
   - Verify cannot delete groups
   - Verify cannot create export schedules

2. **Test Group Manager Permissions**:
   - Login as group manager
   - Verify can access all group management features
   - Verify can manage only own groups
   - Verify cannot access other managers' groups

3. **Test Cross-Group Access**:
   - Create user in multiple groups
   - Verify can only manage groups where user is manager
   - Verify can export data from all groups where user is member

4. **Test Data Isolation**:
   - Verify users only see own time records
   - Verify group managers see team data for managed groups only
   - Verify export permissions respect group boundaries

**Expected Results**:
- ✅ Regular users have appropriate limitations
- ✅ Group managers have elevated permissions
- ✅ Cross-group access controls work correctly
- ✅ Data isolation is maintained

## Performance Validation

### Chart Rendering Performance
- Test with 1000+ time entries
- Verify charts render within 2 seconds
- Verify smooth scrolling and interaction

### Export Generation Performance
- Test large dataset exports (6+ months of data)
- Verify exports complete within 30 seconds
- Verify memory usage remains reasonable

### QR Code Generation Performance
- Test multiple simultaneous QR generations
- Verify response times under 1 second
- Verify server handles concurrent requests

## Acceptance Criteria Verification

### QR Code Fixes ✅
- [ ] QR codes generate without "group not found" errors
- [ ] Invitation URLs work reliably
- [ ] Group permissions validated before QR generation

### Member Management ✅
- [ ] Add members manually with role assignment
- [ ] Remove members with proper cleanup
- [ ] Update member roles and hourly rates
- [ ] Delete groups with cascade handling

### Export System ✅
- [ ] Remove habit tracking options
- [ ] Group selection dropdown functional
- [ ] Predefined date ranges work correctly
- [ ] CSV, PDF, Excel formats generate properly
- [ ] Email delivery functions reliably

### Daily Export Automation ✅
- [ ] Group managers can create schedules
- [ ] Schedule table displays correctly
- [ ] Edit/delete functionality works
- [ ] Regular users cannot access automation
- [ ] Email delivery executes on schedule

### History Visualization ✅
- [ ] Time records display in table format
- [ ] Line charts show time patterns
- [ ] Weekly summaries calculate correctly
- [ ] Monthly summaries display properly
- [ ] Role-based data access enforced

---

**Quickstart Complete**: All scenarios defined for comprehensive feature validation.