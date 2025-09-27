const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kgwklydkmeihoulipqof.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd2tseWRrbWVpaG91bGlwcW9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MjgwOTksImV4cCI6MjA3NDMwNDA5OX0.SVsGhRHEcRCArfKYwHbw2tWDfoF1JG8kaUm1cIgIOB4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestUsers() {
  console.log('Creating 10 test users...\n');
  console.log(`Using Supabase URL: ${supabaseUrl}\n`);

  const results = [];
  const errors = [];

  for (let i = 1; i <= 10; i++) {
    const email = `user${i}@timetracker.com`;
    const password = `user${i}123`;  // Made it 6+ characters
    const fullName = `Test User ${i}`;

    try {
      console.log(`Creating user${i} (${email})...`);

      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: fullName,
            display_name: fullName
          }
        }
      });

      if (error) {
        console.error(`❌ Failed to create user${i}: ${error.message}`);
        errors.push({
          user: `user${i}`,
          email: email,
          error: error.message
        });
      } else {
        console.log(`✅ Successfully created user${i}`);
        results.push({
          user: `user${i}`,
          email: email,
          password: password,
          id: data.user?.id,
          created: true
        });
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (err) {
      console.error(`❌ Error creating user${i}:`, err.message);
      errors.push({
        user: `user${i}`,
        email: email,
        error: err.message
      });
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Successfully created: ${results.length}/10 users`);
  console.log(`Failed: ${errors.length}/10 users`);

  if (results.length > 0) {
    console.log('\n=== SUCCESSFULLY CREATED USERS ===');
    results.forEach(user => {
      console.log(`${user.user}: ${user.email} / ${user.password}`);
    });
  }

  if (errors.length > 0) {
    console.log('\n=== ERRORS ===');
    errors.forEach(error => {
      console.log(`${error.user}: ${error.error}`);
    });
  }

  console.log('\n=== LOGIN CREDENTIALS ===');
  console.log('Username format: user1@timetracker.com');
  console.log('Password format: user1123');
  console.log('(Replace "1" with numbers 1-10)');
}

createTestUsers().catch(console.error);