# Test Users for TimeTracker Application

## 🔑 Available Supabase Users

The following users are already created in the Supabase database and can be used for testing:

### Existing Users:
1. **demo@timetracker.com**
   - Created: 2025-09-24
   - Status: Active
   - Purpose: Demo/testing account

2. **user.test@gmail.com**
   - Created: 2025-09-24
   - Status: Active
   - Purpose: Test account

3. **sunhowie@gmail.com**
   - Created: 2025-09-25
   - Status: Active
   - Purpose: User account

## 🚫 User Creation Issue

**Problem:** New user creation is currently blocked by database RLS (Row Level Security) policies.
**Error:** "Database error saving new user"
**Status:** This appears to be a production database with strict security policies.

## 🧪 Testing Solutions

### Option 1: Use Existing Users
Login with the existing accounts above. Contact the database administrator for passwords or reset them through Supabase Auth.

### Option 2: Mock Authentication (Development)
For development testing, the application is already configured with mock authentication:

```typescript
// Mock user used throughout the app
const mockUser = {
  id: 'c8a6da09-4108-4808-bea6-1a10d8b4c430',
  email: 'demo@timetracker.com',
  user_metadata: { full_name: 'Demo User' }
};
```

### Option 3: Contact Administrator
Request the database administrator to:
1. Temporarily disable RLS policies for user creation
2. Create the test users manually
3. Provide test account credentials

## 🔧 Mock Groups Available

The following test groups are available for QR code testing:
- **test-group-1**: "Test Group 1" (Admin role)
- **test-group-2**: "Test Group 2" (Admin role)

## 🎯 QR Code Testing

✅ **QR Code Generation Working:**
- Groups API: `http://localhost:3002/api/v1/groups`
- QR Generation: `http://localhost:3002/api/v1/groups/{id}/invitations/qr`
- Frontend: `http://localhost:3002/dashboard/groups`

## 📝 Requested User Creation

**Originally Requested:** 10 users (user1-user10) with pattern:
- Email: user1@timetracker.com through user10@timetracker.com
- Password: user1123 through user10123
- Names: "Test User 1" through "Test User 10"

**Status:** ❌ Blocked by database policies

## 🛠️ Development Recommendations

1. **For QR Code Testing:** Use existing mock groups (test-group-1, test-group-2)
2. **For User Testing:** Use existing accounts or mock authentication
3. **For Production:** Contact database administrator to resolve RLS policies
4. **For Development:** Consider using local Supabase instance with relaxed policies

## 🔍 Next Steps

To resolve the user creation issue:
1. Check Supabase dashboard for RLS policy configurations
2. Review auth.users table policies
3. Ensure proper service role permissions
4. Consider using Supabase CLI with admin privileges