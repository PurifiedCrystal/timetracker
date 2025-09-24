# Quickstart: Time Tracking Application

This guide validates that all core functionality works correctly through end-to-end scenarios.

## Prerequisites

- Node.js 18+ installed
- Supabase account and project set up
- Stripe account with test keys
- Environment variables configured

## Setup

1. **Clone and Install**
   ```bash
   git clone <repository>
   cd timetracker
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your keys:
   # NEXT_PUBLIC_SUPABASE_URL=
   # NEXT_PUBLIC_SUPABASE_ANON_KEY=
   # SUPABASE_SERVICE_ROLE_KEY=
   # NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
   # STRIPE_SECRET_KEY=
   # STRIPE_WEBHOOK_SECRET=
   ```

3. **Database Setup**
   ```bash
   npm run db:setup
   # This should create all tables and RLS policies
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   # Application should be available at http://localhost:3000
   ```

## Core User Journey Validation

### Test Scenario 1: New User Signup and Subscription

**Objective**: Validate complete user onboarding flow

1. **Visit Landing Page**
   - Navigate to `http://localhost:3000`
   - Verify landing page loads with signup CTA
   - Check mobile responsiveness

2. **User Registration**
   ```bash
   # Test data
   Email: test@example.com
   Password: TestPass123!
   ```
   - Click "Get Started" or "Sign Up"
   - Fill registration form
   - Verify email verification flow
   - Check user is redirected to subscription page

3. **Subscription Creation**
   - Verify Stripe Checkout loads correctly
   - Use test card: 4242424242424242
   - Complete subscription for $1.99/month
   - Verify redirect to dashboard
   - Check subscription status in database

4. **Profile Setup**
   - Navigate to settings/profile
   - Set location to "CA" (California)
   - Set timezone to "America/Los_Angeles"
   - Save changes and verify persistence

**Expected Results**:
- User account created in auth.users
- User profile created in user_profiles table
- Active subscription in subscriptions table
- User can access time tracking interface

### Test Scenario 2: Time Tracking Core Flow

**Objective**: Validate basic clock in/out functionality

1. **Clock In**
   ```bash
   # Dashboard should show "Clock In" button
   ```
   - Click "Clock In" button
   - Verify time entry created with current timestamp
   - Check UI shows "Clocked In" status
   - Verify timer starts counting

2. **Active Session Validation**
   - Refresh browser page
   - Verify session persists
   - Check "Clock Out" button is visible
   - Validate only one active session per user

3. **Clock Out**
   ```bash
   # Wait at least 1 minute for visible duration
   ```
   - Click "Clock Out" button
   - Verify duration calculated correctly
   - Check time entry updated with clock_out time
   - Verify "Clock In" button reappears

4. **Session History**
   - Navigate to time entries/history page
   - Verify completed session appears in list
   - Check duration display is accurate
   - Test date filtering functionality

**Expected Results**:
- Time entry correctly created and updated
- Duration calculations accurate
- UI state properly managed
- History displays correctly

### Test Scenario 3: California Labor Rules

**Objective**: Validate location-specific compliance features

1. **Setup Long Work Day**
   ```bash
   # This test requires specific time manipulation or mock data
   ```
   - Create time entry with 9 hours duration
   - Verify overtime calculation (1 hour overtime)
   - Check labor rule application in database

2. **Meal Period Tracking**
   - Create 6-hour work session without breaks
   - Verify meal period reminder/warning
   - Test break time logging functionality

3. **Weekly Overtime**
   - Create multiple entries totaling 45 hours in week
   - Verify weekly overtime calculation (5 hours)
   - Check both daily and weekly rules applied

**Expected Results**:
- Overtime properly calculated for CA users
- Meal period violations detected
- Labor rule applications logged

### Test Scenario 4: Export Functionality

**Objective**: Validate data export in multiple formats

1. **Manual Export**
   - Navigate to exports page
   - Select date range (last 7 days)
   - Generate CSV export
   - Verify file downloads correctly
   - Check data accuracy in exported file

