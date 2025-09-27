# Quickstart: Group Management and Sharing Fixes

**Feature**: 006-group-creation-qr
**Purpose**: Validate QR code generation, group deletion, and shareable link functionality
**Prerequisites**: Running Time Tracker application with Supabase backend

## Test Environment Setup

### Required Test Data
1. **Test User (Group Manager)**:
   - Email: `manager@test.com`
   - Password: `test123!`
   - Must have at least one group created

2. **Test User (Group Member)**:
   - Email: `member@test.com`
   - Password: `test123!`
   - Should NOT be in test group initially

3. **Test Group**:
   - Name: "QR Test Group"
   - Manager: manager@test.com
   - Members: 2-3 existing members
   - Some time entries (for deletion testing)

### Environment Variables
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
```

## Quickstart Test Scenarios

### Scenario 1: QR Code Generation (Critical Fix)
**Goal**: Verify QR code generation works and produces scannable codes

**Steps**:
1. **Login as Group Manager**:
   ```bash
   # Navigate to: http://localhost:3000/login
   # Login with manager@test.com
   ```

2. **Navigate to Group Management**:
   ```bash
   # Go to: http://localhost:3000/dashboard/groups
   # Click on "QR Test Group"
   ```

3. **Generate QR Code**:
   ```bash
   # Click "Generate QR Code" button
   # Verify: QR code image appears
   # Verify: No error messages displayed
   ```

4. **Validate QR Code Data**:
   ```javascript
   // Check browser DevTools Network tab
   // POST /api/v1/groups/{id}/invitations/qr
   // Response should include:
   {
     "qr_code_data": "data:image/png;base64,iVBORw0KGgo...",
     "invitation_url": "http://localhost:3000/invite/abc123xyz789",
     "expires_at": "2025-09-27T10:30:00Z"
   }
   ```

5. **Test QR Code Scanning**:
   - Use mobile device camera app
   - Scan generated QR code
   - Should redirect to invitation URL
   - URL should load successfully

**Expected Results**:
- ✅ QR code generates without errors
- ✅ QR code is visually correct (square, black/white pattern)
- ✅ QR code scans successfully on mobile device
- ✅ Scanning leads to valid invitation URL
- ✅ Network response includes all required fields

### Scenario 2: Shareable Link Creation (New Feature)
**Goal**: Create and validate shareable invitation links

**Steps**:
1. **Generate Shareable Link**:
   ```bash
   # In same group page, click "Create Shareable Link"
   # Verify: Link URL appears in UI
   ```

2. **Validate Link Format**:
   ```javascript
   // Check API response:
   // POST /api/v1/groups/{id}/invitations/link
   {
     "shareable_url": "http://localhost:3000/invite/def456uvw012",
     "token": "eyJhbGciOiJIUzI1NiIs...",
     "expires_at": "2025-09-27T10:30:00Z"
   }
   ```

3. **Test Share Button Functionality**:
   ```bash
   # Click "Share" button next to link
   # On mobile: Should open native share dialog
   # On desktop: Should copy to clipboard
   # Verify: Success message appears
   ```

4. **Test Link Access (Unauthenticated)**:
   ```bash
   # Open incognito/private browser
   # Navigate to shareable URL
   # Should see group invitation page
   # Should show group name and join option
   ```

5. **Test Link Access (Authenticated)**:
   ```bash
   # Login as member@test.com in private browser
   # Navigate to same shareable URL
   # Should show "Join Group" button
   # Click join button
   # Should successfully join group
   ```

**Expected Results**:
- ✅ Shareable link generates successfully
- ✅ Share button works on both mobile and desktop
- ✅ Unauthenticated users can view invitation details
- ✅ Authenticated users can join group via link
- ✅ JWT token is valid and secure

### Scenario 3: Group Deletion (Critical Fix)
**Goal**: Verify group deletion works with proper data preservation

**Steps**:
1. **Access Deletion Preview**:
   ```bash
   # In group settings, click "Delete Group"
   # Should show deletion impact preview
   # Verify: Shows member count, time entries, warnings
   ```

2. **Validate Deletion Preview API**:
   ```javascript
   // GET /api/v1/groups/{id}/deletion-preview
   {
     "can_delete": true,
     "impact_summary": {
       "members_affected": 3,
       "time_entries_preserved": 25,
       "pending_invitations": 1
     },
     "warnings": [...]
   }
   ```

3. **Attempt Deletion (Without Confirmation)**:
   ```bash
   # Try to delete without checking confirmation
   # Should show error: "confirm_deletion must be true"
   ```

4. **Complete Group Deletion**:
   ```bash
   # Check confirmation checkbox
   # Click "Delete Group" button
   # Verify: Success message appears
   # Verify: Redirected to groups list
   # Verify: Group no longer appears in list
   ```

5. **Validate Data Preservation**:
   ```sql
   -- Check database directly
   SELECT * FROM groups WHERE id = 'test-group-id';
   -- Should have deleted_at timestamp

   SELECT COUNT(*) FROM time_entries WHERE group_id = 'test-group-id';
   -- Should still have all time entries

   SELECT * FROM group_memberships WHERE group_id = 'test-group-id';
   -- Should be deactivated (is_active = false)
   ```

6. **Test Access to Deleted Group**:
   ```bash
   # Try to access deleted group URL directly
   # Should show 404 or "Group not found" message
   ```

**Expected Results**:
- ✅ Deletion preview shows accurate impact
- ✅ Confirmation required for deletion
- ✅ Group successfully soft-deleted
- ✅ Time entries preserved in database
- ✅ Memberships deactivated properly
- ✅ Deleted group not accessible

### Scenario 4: Mobile Compatibility Testing
**Goal**: Ensure all features work on mobile devices

**Steps**:
1. **Mobile QR Code Generation**:
   ```bash
   # Use mobile browser (Chrome/Safari)
   # Generate QR code on mobile
   # Verify: QR code displays correctly
   # Verify: QR code is high enough resolution
   ```

2. **Mobile Share Functionality**:
   ```bash
   # Create shareable link on mobile
   # Tap "Share" button
   # Verify: Native share dialog opens
   # Test sharing to WhatsApp, Messages, Email
   ```

3. **Cross-Device QR Scanning**:
   ```bash
   # Generate QR on desktop
   # Scan with different mobile device
   # Verify: URL opens correctly
   # Verify: Invitation page is mobile-responsive
   ```

**Expected Results**:
- ✅ QR codes generate properly on mobile
- ✅ Native share dialog works on mobile
- ✅ Cross-device QR scanning works
- ✅ All pages are mobile-responsive

## Performance Validation

### Response Time Requirements
- QR code generation: < 500ms
- Shareable link creation: < 200ms
- Group deletion: < 1000ms
- Link access: < 300ms

### Load Testing (Optional)
```bash
# Test multiple QR generations
for i in {1..10}; do
  curl -X POST localhost:3000/api/v1/groups/{id}/invitations/qr \
    -H "Authorization: Bearer $TOKEN" \
    -w "%{time_total}\n"
done
```

## Troubleshooting Guide

### QR Code Not Generating
1. Check browser console for JavaScript errors
2. Verify QRCode library is installed: `npm list qrcode`
3. Check API endpoint logs for errors
4. Verify user has manager permissions

### Share Button Not Working
1. Test Web Share API support: `navigator.share !== undefined`
2. Fallback to clipboard should work on all browsers
3. Check for HTTPS requirement on Web Share API

### Group Deletion Failing
1. Check for active time tracking sessions
2. Verify user is group manager
3. Check database constraints and foreign keys
4. Verify soft delete logic in queries

### Mobile Scanning Issues
1. Ensure adequate lighting for camera
2. Check QR code size and contrast
3. Test with different QR reader apps
4. Verify error correction level is 'M'

## Success Criteria Checklist

- [ ] QR codes generate without errors
- [ ] QR codes scan successfully on mobile devices
- [ ] Shareable links create and work properly
- [ ] Share button functions on desktop and mobile
- [ ] Group deletion works with confirmation
- [ ] Time entries preserved after group deletion
- [ ] All features work on mobile browsers
- [ ] Performance requirements met
- [ ] Error handling works correctly
- [ ] Security validation passes

## API Testing Commands

### Generate QR Code
```bash
curl -X POST http://localhost:3000/api/v1/groups/{GROUP_ID}/invitations/qr \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"expires_in_hours": 24}'
```

### Create Shareable Link
```bash
curl -X POST http://localhost:3000/api/v1/groups/{GROUP_ID}/invitations/link \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"expires_in_hours": 24}'
```

### Preview Group Deletion
```bash
curl -X GET http://localhost:3000/api/v1/groups/{GROUP_ID}/deletion-preview \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### Delete Group
```bash
curl -X DELETE http://localhost:3000/api/v1/groups/{GROUP_ID} \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"confirm_deletion": true, "notify_members": true}'
```

---
*Complete this quickstart to validate all Group Management and Sharing fixes are working correctly*