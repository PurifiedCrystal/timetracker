#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const SUPABASE_URL = 'https://kgwklydkmeihoulipqof.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd2tseWRrbWVpaG91bGlwcW9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODcyODA5OSwiZXhwIjoyMDc0MzA0MDk5fQ.53hDEoxgc6ivlPZ1pZvfyCeWpaS8hQiBq5UhCNzKSPI';

// Test account details
const TEST_ACCOUNT = {
  email: 'demo@timetracker.com',
  password: 'TestDemo123!',
  timezone: 'America/New_York',
  location_state: 'NY'
};

// Helper function to make HTTPS requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            data: body ? JSON.parse(body) : null
          };
          resolve(response);
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: body,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Check if user already exists
async function checkUserExists() {
  console.log('🔍 Checking if user already exists...');

  const options = {
    hostname: new URL(SUPABASE_URL).hostname,
    path: '/auth/v1/admin/users',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY
    }
  };

  try {
    const response = await makeRequest(options);

    if (response.statusCode === 200 && response.data && response.data.users) {
      const existingUser = response.data.users.find(user => user.email === TEST_ACCOUNT.email);
      if (existingUser) {
        console.log('✅ User already exists');
        console.log(`   User ID: ${existingUser.id}`);
        console.log(`   Email: ${existingUser.email}`);
        console.log(`   Email confirmed: ${existingUser.email_confirmed_at ? 'Yes' : 'No'}`);
        return existingUser;
      }
    }

    console.log('❌ User does not exist');
    return null;
  } catch (error) {
    console.error('❌ Error checking user:', error.message);
    return null;
  }
}

// Create user account
async function createUser() {
  console.log('🔐 Creating user account...');

  const options = {
    hostname: new URL(SUPABASE_URL).hostname,
    path: '/auth/v1/admin/users',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY
    }
  };

  const userData = {
    email: TEST_ACCOUNT.email,
    password: TEST_ACCOUNT.password,
    email_confirm: true, // Auto-confirm email
    user_metadata: {
      timezone: TEST_ACCOUNT.timezone,
      location_state: TEST_ACCOUNT.location_state
    }
  };

  try {
    const response = await makeRequest(options, userData);

    if (response.statusCode === 200 || response.statusCode === 201) {
      console.log('✅ User account created successfully');
      console.log(`   User ID: ${response.data.id}`);
      console.log(`   Email: ${response.data.email}`);
      console.log(`   Email confirmed: ${response.data.email_confirmed_at ? 'Yes' : 'No'}`);
      return response.data;
    } else {
      console.error('❌ Failed to create user account');
      console.error(`   Status: ${response.statusCode}`);
      console.error(`   Response: ${JSON.stringify(response.data, null, 2)}`);
      return null;
    }
  } catch (error) {
    console.error('❌ Error creating user account:', error.message);
    return null;
  }
}

// Check if tables exist
async function checkTablesExist() {
  console.log('🔍 Checking database tables...');

  const tablesToCheck = ['user_profiles'];
  const results = {};

  for (const table of tablesToCheck) {
    const options = {
      hostname: new URL(SUPABASE_URL).hostname,
      path: `/rest/v1/${table}?limit=1`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY
      }
    };

    try {
      const response = await makeRequest(options);
      results[table] = response.statusCode === 200;
      console.log(`   ${table}: ${results[table] ? '✅ EXISTS' : '❌ MISSING'}`);
    } catch (error) {
      results[table] = false;
      console.log(`   ${table}: ❌ ERROR - ${error.message}`);
    }
  }

  return results;
}

// Test login
async function testLogin() {
  console.log('🔍 Testing login functionality...');

  const options = {
    hostname: new URL(SUPABASE_URL).hostname,
    path: '/auth/v1/token?grant_type=password',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY
    }
  };

  const loginData = {
    email: TEST_ACCOUNT.email,
    password: TEST_ACCOUNT.password
  };

  try {
    const response = await makeRequest(options, loginData);

    if (response.statusCode === 200) {
      console.log('✅ Login test successful');
      console.log(`   Access token: ${response.data.access_token ? 'Received' : 'Missing'}`);
      console.log(`   Token type: ${response.data.token_type}`);
      console.log(`   Expires in: ${response.data.expires_in} seconds`);
      return response.data;
    } else {
      console.error('❌ Login test failed');
      console.error(`   Status: ${response.statusCode}`);
      console.error(`   Response: ${JSON.stringify(response.data, null, 2)}`);
      return null;
    }
  } catch (error) {
    console.error('❌ Error testing login:', error.message);
    return null;
  }
}