2. **PDF Export**
   - Generate PDF export for same period
   - Verify professional formatting
   - Check all time entries included
   - Validate totals and calculations

3. **Excel Export**
   - Generate XLSX export
   - Verify file opens in spreadsheet software
   - Check data structure and formulas

4. **Automated Export Setup**
   - Create daily export configuration
   - Set schedule time and recipients
   - Verify configuration saved
   - Test email delivery (may require manual trigger)

**Expected Results**:
- All export formats generate correctly
- Data accuracy maintained across formats
- Automated exports can be configured
- Email delivery works

### Test Scenario 5: Subscription Management

**Objective**: Validate payment and subscription flows

1. **Customer Portal**
   - Access subscription settings
   - Click "Manage Subscription"
   - Verify Stripe Customer Portal loads
   - Test invoice download

2. **Subscription Status**
   - Check subscription details displayed correctly
   - Verify billing cycle dates
   - Test status updates via webhook

3. **Access Control**
   - Test subscription expiration flow (use Stripe test mode)
   - Verify access restrictions for expired users
   - Check reactivation flow

**Expected Results**:
- Subscription management works correctly
- Access control enforced properly
- Webhooks update subscription status

## Performance Validation

### Load Time Tests

1. **Landing Page**
   ```bash
   # Use browser dev tools or lighthouse
   ```
   - First Contentful Paint < 2s
   - Largest Contentful Paint < 2.5s
   - Cumulative Layout Shift < 0.1

2. **Dashboard**
   - Initial load < 1s for authenticated users
   - Time entry creation < 500ms
   - History page load < 1s

3. **Export Generation**
   - CSV export < 5s for 1000 entries
   - PDF export < 10s for 1000 entries
   - Large exports queue properly

### Database Performance

```sql
-- Verify indexes are working
EXPLAIN ANALYZE SELECT * FROM time_entries WHERE user_id = '...' AND DATE(clock_in) = '2025-09-24';

-- Check active session lookup
EXPLAIN ANALYZE SELECT * FROM time_entries WHERE user_id = '...' AND clock_out IS NULL;
```

## Security Validation

### Authentication Tests

1. **Protected Routes**
   - Try accessing `/dashboard` without auth
   - Verify redirect to login
   - Test token expiration handling

2. **Row Level Security**
   ```sql
   -- Test RLS policies
   SELECT * FROM time_entries; -- Should only return current user's data
   ```

3. **API Security**
   - Test API endpoints without bearer token
   - Verify 401 responses
   - Test rate limiting (if implemented)

### Data Privacy

1. **User Isolation**
   - Create second test user
   - Verify users can't access each other's data
   - Test concurrent sessions

2. **Export Security**
   - Verify export files are user-specific
   - Check temporary file cleanup
   - Test download URL expiration

## Troubleshooting

### Common Issues

1. **Database Connection**
   ```bash
   # Check Supabase connection
   npm run db:check
   ```

2. **Stripe Webhooks**
   ```bash
   # Use Stripe CLI for local testing
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. **Environment Variables**
   ```bash
   # Verify all required vars are set
   npm run check:env
   ```

### Debug Commands

```bash
# Check database schema
npm run db:schema

# Validate API contracts
npm run api:validate

# Run all tests
npm run test

# Check application health
npm run health:check
```

## Success Criteria

- [ ] All user scenarios complete without errors
- [ ] Performance metrics meet targets
- [ ] Security tests pass
- [ ] Export functionality works in all formats
- [ ] California labor rules calculate correctly
- [ ] Stripe integration handles payments properly
- [ ] Database queries perform efficiently
- [ ] UI is responsive on mobile devices

## Post-Validation Steps

After successful validation:

1. **Deploy to Staging**
   ```bash
   npm run deploy:staging
   ```

2. **Run Full Test Suite**
   ```bash
   npm run test:e2e:staging
   ```

3. **Monitor Performance**
   - Set up application monitoring
   - Configure error tracking
   - Enable performance monitoring

_Quickstart guide completed: 2025-09-24_