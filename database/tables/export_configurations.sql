-- Export Configurations Table
-- Manages automated export settings for users

-- Create enum types
DO $$ BEGIN
  CREATE TYPE export_format AS ENUM ('csv', 'pdf', 'xlsx');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE export_frequency AS ENUM ('daily', 'weekly', 'monthly');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.export_configurations (
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_export_configs_user ON public.export_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_export_configs_active ON public.export_configurations(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_export_configs_schedule ON public.export_configurations(frequency, schedule_time) WHERE is_active = true;

-- Row Level Security
ALTER TABLE public.export_configurations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can manage own export configs" ON public.export_configurations;
CREATE POLICY "Users can manage own export configs" ON public.export_configurations
  FOR ALL USING (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE public.export_configurations IS 'User-defined automated export configurations';
COMMENT ON COLUMN public.export_configurations.name IS 'User-friendly name for the export configuration';
COMMENT ON COLUMN public.export_configurations.format IS 'Export file format: csv, pdf, or xlsx';
COMMENT ON COLUMN public.export_configurations.frequency IS 'How often to run the export: daily, weekly, monthly';
COMMENT ON COLUMN public.export_configurations.schedule_time IS 'Time of day to run export (in user timezone)';
COMMENT ON COLUMN public.export_configurations.email_recipients IS 'Array of email addresses to send export to';
COMMENT ON COLUMN public.export_configurations.date_range_days IS 'Number of days of data to include in export';