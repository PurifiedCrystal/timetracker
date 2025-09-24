# Time Tracker Setup Information

## Supabase Setup Requirements

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Create a new project
3. Wait for the database to be initialized

### 2. Get Project Credentials
From your Supabase dashboard, go to Settings > API:

- **Project URL**: `https://[your-project-ref].supabase.co`
- **Anon Public Key**: `eyJ...` (anon/public key)
- **Service Role Key**: `eyJ...` (service_role key) - Keep this secret!

### 3. Environment Variables
Create `.env.local` file in the project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Stripe Configuration (for subscription billing)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# App Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_string

# Optional
NODE_ENV=development
```

### 4. Database Setup
After setting up environment variables:

```bash
# Install dependencies
npm install

# Setup database schema
npm run db:setup
```

### 5. Stripe Setup (for subscriptions)
1. Create Stripe account at [stripe.com](https://stripe.com)
2. Get test API keys from Stripe Dashboard
3. Create a product and price for $1.99/month subscription
4. Set up webhook endpoint pointing to your app: `/api/webhooks/stripe`
5. Add webhook events: `customer.subscription.*`, `invoice.*`

### 6. Authentication Setup in Supabase
1. Go to Authentication > Settings in Supabase dashboard
2. Configure allowed redirect URLs:
   - `http://localhost:3000/dashboard` (development)
   - `https://yourdomain.com/dashboard` (production)
3. Enable email authentication
4. Optionally enable OAuth providers (Google, GitHub)

### 7. Row Level Security (RLS)
The database setup script will enable RLS automatically. Users can only access their own data.

### 8. Development Workflow
```bash
# Start development server
npm run dev

# Run tests
npm run test

# Check database connection
npm run db:check

# Lint code
npm run lint
```

### 9. Production Deployment
1. Deploy to Vercel, Netlify, or similar platform
2. Update environment variables in production
3. Update Supabase redirect URLs for production domain
4. Update Stripe webhook endpoint for production
5. Switch to Stripe live keys in production

### 10. Required Supabase Extensions
The following extensions should be enabled (automatically handled by setup script):
- `uuid-ossp` (for UUID generation)

### 11. Troubleshooting

#### Database Connection Issues
- Check if environment variables are correct
- Verify Supabase project is active
- Ensure service role key has proper permissions

#### Authentication Issues
- Check redirect URLs in Supabase settings
- Verify email configuration in Supabase
- Check browser console for auth errors

#### Subscription Issues
- Verify Stripe keys are correct
- Check webhook endpoint is accessible
- Test with Stripe test cards: `4242424242424242`

### 12. Test Data
For development, you can create test users and subscriptions:

```sql
-- Insert test user profile (after auth signup)
INSERT INTO public.user_profiles (id, location_state, timezone)
VALUES ('user-uuid-here', 'CA', 'America/Los_Angeles');

-- Insert test subscription
INSERT INTO public.subscriptions (user_id, status, current_period_start, current_period_end)
VALUES ('user-uuid-here', 'active', NOW(), NOW() + INTERVAL '1 month');
```

### 13. California Labor Rules
The app includes California-specific overtime and meal period tracking:
- Overtime after 8 hours/day
- Weekly overtime after 40 hours
- Meal period reminders after 5 hours

Set user `location_state` to 'CA' to enable these features.

### 14. Export Functionality
Supports automated exports in CSV, PDF, and Excel formats:
- Users can configure scheduled exports
- Manual exports available on demand
- Email delivery for automated exports

---

**Important Security Notes:**
- Never commit `.env.local` to version control
- Use environment variables for all sensitive data
- Keep service role keys secure
- Enable RLS on all tables
- Use HTTPS in production