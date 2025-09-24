# Data Model: Time Tracking Application

## Core Entities

### User
**Purpose**: Represents a subscribed user with account and preferences
**Storage**: Supabase Auth + custom profile table

**Fields**:
- `id` (UUID, primary key) - Supabase auth user ID
- `email` (string, unique) - User email address
- `created_at` (timestamp) - Account creation date
- `location_state` (string, nullable) - US state for labor rules (e.g., "CA")
- `timezone` (string) - User timezone (e.g., "America/Los_Angeles")
- `export_preferences` (JSONB) - Export settings and preferences

**Relationships**:
- One-to-many with TimeEntry
- One-to-many with ExportConfiguration
- One-to-one with Subscription

**Validation Rules**:
- Email must be valid format
- Location state must be valid US state code if provided
- Timezone must be valid IANA timezone

**State Transitions**:
- Created → Email verified → Active
- Active → Subscription expired → Inactive
- Active → Deleted (soft delete)

### TimeEntry
**Purpose**: Represents a work session with clock-in/out times
**Storage**: PostgreSQL table

**Fields**:
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key) - References User
- `clock_in` (timestamp with timezone) - Start time
- `clock_out` (timestamp with timezone, nullable) - End time (null if active)
- `duration_minutes` (integer, computed) - Total minutes worked
- `break_minutes` (integer, default 0) - Break time deducted
- `overtime_minutes` (integer, default 0) - Overtime minutes
- `created_at` (timestamp)
- `updated_at` (timestamp)
- `metadata` (JSONB) - Additional data (location, notes, etc.)

**Relationships**:
- Many-to-one with User
- One-to-many with LaborRuleApplication

**Validation Rules**:
- Clock-in required, clock-out optional
- If clock-out exists, must be after clock-in
- Duration calculated as clock-out - clock-in - break_minutes
- User can only have one active session (clock-out is null)

**Computed Fields**:
- `is_active`: clock-out is null
- `daily_total`: sum of duration for user on same date
- `weekly_total`: sum of duration for user in same week

### Subscription
**Purpose**: Represents user's payment status and billing
**Storage**: PostgreSQL table with Stripe webhook updates

**Fields**:
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key, unique) - References User
- `stripe_customer_id` (string) - Stripe customer ID
- `stripe_subscription_id` (string) - Stripe subscription ID
- `status` (enum) - active, past_due, canceled, incomplete
- `current_period_start` (timestamp) - Billing period start
- `current_period_end` (timestamp) - Billing period end
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Relationships**:
- One-to-one with User

**Validation Rules**:
- Status must be valid subscription status
- Stripe IDs required when status is active
- Billing periods must be valid dates

**State Transitions**:
- incomplete → active (payment successful)
- active → past_due (payment failed)
- past_due → active (payment recovered)
- active → canceled (user cancellation)

### ExportConfiguration
**Purpose**: User preferences for automated exports
**Storage**: PostgreSQL table

**Fields**:
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key) - References User
- `name` (string) - Configuration name
- `format` (enum) - csv, pdf, xlsx
- `frequency` (enum) - daily, weekly, monthly
- `schedule_time` (time) - Time of day to send (user timezone)
- `email_recipients` (text array) - Email addresses to send to
- `date_range_days` (integer) - Number of days to include
- `is_active` (boolean) - Whether configuration is enabled
- `created_at` (timestamp)
- `last_sent_at` (timestamp, nullable)

**Relationships**:
- Many-to-one with User

**Validation Rules**:
- Format must be supported type
- Frequency must be valid option
- Email recipients must be valid email addresses
- Date range must be positive integer

### LaborRuleApplication
**Purpose**: Tracks application of location-specific labor rules
**Storage**: PostgreSQL table

**Fields**:
- `id` (UUID, primary key)
- `time_entry_id` (UUID, foreign key) - References TimeEntry
- `rule_type` (enum) - overtime_daily, overtime_weekly, meal_period
- `rule_value` (JSONB) - Rule-specific data
- `applied_at` (timestamp)

**Relationships**:
- Many-to-one with TimeEntry

**Rule Types and Values**:

**overtime_daily**:
```json
{
  "threshold_hours": 8,
  "overtime_minutes": 120,
  "rate_multiplier": 1.5
}
```

**overtime_weekly**:
```json
{
  "threshold_hours": 40,
  "overtime_minutes": 300,
  "rate_multiplier": 1.5
}
```

**meal_period**:
```json
{
  "required_after_hours": 5,
  "violation": true,
  "break_provided": false
}
```

## Database Schema

### Supabase Tables

```sql
-- Extends Supabase auth.users
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  location_state VARCHAR(2),
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  export_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) UNIQUE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'incomplete',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.time_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) NOT NULL,
  clock_in TIMESTAMP WITH TIME ZONE NOT NULL,
  clock_out TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN clock_out IS NOT NULL
      THEN EXTRACT(EPOCH FROM (clock_out - clock_in)) / 60
      ELSE NULL
    END
  ) STORED,
  break_minutes INTEGER DEFAULT 0,
  overtime_minutes INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.export_configurations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) NOT NULL,
  name TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('csv', 'pdf', 'xlsx')),
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  schedule_time TIME NOT NULL,
  email_recipients TEXT[] DEFAULT ARRAY[]::TEXT[],
  date_range_days INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sent_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.labor_rule_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  time_entry_id UUID REFERENCES public.time_entries(id) NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('overtime_daily', 'overtime_weekly', 'meal_period')),
  rule_value JSONB NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Indexes for Performance

```sql
-- Time entries by user and date
CREATE INDEX idx_time_entries_user_date ON public.time_entries(user_id, DATE(clock_in));

-- Active time entries lookup
CREATE INDEX idx_time_entries_active ON public.time_entries(user_id) WHERE clock_out IS NULL;

-- Export configurations by user
CREATE INDEX idx_export_configs_user ON public.export_configurations(user_id);

-- Labor rule applications by time entry
CREATE INDEX idx_labor_rules_time_entry ON public.labor_rule_applications(time_entry_id);
```

### Row Level Security (RLS)

```sql
-- Users can only access their own data
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR ALL USING (auth.uid() = id);

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own time entries" ON public.time_entries
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Similar policies for other tables
```

_Data model completed: 2025-09-24_