# Quickstart: Database-Backed Group Management System

**Date**: 2025-01-15
**Feature**: Database-Backed Group Management System
**Prerequisites**: Supabase database access, authenticated user session

## Quick Test Scenarios

### Scenario 1: Create and Manage Group (Admin Flow)
```bash
# Test group creation
curl -X POST http://localhost:3003/api/v1/groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <supabase_jwt>" \
  -d '{
    "name": "Development Team",
    "description": "Main development team for the project",
    "max_members": 10
  }'

# Expected: 201 Created with group object
# Verify: Check Supabase groups table for new record
```

### Scenario 2: Generate QR Invitation (Admin Flow)
```bash
# Create invitation
curl -X POST http://localhost:3003/api/v1/groups/{group_id}/invitations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_jwt>" \
  -d '{
    "expires_in_hours": 24,
    "max_uses": 5
  }'

# Expected: 201 Created with invitation code
# Verify: QR code component displays invitation
# Verify: group_invitations table has new record
```

### Scenario 3: Join Group via QR Code (Member Flow)
```bash
# Join group using invitation code
curl -X POST http://localhost:3003/api/v1/invitations/{invitation_code}/join \
  -H "Authorization: Bearer <member_jwt>"

# Expected: 200 OK with group and membership details
# Verify: group_memberships table has new record
# Verify: Groups page shows new group for member
```

### Scenario 4: Group Export Integration
```bash
# Export group time data
curl -X GET "http://localhost:3003/api/v1/export?group_id={group_id}&format=excel&start_date=2025-01-01&end_date=2025-01-31" \
  -H "Authorization: Bearer <admin_jwt>"

# Expected: Excel file with group member time entries
# Verify: Export includes all group member data
# Verify: Personal data excluded if user not in group
```

### Scenario 5: Error Handling - Duplicate Join
```bash
# Attempt to join group user is already member of
curl -X POST http://localhost:3003/api/v1/invitations/{invitation_code}/join \
  -H "Authorization: Bearer <existing_member_jwt>"

# Expected: 400 Bad Request
# Expected message: "Already a member of this group"
# Verify: FR-016 compliance
```

## Browser Testing Steps

### 1. Groups Page Functionality Test
1. Navigate to `http://localhost:3003/dashboard/groups`
2. Verify page loads without errors (fixes original issue)
3. Click "Create Group" button
4. Fill in group name and description
5. Submit form
6. Verify group appears in list immediately
7. Refresh page - verify group persists (database storage)

### 2. QR Code Integration Test
1. In groups list, click QR code icon for admin group
2. Verify QR code modal displays
3. Take screenshot of QR code
4. Open in second browser/incognito window
5. Scan QR code or manually enter invitation URL
6. Verify join flow works correctly
7. Return to original browser
8. Verify member count increased

### 3. Export Integration Test
1. Create time entries while being member of group
2. Navigate to `http://localhost:3003/dashboard/export`
3. Verify groups appear in export options (fixes missing groups issue)
4. Select specific group for export
5. Choose date range covering test time entries
6. Export as Excel
7. Verify exported file contains group member data only

### 4. Group Deletion Test
1. As group admin, navigate to groups page
2. Delete test group
3. Verify group disappears from admin view
4. In second browser (as former member), check groups page
5. Verify former member no longer sees group
6. Verify former member retains all personal time data
7. Verify admin cannot export former member data

## Database Verification Queries

### Verify Group Creation
```sql
SELECT * FROM groups
WHERE name = 'Development Team'
AND deleted_at IS NULL;
```

### Verify Membership Creation
```sql
SELECT gm.*, u.email
FROM group_memberships gm
JOIN auth.users u ON gm.user_id = u.id
WHERE gm.group_id = '{group_id}'
AND gm.deleted_at IS NULL;
```

### Verify Invitation Tracking
```sql
SELECT * FROM group_invitations
WHERE group_id = '{group_id}'
AND expires_at > now()
ORDER BY created_at DESC;
```

### Verify Time Entry Association
```sql
SELECT te.*, teg.group_id, g.name as group_name
FROM time_entries te
JOIN time_entry_groups teg ON te.id = teg.time_entry_id
JOIN groups g ON teg.group_id = g.id
WHERE te.user_id = '{user_id}';
```

## Success Criteria Checklist

- [ ] Groups page loads without errors (http://localhost:3003/dashboard/groups)
- [ ] Groups persist after browser refresh (database storage)
- [ ] Group creation works via UI form
- [ ] QR code invitation generation works
- [ ] QR code scanning joins groups correctly
- [ ] Export page shows user's groups (fixes missing groups)
- [ ] Group-filtered export includes only member data
- [ ] "Already a member" error displays correctly
- [ ] Group deletion preserves user data
- [ ] Member removal prevents admin access to former member data
- [ ] Groups with no time entries show "No data to export for this period"

## Performance Verification

### Load Time Test
```bash
# Measure groups page load time
curl -w "@curl-format.txt" -s -o /dev/null http://localhost:3003/dashboard/groups
# Target: < 2 seconds
```

### Database Query Performance
```sql
-- Verify efficient group loading query
EXPLAIN ANALYZE
SELECT g.*, gm.role, COUNT(gm2.id) as members_count
FROM groups g
JOIN group_memberships gm ON g.id = gm.group_id
LEFT JOIN group_memberships gm2 ON g.id = gm2.group_id AND gm2.deleted_at IS NULL
WHERE gm.user_id = '{user_id}'
AND gm.deleted_at IS NULL
AND g.deleted_at IS NULL
GROUP BY g.id, gm.role;
```

## Rollback Procedures

### If Groups Page Fails
1. Check Supabase connection
2. Verify table creation migration ran
3. Check RLS policies are active
4. Fallback to localStorage until fixed

### If QR Integration Breaks
1. Verify existing QRCodeInvite component unchanged
2. Check invitation API endpoints
3. Verify database invitation records
4. Restore to localStorage QR generation if needed

### If Export Integration Fails
1. Check existing export API still works
2. Verify group filtering parameter handling
3. Test export without group filtering
4. Restore original export functionality if needed

## Next Steps After Quickstart

1. Run full integration test suite
2. Performance test with larger datasets
3. Security audit of RLS policies
4. User acceptance testing with real groups
5. Production deployment preparation