-- Database Indexes for Performance Optimization
-- Time Tracker Application

-- User Profiles Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_location
  ON public.user_profiles(location_state);
CREATE INDEX IF NOT EXISTS idx_user_profiles_timezone
  ON public.user_profiles(timezone);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created
  ON public.user_profiles(created_at);

-- Subscriptions Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user
  ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status
  ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer
  ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription
  ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period
  ON public.subscriptions(current_period_end) WHERE status = 'active';

-- Time Entries Indexes (Most Critical for Performance)
-- User and date-based queries (most common)
CREATE INDEX IF NOT EXISTS idx_time_entries_user_date
  ON public.time_entries(user_id, DATE(clock_in));
CREATE INDEX IF NOT EXISTS idx_time_entries_user_created
  ON public.time_entries(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_week
  ON public.time_entries(user_id, date_trunc('week', clock_in));

-- Active time entries lookup (for clock-in/out status)
CREATE INDEX IF NOT EXISTS idx_time_entries_active
  ON public.time_entries(user_id) WHERE clock_out IS NULL;

-- Date-based queries for reports
CREATE INDEX IF NOT EXISTS idx_time_entries_clock_in_date
  ON public.time_entries(DATE(clock_in));
CREATE INDEX IF NOT EXISTS idx_time_entries_duration
  ON public.time_entries(duration_minutes) WHERE duration_minutes IS NOT NULL;

-- Overtime tracking
CREATE INDEX IF NOT EXISTS idx_time_entries_overtime
  ON public.time_entries(user_id, overtime_minutes) WHERE overtime_minutes > 0;

-- Export Configurations Indexes
CREATE INDEX IF NOT EXISTS idx_export_configs_user
  ON public.export_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_export_configs_active
  ON public.export_configurations(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_export_configs_schedule
  ON public.export_configurations(frequency, schedule_time) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_export_configs_last_sent
  ON public.export_configurations(last_sent_at) WHERE is_active = true;

-- Labor Rule Applications Indexes
CREATE INDEX IF NOT EXISTS idx_labor_rules_time_entry
  ON public.labor_rule_applications(time_entry_id);
CREATE INDEX IF NOT EXISTS idx_labor_rules_type
  ON public.labor_rule_applications(rule_type);
CREATE INDEX IF NOT EXISTS idx_labor_rules_applied_date
  ON public.labor_rule_applications(DATE(applied_at));
CREATE INDEX IF NOT EXISTS idx_labor_rules_user_date
  ON public.labor_rule_applications(applied_at)
  INCLUDE (time_entry_id, rule_type);

-- Composite Indexes for Complex Queries
-- Time entries with user and date range (export queries)
CREATE INDEX IF NOT EXISTS idx_time_entries_export_query
  ON public.time_entries(user_id, clock_in, clock_out)
  WHERE clock_out IS NOT NULL;

-- Weekly overtime calculation
CREATE INDEX IF NOT EXISTS idx_time_entries_weekly_calc
  ON public.time_entries(user_id, date_trunc('week', clock_in), duration_minutes)
  WHERE clock_out IS NOT NULL;

-- Daily overtime calculation
CREATE INDEX IF NOT EXISTS idx_time_entries_daily_calc
  ON public.time_entries(user_id, DATE(clock_in), duration_minutes)
  WHERE clock_out IS NOT NULL;

-- Performance monitoring indexes
CREATE INDEX IF NOT EXISTS idx_time_entries_performance
  ON public.time_entries(created_at, user_id)
  WHERE clock_out IS NOT NULL;

-- Analyze tables for better query planning
-- Note: These would be run periodically in production
-- ANALYZE public.user_profiles;
-- ANALYZE public.subscriptions;
-- ANALYZE public.time_entries;
-- ANALYZE public.export_configurations;
-- ANALYZE public.labor_rule_applications;