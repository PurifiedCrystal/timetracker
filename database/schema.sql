-- Time Tracker Database Schema
-- This file contains the complete database schema for the time tracking application

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'incomplete');
CREATE TYPE export_format AS ENUM ('csv', 'pdf', 'xlsx');
CREATE TYPE export_frequency AS ENUM ('daily', 'weekly', 'monthly');
CREATE TYPE labor_rule_type AS ENUM ('overtime_daily', 'overtime_weekly', 'meal_period');

-- Note: auth.users table is provided by Supabase Auth
-- We extend it with a profiles table for additional user data

-- User profiles table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  location_state VARCHAR(2),
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  export_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status subscription_status NOT NULL DEFAULT 'incomplete',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Time entries table
CREATE TABLE public.time_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_clock_times CHECK (clock_out IS NULL OR clock_out > clock_in),
  CONSTRAINT positive_breaks CHECK (break_minutes >= 0),
  CONSTRAINT positive_overtime CHECK (overtime_minutes >= 0)
);

-- Export configurations table
CREATE TABLE public.export_configurations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  format export_format NOT NULL,
  frequency export_frequency NOT NULL,
  schedule_time TIME NOT NULL,
  email_recipients TEXT[] DEFAULT ARRAY[]::TEXT[],
  date_range_days INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sent_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  CONSTRAINT positive_date_range CHECK (date_range_days > 0),
  CONSTRAINT valid_name CHECK (length(name) > 0)
);

-- Labor rule applications table
CREATE TABLE public.labor_rule_applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  time_entry_id UUID REFERENCES public.time_entries(id) ON DELETE CASCADE NOT NULL,
  rule_type labor_rule_type NOT NULL,
  rule_value JSONB NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
-- User-based queries
CREATE INDEX idx_user_profiles_location ON public.user_profiles(location_state);
CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

-- Time entries by user and date
CREATE INDEX idx_time_entries_user_date ON public.time_entries(user_id, DATE(clock_in));
CREATE INDEX idx_time_entries_user_created ON public.time_entries(user_id, created_at);

-- Active time entries lookup (for clock-in/out status)
CREATE INDEX idx_time_entries_active ON public.time_entries(user_id) WHERE clock_out IS NULL;

-- Export configurations by user
CREATE INDEX idx_export_configs_user ON public.export_configurations(user_id);
CREATE INDEX idx_export_configs_active ON public.export_configurations(user_id) WHERE is_active = true;

-- Labor rule applications by time entry
CREATE INDEX idx_labor_rules_time_entry ON public.labor_rule_applications(time_entry_id);
CREATE INDEX idx_labor_rules_type ON public.labor_rule_applications(rule_type);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labor_rule_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only access their own profile
CREATE POLICY "Users can manage own profile" ON public.user_profiles
  FOR ALL USING (auth.uid() = id);

-- Users can only access their own subscription
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can manage subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (true);

-- Users can only access their own time entries
CREATE POLICY "Users can manage own time entries" ON public.time_entries
  FOR ALL USING (auth.uid() = user_id);

-- Users can only access their own export configurations
CREATE POLICY "Users can manage own export configs" ON public.export_configurations
  FOR ALL USING (auth.uid() = user_id);

-- Users can only access labor rules for their time entries
CREATE POLICY "Users can view own labor rules" ON public.labor_rule_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.time_entries
      WHERE id = time_entry_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage labor rules" ON public.labor_rule_applications
  FOR INSERT WITH CHECK (true);

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_entries_updated_at
  BEFORE UPDATE ON public.time_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helper functions
CREATE OR REPLACE FUNCTION get_user_active_time_entry(p_user_id UUID)
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id FROM public.time_entries
    WHERE user_id = p_user_id AND clock_out IS NULL
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION calculate_weekly_hours(p_user_id UUID, p_week_start DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(duration_minutes), 0)
    FROM public.time_entries
    WHERE user_id = p_user_id
      AND DATE(clock_in) >= p_week_start
      AND DATE(clock_in) < p_week_start + INTERVAL '7 days'
      AND clock_out IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;