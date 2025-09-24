# TimeTracker Deployment Guide

Complete step-by-step guide to deploy TimeTracker to Netlify with Supabase and Stripe integration.

## 🚀 Netlify Deployment

### Step 1: Prepare Repository
```bash
# Push to GitHub
git init
git add .
git commit -m "Initial TimeTracker application"
git branch -M main
git remote add origin https://github.com/yourusername/timetracker.git
git push -u origin main
```

### Step 2: Connect to Netlify
1. Go to [Netlify](https://netlify.com)
2. Click "New site from Git"
3. Choose GitHub and select your repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - **Node version**: 18

### Step 3: Environment Variables
Add these in Netlify → Site settings → Environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=sk_live_your_stripe_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_ID=price_your_monthly_price
NEXTAUTH_URL=https://your-app.netlify.app
```

## 🗄️ Supabase Setup

### Step 1: Create Project
1. Go to [Supabase](https://supabase.com)
2. Create new project
3. Note your project URL and anon key

### Step 2: Database Schema
Run this SQL in Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_state VARCHAR(2),
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  export_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create time_entries table
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  clock_in TIMESTAMP WITH TIME ZONE NOT NULL,
  clock_out TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  break_minutes INTEGER DEFAULT 0,
  overtime_minutes INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'incomplete',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create export_configurations table
CREATE TABLE export_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  format VARCHAR(10) NOT NULL,
  frequency VARCHAR(20) NOT NULL,
  schedule_time TIME NOT NULL,
  email_recipients TEXT[] DEFAULT '{}',
  date_range_days INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sent_at TIMESTAMP WITH TIME ZONE
);

-- Create labor_violations table
CREATE TABLE labor_violations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  time_entry_id UUID,
  violation_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved BOOLEAN DEFAULT false
);

-- Create indexes
CREATE INDEX idx_time_entries_user_clock_in ON time_entries(user_id, clock_in DESC);
CREATE INDEX idx_time_entries_user_active ON time_entries(user_id) WHERE clock_out IS NULL;
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_export_configs_user_active ON export_configurations(user_id) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE labor_violations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own time entries" ON time_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own time entries" ON time_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own time entries" ON time_entries FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage subscriptions" ON subscriptions FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can view own export configs" ON export_configurations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own export configs" ON export_configurations FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own violations" ON labor_violations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage violations" ON labor_violations FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
```

### Step 3: Authentication Settings
1. Go to Authentication → Settings
2. Enable email confirmation
3. Set Site URL to your Netlify domain
4. Configure email templates

## 💳 Stripe Setup

### Step 1: Create Product
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Products → Add product
3. Name: "TimeTracker Pro"
4. Price: $1.99/month recurring
5. Copy the Price ID

### Step 2: Webhooks
1. Go to Webhooks → Add endpoint
2. URL: `https://your-app.netlify.app/api/v1/subscription/webhook`
3. Events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook signing secret

### Step 3: API Keys
1. Copy publishable key (`pk_live_...`)
2. Copy secret key (`sk_live_...`)
3. Add to Netlify environment variables

## ✅ Verification Checklist

### Database
- [ ] All tables created successfully
- [ ] RLS policies enabled
- [ ] Indexes created
- [ ] Authentication configured

### Stripe
- [ ] Product and pricing created
- [ ] Webhook endpoint configured
- [ ] API keys configured in Netlify
- [ ] Test subscription flow

### Deployment
- [ ] Environment variables set
- [ ] Build successful
- [ ] Site accessible
- [ ] Authentication working
- [ ] API routes responding

### Testing
- [ ] User signup/signin
- [ ] Time tracking (clock in/out)
- [ ] Subscription flow
- [ ] Dashboard functionality
- [ ] Mobile responsiveness

## 🔧 Common Issues

### Build Errors
```bash
# Clear Netlify cache
rm -rf .netlify
npm run build
```

### Database Connection
- Check Supabase URL and keys
- Verify RLS policies
- Check user permissions

### Stripe Integration
- Verify webhook URL matches exactly
- Check webhook signing secret
- Test with Stripe CLI

### Authentication
- Ensure Site URL matches production domain
- Check email confirmation settings
- Verify JWT secret configuration

## 📱 Custom Domain (Optional)

1. Go to Domain settings in Netlify
2. Add custom domain
3. Configure DNS records
4. Update NEXTAUTH_URL environment variable
5. Update Stripe webhook URL
6. Update Supabase Site URL

## 🚀 Go Live!

Your TimeTracker application is now live and ready to accept users and subscriptions!

Remember to:
- Monitor error logs in Netlify
- Check Stripe dashboard for payments
- Monitor Supabase usage
- Set up monitoring/analytics if needed

---

🎉 **Congratulations! Your TimeTracker app is now live on Netlify!**