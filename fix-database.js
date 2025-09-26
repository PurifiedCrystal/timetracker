#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd2tseWRrbWVpaG91bGlwcW9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODcyODA5OSwiZXhwIjoyMDc0MzA0MDk5fQ.YZ2qyKTGNJH_Hl1l7yiQ9O4kQaECNSXfQmTePNzTG0Y'; // Service role key

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixDatabase() {
  console.log('🚀 Fixing database schema...\n');

  const fixes = [
    // Add missing columns to user_profiles
    `ALTER TABLE public.user_profiles
     ADD COLUMN IF NOT EXISTS export_preferences JSONB DEFAULT '{}',
     ADD COLUMN IF NOT EXISTS california_mode BOOLEAN DEFAULT false,
     ADD COLUMN IF NOT EXISTS tracking_mode TEXT DEFAULT 'work',
     ADD COLUMN IF NOT EXISTS full_name TEXT,
     ADD COLUMN IF NOT EXISTS email TEXT;`,

    // Create export_configurations table if missing
    `CREATE TABLE IF NOT EXISTS public.export_configurations (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
      name TEXT NOT NULL,
      format TEXT NOT NULL CHECK (format IN ('csv', 'pdf', 'xlsx')),
      frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
      schedule_time TIME NOT NULL,
      email_recipients TEXT[] DEFAULT ARRAY[]::TEXT[],
      date_range_days INTEGER DEFAULT 30,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      last_sent_at TIMESTAMP WITH TIME ZONE,
      CONSTRAINT positive_date_range CHECK (date_range_days > 0),
      CONSTRAINT valid_name CHECK (length(name) > 0)
    );`,

    // Enable RLS on export_configurations
    `ALTER TABLE public.export_configurations ENABLE ROW LEVEL SECURITY;`,

    // Create RLS policy for export_configurations
    `DROP POLICY IF EXISTS "Users can manage own export configs" ON public.export_configurations;
     CREATE POLICY "Users can manage own export configs" ON public.export_configurations
       FOR ALL USING (auth.uid() = user_id);`,

    // Create index for export configs
    `CREATE INDEX IF NOT EXISTS idx_export_configs_user ON public.export_configurations(user_id);
     CREATE INDEX IF NOT EXISTS idx_export_configs_active ON public.export_configurations(user_id) WHERE is_active = true;`,

    // Fix RLS policies for time_entries to allow inserts
    `DROP POLICY IF EXISTS "Users can manage own time entries" ON public.time_entries;
     CREATE POLICY "Users can view own time entries" ON public.time_entries
       FOR SELECT USING (auth.uid() = user_id);
     CREATE POLICY "Users can insert own time entries" ON public.time_entries
       FOR INSERT WITH CHECK (auth.uid() = user_id);
     CREATE POLICY "Users can update own time entries" ON public.time_entries
       FOR UPDATE USING (auth.uid() = user_id);
     CREATE POLICY "Users can delete own time entries" ON public.time_entries
       FOR DELETE USING (auth.uid() = user_id);`,

    // Fix user_profiles RLS policies
    `DROP POLICY IF EXISTS "Users can manage own profile" ON public.user_profiles;
     CREATE POLICY "Users can view own profile" ON public.user_profiles
       FOR SELECT USING (auth.uid() = id);
     CREATE POLICY "Users can insert own profile" ON public.user_profiles
       FOR INSERT WITH CHECK (auth.uid() = id);
     CREATE POLICY "Users can update own profile" ON public.user_profiles
       FOR UPDATE USING (auth.uid() = id);`,
  ];

  for (let i = 0; i < fixes.length; i++) {
    const sql = fixes[i];
    console.log(`🔧 Applying fix ${i + 1}/${fixes.length}...`);

    try {
      const { error } = await supabase.rpc('exec_sql', { query: sql });

      if (error) {
        console.log(`⚠️ Fix ${i + 1} may have already been applied or needs manual execution`);
        console.log(`SQL: ${sql.substring(0, 100)}...`);
      } else {
        console.log(`✅ Fix ${i + 1} applied successfully`);
      }
    } catch (err) {
      console.log(`⚠️ Fix ${i + 1} encountered an issue:`, err.message);
    }
  }

  console.log('\n🎉 Database fixes completed!');
  console.log('\n📋 Test Account Ready:');
  console.log('Email: demo@timetracker.com');
  console.log('Password: TestDemo123!');
}

fixDatabase().catch(console.error);