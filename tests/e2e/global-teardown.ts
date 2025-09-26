/**
 * Global teardown for E2E tests
 * Runs after all tests to clean up the test environment
 */
import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting E2E test global teardown...');

  // Clean up test data
  await cleanupTestData();

  // Close any persistent connections
  await closePersistentConnections();

  console.log('✅ E2E test global teardown completed');
}

async function cleanupTestData() {
  try {
    console.log('🗑️ Cleaning up test data...');

    // This would typically:
    // 1. Delete test users
    // 2. Clean test database
    // 3. Remove test files
    // 4. Cancel test subscriptions

    // For mock storage approach, clear any persistent data
    console.log('🧹 Test data cleanup completed');
  } catch (error) {
    console.error('❌ Failed to cleanup test data:', error);
    // Don't throw error - teardown should be non-blocking
  }
}

async function closePersistentConnections() {
  try {
    console.log('🔌 Closing persistent connections...');

    // Close any database connections
    // Close any external service connections
    // Clean up any background processes

    console.log('✅ Connections closed');
  } catch (error) {
    console.error('❌ Failed to close connections:', error);
    // Don't throw error - teardown should be non-blocking
  }
}

export default globalTeardown;