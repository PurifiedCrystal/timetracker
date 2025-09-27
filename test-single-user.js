const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kgwklydkmeihoulipqof.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd2tseWRrbWVpaG91bGlwcW9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MjgwOTksImV4cCI6MjA3NDMwNDA5OX0.SVsGhRHEcRCArfKYwHbw2tWDfoF1JG8kaUm1cIgIOB4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCreateUser() {
  console.log('Testing user creation...\n');

  try {
    const { data, error } = await supabase.auth.signUp({
      email: 'testuser@timetracker.com',
      password: 'testuser123',
      options: {
        data: {
          full_name: 'Test User',
          display_name: 'Test User'
        }
      }
    });

    if (error) {
      console.error('❌ Error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Success!');
      console.log('User data:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

testCreateUser();