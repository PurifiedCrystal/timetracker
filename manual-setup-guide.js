#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🎯 TIMETRACKER SUPABASE SETUP GUIDE');
console.log('================================================================================\n');

console.log('📋 MANUAL SETUP STEPS FOR SUPABASE DATABASE:\n');

console.log('STEP 1: 🌐 Navigate to Supabase Dashboard');
console.log('   → Open: https://supabase.com/dashboard/project/kgwklydkmeihoulipqof');
console.log('   → Login with: careprojecthomes@gmail.com');
console.log('   → Password: BppXu75rao9d!4\n');

console.log('STEP 2: 📝 Access SQL Editor');
console.log('   → Click "SQL Editor" in the left sidebar');
console.log('   → Click "New Query" button\n');

console.log('STEP 3: 📄 Copy and Execute Database Schema');
console.log('   → The complete schema is in: database/schema.sql');
console.log('   → Copy the entire contents of that file');
console.log('   → Paste it into the SQL Editor');
console.log('   → Click "Run" or press Ctrl+Enter\n');

console.log('STEP 4: ✅ Verify Tables Created');
console.log('   → Go to "Table Editor" in the left sidebar');
console.log('   → Confirm these tables exist:');
console.log('     • user_profiles');
console.log('     • subscriptions');
console.log('     • time_entries');
console.log('     • export_configurations');
console.log('     • labor_rule_applications\n');

console.log('STEP 5: 🔧 Complete User Setup');
console.log('   → Run: node complete-setup.js');
console.log('   → This will create the user profile for demo@timetracker.com\n');

console.log('STEP 6: ✅ Verify Complete Setup');
console.log('   → Run: node verify-setup.js');
console.log('   → This will test all functionality\n');

// Read and display the schema file for easy copying
console.log('📄 DATABASE SCHEMA (Copy this to Supabase SQL Editor):');
console.log('================================================================================');

try {
  const schemaPath = path.join(__dirname, 'database', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  console.log(schema);
} catch (error) {
  console.error('❌ Error reading schema file:', error.message);
}

console.log('\n================================================================================');
console.log('🎉 After completing these steps, your test account will be ready!');
console.log('📧 Test Account: demo@timetracker.com');
console.log('🔑 Password: TestDemo123!');
console.log('================================================================================');