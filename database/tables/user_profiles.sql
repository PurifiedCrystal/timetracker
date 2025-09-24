-- User Profiles Table
-- Extends Supabase auth.users with additional profile information

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  location_state VARCHAR(2),
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  export_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_location ON public.user_profiles(location_state);

-- Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can manage own profile" ON public.user_profiles;
CREATE POLICY "Users can manage own profile" ON public.user_profiles
  FOR ALL USING (auth.uid() = id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE public.user_profiles IS 'User profile information extending Supabase auth.users';
COMMENT ON COLUMN public.user_profiles.location_state IS 'US state code for labor rule application (e.g., CA)';
COMMENT ON COLUMN public.user_profiles.timezone IS 'IANA timezone identifier for user location';
COMMENT ON COLUMN public.user_profiles.export_preferences IS 'JSON object storing user export preferences';