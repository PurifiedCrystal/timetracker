#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const SUPABASE_URL = 'https://kgwklydkmeihoulipqof.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd2tseWRrbWVpaG91bGlwcW9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODcyODA5OSwiZXhwIjoyMDc0MzA0MDk5fQ.53hDEoxgc6ivlPZ1pZvfyCeWpaS8hQiBq5UhCNzKSPI';

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
            data: body ? JSON.parse(body) : null,
            rawBody: body,
            headers: res.headers
          };
          resolve(response);
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: body,
            rawBody: body,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

// Execute SQL using the database API
async function executeSQL(sql) {
  console.log('🗃️ Executing SQL via database API...');

  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`   Found ${statements.length} SQL statements to execute`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (!statement) continue;

    console.log(`   Executing statement ${i + 1}/${statements.length}...`);

    try {
      const response = await executeSingleSQL(statement + ';');
      if (response.success) {
        successCount++;
        console.log(`   ✅ Statement ${i + 1} executed successfully`);
      } else {
        errorCount++;
        console.log(`   ❌ Statement ${i + 1} failed: ${response.error}`);

        // Some errors we can ignore (like "already exists" errors)
        if (response.error.includes('already exists') ||
            response.error.includes('already defined') ||
            response.error.includes('duplicate')) {
          console.log(`   ⚠️  Ignoring "already exists" error for statement ${i + 1}`);
          successCount++;
          errorCount--;
        }
      }
    } catch (error) {
      errorCount++;
      console.log(`   ❌ Statement ${i + 1} error: ${error.message}`);
    }

    // Small delay between statements
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n📊 Execution Summary:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
  console.log(`   📝 Total: ${statements.length}`);

  return { successCount, errorCount, total: statements.length };
}

// Execute a single SQL statement
async function executeSingleSQL(sql) {
  const options = {
    hostname: new URL(SUPABASE_URL).hostname,
    path: '/rest/v1/rpc/exec_sql',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY
    }
  };

  try {
    const response = await makeRequest(options, { query: sql });

    if (response.statusCode === 200 || response.statusCode === 201) {
      return { success: true, data: response.data };
    } else {
      return {
        success: false,
        error: response.data?.message || response.rawBody || `HTTP ${response.statusCode}`
      };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Alternative: Use the database query API
async function executeSQLQuery(sql) {
  console.log('🔄 Trying alternative SQL execution method...');

  // Clean up the SQL - remove comments and empty lines
  const cleanSQL = sql
    .split('\n')
    .filter(line => {
      const trimmed = line.trim();
      return trimmed.length > 0 && !trimmed.startsWith('--');
    })
    .join('\n');

  const url = new URL('/database/query', SUPABASE_URL);

  const options = {
    hostname: url.hostname,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY
    }
  };

  const payload = {
    query: cleanSQL
  };

  try {
    const response = await makeRequest(options, payload);
    console.log(`Response status: ${response.statusCode}`);
    console.log(`Response body: ${response.rawBody}`);
    return response;
  } catch (error) {
    console.error('❌ Error with query API:', error.message);
    return null;
  }
}

// Read schema file
function readSchemaFile() {
  const schemaPath = path.join(__dirname, 'database', 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    return fs.readFileSync(schemaPath, 'utf8');
  }
  return null;
}

// Main function
async function main() {
  console.log('🚀 Applying database schema to Supabase...\n');

  const schema = readSchemaFile();
  if (!schema) {
    console.log('❌ Could not read database/schema.sql file');
    return false;
  }

  console.log('📋 Schema file loaded successfully');

  // Try different methods to execute the SQL
  console.log('\n🔧 Method 1: Using RPC exec_sql...');
  const result1 = await executeSQL(schema);

  if (result1.successCount === 0) {
    console.log('\n🔧 Method 2: Using database query API...');
    const result2 = await executeSQLQuery(schema);

    if (!result2 || result2.statusCode !== 200) {
      console.log('\n❌ Both methods failed. You may need to apply the schema manually.');
      console.log('\n📋 Manual Instructions:');
      console.log('1. Go to: https://supabase.com/dashboard/project/kgwklydkmeihoulipqof');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy and paste the contents of database/schema.sql');
      console.log('4. Execute the SQL');
      return false;
    }
  }

  console.log('\n✅ Database schema application completed!');
  return true;
}

if (require.main === module) {
  main().then(success => {
    if (success) {
      console.log('\n🎉 Ready to create test account!');
    }
    process.exit(success ? 0 : 1);
  });
}

module.exports = { executeSQL, executeSingleSQL };