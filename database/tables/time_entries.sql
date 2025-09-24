-- Time Entries Table
-- Stores clock-in and clock-out records for time tracking

CREATE TABLE IF NOT EXISTS public.time_entries (
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_time_entries_user_date ON public.time_entries(user_id, DATE(clock_in));
CREATE INDEX IF NOT EXISTS idx_time_entries_user_created ON public.time_entries(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_time_entries_active ON public.time_entries(user_id) WHERE clock_out IS NULL;

-- Row Level Security
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can manage own time entries" ON public.time_entries;
CREATE POLICY "Users can manage own time entries" ON public.time_entries
  FOR ALL USING (auth.uid() = user_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_time_entries_updated_at ON public.time_entries;
CREATE TRIGGER update_time_entries_updated_at
  BEFORE UPDATE ON public.time_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE public.time_entries IS 'Individual work sessions with clock-in and clock-out times';
COMMENT ON COLUMN public.time_entries.duration_minutes IS 'Computed field: total minutes worked (clock_out - clock_in)';
COMMENT ON COLUMN public.time_entries.break_minutes IS 'Minutes of break time to deduct from duration';
COMMENT ON COLUMN public.time_entries.overtime_minutes IS 'Minutes of overtime worked in this session';
COMMENT ON COLUMN public.time_entries.metadata IS 'Additional data like location, notes, project info';