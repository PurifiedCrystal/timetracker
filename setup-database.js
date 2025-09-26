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
            rawBody: body
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

// Execute SQL on Supabase
async function executeSQL(sql) {
  console.log('🗃️ Executing SQL...');

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

  const sqlData = {
    sql: sql
  };

  try {
    const response = await makeRequest(options, sqlData);
    return response;
  } catch (error) {
    console.error('❌ Error executing SQL:', error.message);
    return null;
  }
}

// Alternative method: Use the edge function endpoint for SQL
async function executeSQLDirect(sql) {
  console.log('🗃️ Executing SQL via direct PostgreSQL connection simulation...');

  // Since we can't directly execute arbitrary SQL via REST API,
  // let's try to create the tables using individual REST calls
  return null;
}

// Check if tables exist
async function checkTablesExist() {
  console.log('🔍 Checking if tables exist...');

  const tablesToCheck = ['user_profiles', 'subscriptions', 'time_entries', 'export_configurations'];
  const results = {};

  for (const table of tablesToCheck) {
    const options = {
      hostname: new URL(SUPABASE_URL).hostname,
      path: `/rest/v1/${table}?limit=0`,
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
  console.log('🚀 Starting database setup check...\n');

  // Check if tables exist
  const tableStatus = await checkTablesExist();

  const missingTables = Object.entries(tableStatus)
    .filter(([table, exists]) => !exists)
    .map(([table]) => table);

  if (missingTables.length === 0) {
    console.log('\n✅ All required tables exist in the database!');
    return true;
  }

  console.log(`\n⚠️  Missing tables: ${missingTables.join(', ')}`);

  const schema = readSchemaFile();
  if (!schema) {
    console.log('❌ Could not read schema.sql file');
    return false;
  }

  console.log('\n📋 Database schema found. To set up the database, you need to:');
  console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/kgwklydkmeihoulipqof');
  console.log('2. Navigate to the SQL Editor');
  console.log('3. Run the following SQL (from database/schema.sql):');
  console.log('\n' + '='.repeat(80));
  console.log(schema);
  console.log('='.repeat(80));

  return false;
}

if (require.main === module) {
  main().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { checkTablesExist, executeSQL };