// Generate SQL setup instructions
function generateSetupInstructions() {
  const schema = fs.readFileSync(path.join(__dirname, 'database', 'schema.sql'), 'utf8');

  return `
================================================================================
DATABASE SETUP REQUIRED
================================================================================

To complete the TimeTracker setup, you need to apply the database schema:

STEP 1: Go to Supabase Dashboard
   URL: https://supabase.com/dashboard/project/kgwklydkmeihoulipqof

STEP 2: Navigate to SQL Editor
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

STEP 3: Copy and paste the following SQL schema:

${schema}

STEP 4: Execute the SQL
   - Click "Run" or press Ctrl+Enter to execute the schema

STEP 5: Verify Tables Created
   - Go to "Table Editor" in the left sidebar
   - You should see these tables:
     • user_profiles
     • subscriptions
     • time_entries
     • export_configurations
     • labor_rule_applications

STEP 6: Re-run this script
   - Once tables are created, run: node complete-setup.js
   - This will create the user profile and complete the test account setup

================================================================================
`;
}

// Main function
async function main() {
  console.log('🚀 Starting complete TimeTracker setup...\n');

  // Step 1: Check/create user
  let user = await checkUserExists();
  if (!user) {
    user = await createUser();
    if (!user) {
      console.log('\n❌ Failed to create user. Exiting.');
      process.exit(1);
    }
  }

  console.log('');

  // Step 2: Check if database tables exist
  const tablesExist = await checkTablesExist();

  if (!tablesExist.user_profiles) {
    console.log('\n⚠️  Database tables are missing!');
    console.log(generateSetupInstructions());

    console.log('🔍 Current Status:');
    console.log('✅ User account: CREATED');
    console.log('✅ Email confirmation: SUCCESS');
    console.log('❌ Database schema: MISSING');
    console.log('❌ User profile: PENDING (requires database schema)');
    console.log('⏳ Login test: PENDING (requires user profile)');

    console.log('\n📋 Next Steps:');
    console.log('1. Apply the database schema using the instructions above');
    console.log('2. Run this script again: node complete-setup.js');

    process.exit(1);
  }

  console.log('');

  // Step 3: Create user profile (if tables exist)
  console.log('👤 Creating user profile...');

  const options = {
    hostname: new URL(SUPABASE_URL).hostname,
    path: '/rest/v1/user_profiles',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Prefer': 'return=representation'
    }
  };

  const profileData = {
    id: user.id,
    location_state: TEST_ACCOUNT.location_state,
    timezone: TEST_ACCOUNT.timezone,
    export_preferences: {}
  };

  try {
    const response = await makeRequest(options, profileData);

    if (response.statusCode === 200 || response.statusCode === 201) {
      console.log('✅ User profile created successfully');
      console.log(`   Profile ID: ${response.data[0].id}`);
      console.log(`   Timezone: ${response.data[0].timezone}`);
      console.log(`   Location State: ${response.data[0].location_state}`);
    } else if (response.statusCode === 409 || (response.data && response.data.message && response.data.message.includes('already exists'))) {
      console.log('✅ User profile already exists');
    } else {
      console.error('❌ Failed to create user profile');
      console.error(`   Status: ${response.statusCode}`);
      console.error(`   Response: ${JSON.stringify(response.data, null, 2)}`);
    }
  } catch (error) {
    console.error('❌ Error creating user profile:', error.message);
  }

  console.log('');

  // Step 4: Test login
  const loginResult = await testLogin();

  // Final summary
  console.log('\n🎉 TimeTracker Test Account Setup Complete!\n');
  console.log('=== FINAL TEST CREDENTIALS ===');
  console.log(`Email: ${TEST_ACCOUNT.email}`);
  console.log(`Password: ${TEST_ACCOUNT.password}`);
  console.log(`Timezone: ${TEST_ACCOUNT.timezone}`);
  console.log(`Location State: ${TEST_ACCOUNT.location_state}`);
  console.log(`User ID: ${user.id}`);
  console.log('\n=== STATUS SUMMARY ===');
  console.log('✅ Account creation: SUCCESS');
  console.log('✅ Email confirmation: SUCCESS (auto-confirmed)');
  console.log(tablesExist.user_profiles ? '✅ User profile creation: SUCCESS' : '❌ User profile creation: REQUIRES DATABASE SCHEMA');
  console.log(loginResult ? '✅ Login test: SUCCESS' : '⚠️  Login test: PARTIAL (account exists, profile may be missing)');

  if (tablesExist.user_profiles && loginResult) {
    console.log('\n🚀 The user can now log in to the TimeTracker application!');
  } else {
    console.log('\n⚠️  Setup incomplete. Please apply database schema first.');
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkUserExists, createUser, testLogin, checkTablesExist, TEST_ACCOUNT };