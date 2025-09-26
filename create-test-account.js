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

// Step 1: Create user account
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

// Step 2: Create user profile
async function createUserProfile(userId) {
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
    id: userId,
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
      return response.data[0];
    } else {
      console.error('❌ Failed to create user profile');
      console.error(`   Status: ${response.statusCode}`);
      console.error(`   Response: ${JSON.stringify(response.data, null, 2)}`);
      return null;
    }
  } catch (error) {
    console.error('❌ Error creating user profile:', error.message);
    return null;
  }
}

// Step 3: Test login
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
      console.log(`   Access token received: ${response.data.access_token ? 'Yes' : 'No'}`);
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

// Step 4: Verify user profile exists
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
      console.log('✅ User profile verification successful');
      console.log(`   Profile found: ${response.data[0].id}`);
      console.log(`   Timezone: ${response.data[0].timezone}`);
      console.log(`   Location: ${response.data[0].location_state}`);
      return response.data[0];
    } else {
      console.error('❌ User profile verification failed');
      console.error(`   Status: ${response.statusCode}`);
      console.error(`   Response: ${JSON.stringify(response.data, null, 2)}`);
      return null;
    }
  } catch (error) {
    console.error('❌ Error verifying user profile:', error.message);
    return null;
  }
}

// Main function
async function main() {
  console.log('🚀 Starting TimeTracker test account creation...\n');

  try {
    // Step 1: Create user account
    const user = await createUser();
    if (!user) {
      console.log('\n❌ Account creation failed. Exiting.');
      process.exit(1);
    }

    console.log('');

    // Step 2: Create user profile
    const profile = await createUserProfile(user.id);
    if (!profile) {
      console.log('\n❌ Profile creation failed. Exiting.');
      process.exit(1);
    }

    console.log('');

    // Step 3: Verify user profile
    const verifiedProfile = await verifyUserProfile(user.id);
    if (!verifiedProfile) {
      console.log('\n❌ Profile verification failed. Exiting.');
      process.exit(1);
    }

    console.log('');

    // Step 4: Test login
    const loginResult = await testLogin();
    if (!loginResult) {
      console.log('\n❌ Login test failed. Exiting.');
      process.exit(1);
    }

    // Summary
    console.log('\n🎉 Test account creation completed successfully!\n');
    console.log('=== FINAL TEST CREDENTIALS ===');
    console.log(`Email: ${TEST_ACCOUNT.email}`);
    console.log(`Password: ${TEST_ACCOUNT.password}`);
    console.log(`Timezone: ${TEST_ACCOUNT.timezone}`);
    console.log(`Location State: ${TEST_ACCOUNT.location_state}`);
    console.log(`User ID: ${user.id}`);
    console.log('\n=== STATUS SUMMARY ===');
    console.log('✅ Account creation: SUCCESS');
    console.log('✅ Email confirmation: SUCCESS (auto-confirmed)');
    console.log('✅ User profile creation: SUCCESS');
    console.log('✅ Login test: SUCCESS');
    console.log('\nThe user can now log in to the TimeTracker application with these credentials.');

  } catch (error) {
    console.error('\n💥 Unexpected error:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  createUser,
  createUserProfile,
  testLogin,
  verifyUserProfile,
  TEST_ACCOUNT
};