#!/usr/bin/env node

const https = require('https');

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

// Check if all required tables exist
async function verifyAllTables() {
  console.log('🔍 Verifying all database tables...');

  const tablesToCheck = [
    'user_profiles',
    'subscriptions',
    'time_entries',
    'export_configurations',
    'labor_rule_applications'
  ];

  const results = {};
  let allTablesExist = true;

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
      const exists = response.statusCode === 200;
      results[table] = exists;

      if (exists) {
        console.log(`   ✅ ${table}: EXISTS`);
      } else {
        console.log(`   ❌ ${table}: MISSING`);
        allTablesExist = false;
      }
    } catch (error) {
      results[table] = false;
      console.log(`   ❌ ${table}: ERROR - ${error.message}`);
      allTablesExist = false;
    }
  }

  return { results, allTablesExist };
}

// Check user account
async function verifyUserAccount() {
  console.log('🔍 Verifying user account...');

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
        console.log('   ✅ User account exists');
        console.log(`   📧 Email: ${existingUser.email}`);
        console.log(`   🆔 User ID: ${existingUser.id}`);
        console.log(`   ✉️  Email confirmed: ${existingUser.email_confirmed_at ? 'Yes' : 'No'}`);
        return existingUser;
      }
    }

    console.log('   ❌ User account not found');
    return null;
  } catch (error) {
    console.log(`   ❌ Error checking user: ${error.message}`);
    return null;
  }
}

// Check user profile
async function verifyUserProfile(userId) {
  console.log('🔍 Verifying user profile...');

  const options = {
    hostname: new URL(SUPABASE_URL).hostname,
    path: `/rest/v1/user_profiles?id=eq.${userId}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY
    }
  };

  try {
    const response = await makeRequest(options);

    if (response.statusCode === 200 && response.data && response.data.length > 0) {
      const profile = response.data[0];
      console.log('   ✅ User profile exists');
      console.log(`   🆔 Profile ID: ${profile.id}`);
      console.log(`   🕐 Timezone: ${profile.timezone}`);
      console.log(`   📍 Location State: ${profile.location_state}`);
      return profile;
    }

    console.log('   ❌ User profile not found');
    return null;
  } catch (error) {
    console.log(`   ❌ Error checking profile: ${error.message}`);
    return null;
  }
}

// Test login functionality
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

    if (response.statusCode === 200 && response.data && response.data.access_token) {
      console.log('   ✅ Login successful');
      console.log(`   🔑 Access token: Received`);
      console.log(`   ⏰ Expires in: ${response.data.expires_in} seconds`);
      return true;
    } else {
      console.log('   ❌ Login failed');
      if (response.data && response.data.error_description) {
        console.log(`   📝 Error: ${response.data.error_description}`);
      }
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Login error: ${error.message}`);
    return false;
  }
}

// Main verification function
async function main() {
  console.log('🚀 Starting TimeTracker Setup Verification...\n');

  // Step 1: Verify all database tables
  const { results: tableResults, allTablesExist } = await verifyAllTables();
  console.log('');

  // Step 2: Verify user account
  const user = await verifyUserAccount();
  console.log('');

  // Step 3: Verify user profile (only if tables exist)
  let profile = null;
  if (allTablesExist && user) {
    profile = await verifyUserProfile(user.id);
    console.log('');
  }

  // Step 4: Test login
  let loginWorking = false;
  if (user) {
    loginWorking = await testLogin();
    console.log('');
  }

  // Final report
  console.log('📊 SETUP VERIFICATION SUMMARY');
  console.log('================================================================================');

  console.log('\n🗄️  DATABASE TABLES:');
  Object.entries(tableResults).forEach(([table, exists]) => {
    console.log(`   ${exists ? '✅' : '❌'} ${table}`);
  });

  console.log('\n👤 USER ACCOUNT:');
  console.log(`   ${user ? '✅' : '❌'} Account exists: ${user ? user.email : 'No'}`);
  console.log(`   ${user && user.email_confirmed_at ? '✅' : '❌'} Email confirmed: ${user && user.email_confirmed_at ? 'Yes' : 'No'}`);

  console.log('\n📝 USER PROFILE:');
  if (!allTablesExist) {
    console.log('   ⏸️  Profile check skipped (tables missing)');
  } else {
    console.log(`   ${profile ? '✅' : '❌'} Profile exists: ${profile ? 'Yes' : 'No'}`);
  }

  console.log('\n🔐 LOGIN FUNCTIONALITY:');
  console.log(`   ${loginWorking ? '✅' : '❌'} Login test: ${loginWorking ? 'PASS' : 'FAIL'}`);

  console.log('\n📋 NEXT STEPS:');
  if (!allTablesExist) {
    console.log('   1. ❌ Apply database schema via Supabase SQL Editor');
    console.log('   2. ⏸️  Run complete-setup.js to create user profile');
    console.log('   3. ⏸️  Test account login');
  } else if (!profile) {
    console.log('   1. ✅ Database schema applied');
    console.log('   2. ❌ Run complete-setup.js to create user profile');
    console.log('   3. ⏸️  Test account login');
  } else if (!loginWorking) {
    console.log('   1. ✅ Database schema applied');
    console.log('   2. ✅ User profile created');
    console.log('   3. ❌ Fix login issues (check credentials)');
  } else {
    console.log('   ✅ ALL SETUP COMPLETE! Test account is ready.');
  }

  console.log('\n🎯 TEST ACCOUNT CREDENTIALS:');
  console.log(`   📧 Email: ${TEST_ACCOUNT.email}`);
  console.log(`   🔑 Password: ${TEST_ACCOUNT.password}`);

  // Overall status
  const isFullySetup = allTablesExist && user && profile && loginWorking;
  console.log(`\n🎉 OVERALL STATUS: ${isFullySetup ? '✅ COMPLETE' : '⚠️  INCOMPLETE'}`);

  return {
    tablesExist: allTablesExist,
    userExists: !!user,
    profileExists: !!profile,
    loginWorking: loginWorking,
    fullySetup: isFullySetup
  };
}

if (require.main === module) {
  main()
    .then(result => {
      process.exit(result.fullySetup ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Verification error:', error);
      process.exit(1);
    });
}

module.exports = { main, verifyAllTables, verifyUserAccount, verifyUserProfile, testLogin };