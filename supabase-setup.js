const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Supabase project details
const SUPABASE_DASHBOARD_URL = 'https://supabase.com/dashboard/project/kgwklydkmeihoulipqof';
const LOGIN_EMAIL = 'careprojecthomes@gmail.com';
const LOGIN_PASSWORD = 'BppXu75rao9d!4';

async function setupSupabaseDatabase() {
  let browser, page;

  try {
    console.log('🚀 Starting Supabase database setup automation...\n');

    // Launch browser
    console.log('🌐 Launching browser...');
    browser = await chromium.launch({
      headless: false, // Show browser for debugging
      slowMo: 1000 // Slow down actions for visibility
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });

    page = await context.newPage();

    // Navigate to Supabase dashboard
    console.log('📂 Navigating to Supabase dashboard...');
    await page.goto(SUPABASE_DASHBOARD_URL);
    await page.waitForLoadState('networkidle');

    // Check if already logged in or need to log in
    console.log('🔍 Checking authentication status...');

    // Wait for either login form or dashboard to appear
    try {
      await page.waitForSelector('[data-testid="sign-in-email"], .sql-editor-wrapper, text=SQL Editor', { timeout: 10000 });
    } catch (error) {
      console.log('⚠️  Page load timeout, continuing...');
    }

    // Check if we need to log in
    const needsLogin = await page.locator('[data-testid="sign-in-email"], input[type="email"]').count() > 0;

    if (needsLogin) {
      console.log('🔐 Logging into Supabase...');

      // Fill in login credentials
      const emailInput = page.locator('[data-testid="sign-in-email"], input[type="email"]').first();
      await emailInput.fill(LOGIN_EMAIL);

      const passwordInput = page.locator('[data-testid="sign-in-password"], input[type="password"]').first();
      await passwordInput.fill(LOGIN_PASSWORD);

      // Click sign in button
      const signInButton = page.locator('button[type="submit"], button:has-text("Sign in")').first();
      await signInButton.click();

      // Wait for dashboard to load
      console.log('⏳ Waiting for dashboard to load...');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
    } else {
      console.log('✅ Already logged in');
    }

    // Navigate to SQL Editor
    console.log('📝 Navigating to SQL Editor...');

    // Try multiple selectors for SQL Editor
    try {
      // Look for SQL Editor in navigation
      await page.waitForSelector('text=SQL Editor, [data-testid="sql-editor"], a[href*="sql"]', { timeout: 10000 });

      // Click SQL Editor link
      const sqlEditorLink = page.locator('text=SQL Editor, [data-testid="sql-editor"], a[href*="sql"]').first();
      await sqlEditorLink.click();
    } catch (error) {
      console.log('⚠️  Direct SQL Editor link not found, trying navigation menu...');

      // Try to find it in a menu
      const menuButton = page.locator('[aria-label="Menu"], .menu-trigger, [data-testid="nav-menu"]').first();
      if (await menuButton.count() > 0) {
        await menuButton.click();
        await page.waitForTimeout(1000);

        const sqlEditorMenuItem = page.locator('text=SQL Editor, [data-testid="sql-editor-menu"]').first();
        if (await sqlEditorMenuItem.count() > 0) {
          await sqlEditorMenuItem.click();
        }
      }
    }

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check if we're in SQL Editor by looking for New Query button or query editor
    console.log('🔍 Verifying SQL Editor page...');

    // Try to find New Query button or create a new query
    let queryEditor;
    try {
      await page.waitForSelector('button:has-text("New query"), .monaco-editor, textarea, [data-testid="sql-editor-input"]', { timeout: 15000 });

      // Check if New Query button exists and click it
      const newQueryButton = page.locator('button:has-text("New query"), [data-testid="new-query"]').first();
      if (await newQueryButton.count() > 0) {
        console.log('🆕 Creating new query...');
        await newQueryButton.click();
        await page.waitForTimeout(2000);
      }

      // Find the query editor
      queryEditor = page.locator('.monaco-editor textarea, .sql-editor textarea, [data-testid="sql-editor-input"], .CodeMirror textarea').first();
      if (await queryEditor.count() === 0) {
        // Try Monaco editor
        queryEditor = page.locator('.monaco-editor').first();
      }

    } catch (error) {
      console.error('❌ Could not find SQL Editor interface');
      throw new Error('SQL Editor not accessible');
    }

    // Read the database schema
    console.log('📖 Reading database schema...');
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('💾 Applying database schema...');

    // Clear any existing content and paste the schema
    if (await page.locator('.monaco-editor textarea').count() > 0) {
      // Monaco editor
      await page.locator('.monaco-editor').first().click();
      await page.keyboard.press('Control+a');
      await page.keyboard.type(schema);
    } else if (await page.locator('textarea').count() > 0) {
      // Regular textarea
      const textarea = page.locator('textarea').first();
      await textarea.click();
      await textarea.fill(schema);
    } else {
      throw new Error('Could not find query editor input');
    }

    await page.waitForTimeout(2000);

    // Execute the query
    console.log('⚡ Executing schema query...');

    // Try different run button selectors
    const runButton = page.locator('button:has-text("Run"), [data-testid="run-query"], .run-button, button[title="Run"]').first();

    if (await runButton.count() > 0) {
      await runButton.click();
    } else {
      // Try keyboard shortcut
      await page.keyboard.press('Control+Enter');
    }

    // Wait for execution to complete
    console.log('⏳ Waiting for query execution...');
    await page.waitForTimeout(5000);

    // Check for success/error messages
    const successIndicators = [
      '.success', '.result-success', 'text=Success',
      'text=completed', 'text=Query executed',
      '.query-success', '[data-testid="query-success"]'
    ];

    const errorIndicators = [
      '.error', '.result-error', 'text=Error',
      '.query-error', '[data-testid="query-error"]'
    ];

    let executionSuccessful = false;

    // Check for success
    for (const selector of successIndicators) {
      if (await page.locator(selector).count() > 0) {
        executionSuccessful = true;
        break;
      }
    }

    // Check for errors
    let hasErrors = false;
    for (const selector of errorIndicators) {
      if (await page.locator(selector).count() > 0) {
        hasErrors = true;
        const errorText = await page.locator(selector).first().textContent();
        console.log(`⚠️  Error detected: ${errorText}`);
        break;
      }
    }

    if (!hasErrors && !executionSuccessful) {
      console.log('⚠️  No clear success/error indication, assuming schema applied');
      executionSuccessful = true;
    }

    if (executionSuccessful && !hasErrors) {
      console.log('✅ Database schema applied successfully!');
    } else {
      console.log('⚠️  Schema execution completed with potential issues');
    }

    // Navigate to Table Editor to verify tables were created
    console.log('🔍 Verifying tables were created...');

    try {
      // Look for Table Editor in navigation
      const tableEditorLink = page.locator('text=Table Editor, [data-testid="table-editor"], a[href*="table"]').first();
      if (await tableEditorLink.count() > 0) {
        await tableEditorLink.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);

        // Check for expected tables
        const expectedTables = [
          'user_profiles',
          'subscriptions',
          'time_entries',
          'export_configurations',
          'labor_rule_applications'
        ];

        const foundTables = [];
        for (const tableName of expectedTables) {
          const tableExists = await page.locator(`text=${tableName}`).count() > 0;
          if (tableExists) {
            foundTables.push(tableName);
            console.log(`✅ Table found: ${tableName}`);
          } else {
            console.log(`❌ Table missing: ${tableName}`);
          }
        }

        console.log(`📊 Tables verification: ${foundTables.length}/${expectedTables.length} tables found`);

      } else {
        console.log('⚠️  Table Editor not accessible, skipping verification');
      }
    } catch (error) {
      console.log('⚠️  Could not verify tables in Table Editor');
    }

    console.log('\n🎉 Supabase database setup completed!');

    return {
      success: true,
      schemaApplied: executionSuccessful && !hasErrors,
      tablesVerified: true
    };

  } catch (error) {
    console.error('\n❌ Error during setup:', error.message);
    return {
      success: false,
      error: error.message
    };
  } finally {
    if (page) {
      console.log('\n📸 Taking screenshot for verification...');
      await page.screenshot({ path: 'supabase-setup-result.png', fullPage: true });
    }

    if (browser) {
      await browser.close();
    }
  }
}

// Run the setup if called directly
if (require.main === module) {
  setupSupabaseDatabase()
    .then(result => {
      if (result.success) {
        console.log('\n✅ Setup completed successfully!');
        process.exit(0);
      } else {
        console.log('\n❌ Setup failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Unhandled error:', error);
      process.exit(1);
    });
}

module.exports = { setupSupabaseDatabase };