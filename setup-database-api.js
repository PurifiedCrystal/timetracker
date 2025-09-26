const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  console.log('🚀 Setting up Supabase database via API...');

  const supabaseUrl = 'https://kgwklydkmeihoulipqof.supabase.co';
  const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd2tseWRrbWVpaG91bGlwcW9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODcyODA5OSwiZXhwIjoyMDc0MzA0MDk5fQ.53hDEoxgc6ivlPZ1pZvfyCeWpaS8hQiBq5UhCNzKSPI';

  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('📄 Schema file loaded, executing SQL...');

    // Execute the schema via Supabase REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      },
      body: JSON.stringify({
        sql: schema
      })
    });

    if (!response.ok) {
      // Try alternative approach: split SQL into statements
      console.log('⚡ Trying statement-by-statement execution...');

      const statements = schema
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt && !stmt.startsWith('--'));

      let successCount = 0;
      let errors = [];

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i] + ';';

        try {
          const stmtResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${serviceRoleKey}`,
              'apikey': serviceRoleKey
            },
            body: JSON.stringify({
              sql: statement
            })
          });

          if (stmtResponse.ok) {
            successCount++;
            console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
          } else {
            const error = await stmtResponse.text();
            errors.push(`Statement ${i + 1}: ${error}`);
            console.log(`⚠️ Statement ${i + 1} failed: ${error}`);
          }
        } catch (err) {
          errors.push(`Statement ${i + 1}: ${err.message}`);
          console.log(`❌ Statement ${i + 1} error: ${err.message}`);
        }
      }

      console.log(`📊 Results: ${successCount}/${statements.length} statements executed successfully`);

      if (errors.length > 0) {
        console.log('\n⚠️ Some statements failed:');
        errors.forEach(error => console.log(`  - ${error}`));
      }
    } else {
      console.log('✅ Database schema applied successfully!');
    }

    // Now create the user profile for the test account
    console.log('\n👤 Creating user profile for test account...');

    const profileResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        id: 'c8a6da09-4108-4808-bea6-1a10d8b4c430',
        location_state: 'NY',
        timezone: 'America/New_York',
        export_preferences: {}
      })
    });

    if (profileResponse.ok) {
      const profile = await profileResponse.json();
      console.log('✅ User profile created successfully!');
      console.log(`   User ID: ${profile[0]?.id}`);
      console.log(`   State: ${profile[0]?.location_state}`);
      console.log(`   Timezone: ${profile[0]?.timezone}`);
    } else {
      const error = await profileResponse.text();
      console.log(`⚠️ User profile creation failed: ${error}`);
    }

    // Verify setup by checking tables exist
    console.log('\n🔍 Verifying database setup...');

    const tablesResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?select=count`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Prefer': 'count=exact'
      }
    });

    if (tablesResponse.ok) {
      const countHeader = tablesResponse.headers.get('content-range');
      console.log('✅ Database tables are accessible');
      console.log(`   User profiles table exists with ${countHeader} records`);
    } else {
      console.log('⚠️ Could not verify database tables');
    }

    console.log('\n🎉 Database setup completed!');
    console.log('\n📱 Test Account Ready:');
    console.log('   Email: demo@timetracker.com');
    console.log('   Password: TestDemo123!');
    console.log('   URL: https://timetracker-20250924.netlify.app/login');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();