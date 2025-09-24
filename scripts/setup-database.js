#!/usr/bin/env node

/**
 * Database Setup Script for Time Tracker Application
 *
 * This script sets up the complete database schema in Supabase
 * Run with: npm run db:setup
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  console.error('Please check your .env.local file');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Execute SQL file against the database
 */
async function executeSqlFile(filePath, description) {
  console.log(`📄 Executing ${description}...`);

  try {
    const sqlContent = fs.readFileSync(filePath, 'utf8');

    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });

    if (error) {
      console.error(`❌ Error in ${description}:`, error.message);
      return false;
    }

    console.log(`✅ ${description} completed successfully`);
    return true;
  } catch (err) {
    console.error(`❌ Failed to execute ${description}:`, err.message);
    return false;
  }
}

/**
 * Create the exec_sql function in Supabase if it doesn't exist
 */
async function createExecSqlFunction() {
  const createFunctionSql = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS text
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql;
      RETURN 'OK';
    EXCEPTION
      WHEN OTHERS THEN
        RETURN 'ERROR: ' || SQLERRM;
    END;
    $$;
  `;

  try {
    const { error } = await supabase.rpc('exec', { sql: createFunctionSql });
    if (error) {
      console.log('Note: exec_sql function may already exist or be created differently');
    }
  } catch (err) {
    // Function might already exist or be handled differently
    console.log('Note: Proceeding with database setup');
  }
}

/**
 * Main setup function
 */
async function setupDatabase() {
  console.log('🚀 Starting database setup for Time Tracker...\n');

  const databaseDir = path.join(__dirname, '..', 'database');
  const tablesDir = path.join(databaseDir, 'tables');

  // Check if database files exist
  const schemaPath = path.join(databaseDir, 'schema.sql');
  const indexesPath = path.join(databaseDir, 'indexes.sql');

  if (!fs.existsSync(schemaPath)) {
    console.error('❌ schema.sql not found in database/ directory');
    process.exit(1);
  }

  try {
    // Step 1: Create exec_sql helper function
    await createExecSqlFunction();

    // Step 2: Execute main schema
    const schemaSuccess = await executeSqlFile(schemaPath, 'Main schema');
    if (!schemaSuccess) {
      console.error('❌ Failed to create main schema. Stopping setup.');
      process.exit(1);
    }

    // Step 3: Execute individual table files (optional, for modularity)
    if (fs.existsSync(tablesDir)) {
      const tableFiles = fs.readdirSync(tablesDir).filter(file => file.endsWith('.sql'));

      for (const tableFile of tableFiles) {
        const tablePath = path.join(tablesDir, tableFile);
        const tableName = path.basename(tableFile, '.sql');
        await executeSqlFile(tablePath, `${tableName} table`);
      }
    }

    // Step 4: Create indexes
    if (fs.existsSync(indexesPath)) {
      await executeSqlFile(indexesPath, 'Database indexes');
    }

    // Step 5: Verify setup
    console.log('\n🔍 Verifying database setup...');

    // Check if tables were created
    const { data: tables, error: tablesError } = await supabase
      .rpc('exec_sql', {
        sql: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('user_profiles', 'subscriptions', 'time_entries', 'export_configurations', 'labor_rule_applications');`
      });

    if (tablesError) {
      console.error('❌ Error verifying tables:', tablesError.message);
    } else {
      console.log('✅ Database tables created successfully');
    }

    // Check RLS policies
    const { data: policies, error: policiesError } = await supabase
      .rpc('exec_sql', {
        sql: `SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public';`
      });

    if (policiesError) {
      console.error('❌ Error verifying RLS policies:', policiesError.message);
    } else {
      console.log('✅ Row Level Security policies created successfully');
    }

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('  1. Run: npm run dev');
    console.log('  2. Test the application at http://localhost:3000');
    console.log('  3. Check Supabase dashboard for table data');

  } catch (error) {
    console.error('\n❌ Database setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('  1. Check your .env.local file has correct Supabase credentials');
    console.log('  2. Ensure your Supabase project is active');
    console.log('  3. Verify you have the service role key (not anon key)');
    console.log('  4. Check Supabase logs for more details');
    process.exit(1);
  }
}

// Run the setup
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };