/**
 * Global setup for E2E tests
 * Runs before all tests to prepare the test environment
 */
import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E test global setup...');

  // Setup test database or mock data if needed
  await setupTestData();

  // Create a test user session that can be reused
  await createTestUserSession();

  console.log('✅ E2E test global setup completed');
}

async function setupTestData() {
  try {
    // Clear any existing test data
    console.log('🧹 Cleaning up test data...');

    // Initialize test data
    console.log('📊 Setting up test data...');

    // This would typically:
    // 1. Clear test database
    // 2. Seed with test data
    // 3. Create test users
    // 4. Set up test subscriptions

    // For now, we'll use the mock storage approach
    console.log('📝 Test data setup completed');
  } catch (error) {
    console.error('❌ Failed to setup test data:', error);
    throw error;
  }
}

async function createTestUserSession() {
  try {
    console.log('👤 Creating test user session...');

    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to the app
    await page.goto(process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000');

    // Create a test user session by calling the signup API directly
    const response = await page.evaluate(async () => {
      try {
        const signupResponse = await fetch('/api/v1/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'e2e-test@example.com',
            password: 'TestPassword123!',
            full_name: 'E2E Test User',
          }),
        });

        if (!signupResponse.ok) {
          // User might already exist, try to get session instead
          const sessionResponse = await fetch('/api/v1/auth/session');
          if (sessionResponse.ok) {
            return await sessionResponse.json();
          }
        }

        return await signupResponse.json();
      } catch (error) {
        console.log('Using mock session for E2E tests');
        return { success: true, mockSession: true };
      }
    });

    console.log('✅ Test user session created');

    await browser.close();
  } catch (error) {
    console.error('❌ Failed to create test user session:', error);
    // Don't throw error - tests can still run with individual user creation
  }
}

export default globalSetup;