-- Labor Rule Applications Table
-- Tracks application of location-specific labor rules (e.g., California overtime)

-- Create enum type
DO $$ BEGIN
  CREATE TYPE labor_rule_type AS ENUM ('overtime_daily', 'overtime_weekly', 'meal_period');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.labor_rule_applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  time_entry_id UUID REFERENCES public.time_entries(id) ON DELETE CASCADE NOT NULL,
  rule_type labor_rule_type NOT NULL,
  rule_value JSONB NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_labor_rules_time_entry ON public.labor_rule_applications(time_entry_id);
CREATE INDEX IF NOT EXISTS idx_labor_rules_type ON public.labor_rule_applications(rule_type);
CREATE INDEX IF NOT EXISTS idx_labor_rules_applied_date ON public.labor_rule_applications(DATE(applied_at));

-- Row Level Security
ALTER TABLE public.labor_rule_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own labor rules" ON public.labor_rule_applications;
CREATE POLICY "Users can view own labor rules" ON public.labor_rule_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.time_entries
      WHERE id = time_entry_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System can manage labor rules" ON public.labor_rule_applications;
CREATE POLICY "System can manage labor rules" ON public.labor_rule_applications
  FOR INSERT WITH CHECK (true);

-- Comments
COMMENT ON TABLE public.labor_rule_applications IS 'Tracks when labor rules are applied to time entries';
COMMENT ON COLUMN public.labor_rule_applications.rule_type IS 'Type of labor rule: overtime_daily, overtime_weekly, meal_period';
COMMENT ON COLUMN public.labor_rule_applications.rule_value IS 'JSON data specific to the rule type applied';

-- Example rule_value structures:
-- overtime_daily: {"threshold_hours": 8, "overtime_minutes": 120, "rate_multiplier": 1.5}
-- overtime_weekly: {"threshold_hours": 40, "overtime_minutes": 300, "rate_multiplier": 1.5}
-- meal_period: {"required_after_hours": 5, "violation": true, "break_provided": false}