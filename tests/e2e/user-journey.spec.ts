/**
 * T094: E2E test - Complete user journey
 * Tests the complete user experience from signup to time tracking to export
 */
import { test, expect } from '@playwright/test';

test.describe('Complete User Journey', () => {
  test('should complete full user journey from signup to time tracking', async ({ page }) => {
    // Start from landing page
    await page.goto('/');

    // Verify landing page loads
    await expect(page.locator('h1')).toContainText('Time Tracker');
    await expect(page.locator('text=Start Your Free Trial')).toBeVisible();

    // Navigate to signup
    await page.click('text=Get Started');
    await expect(page).toHaveURL('/signup');

    // Fill signup form
    const testEmail = `test-${Date.now()}@example.com`;
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.fill('input[name="confirm_password"]', 'TestPassword123!');
    await page.fill('input[name="full_name"]', 'Test User');

    // Submit signup
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Welcome')).toBeVisible({ timeout: 10000 });

    // Verify dashboard elements
    await expect(page.locator('[data-testid="clock-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="track-button"]')).toBeVisible();
    await expect(page.locator('text=Tap to Start')).toBeVisible();

    // Start time tracking
    await page.click('[data-testid="track-button"]');

    // Verify tracking started
    await expect(page.locator('text=Clock Out')).toBeVisible();
    await expect(page.locator('[data-testid="session-timer"]')).toBeVisible();

    // Wait a few seconds to accumulate some time
    await page.waitForTimeout(3000);

    // Stop time tracking
    await page.click('[data-testid="track-button"]');

    // Verify tracking stopped
    await expect(page.locator('text=Tap to Start')).toBeVisible();
    await expect(page.locator('[data-testid="session-timer"]')).not.toBeVisible();

    // Check today's summary updated
    await expect(page.locator('[data-testid="total-time"]')).not.toContainText('0h 0m');
    await expect(page.locator('[data-testid="sessions-count"]')).toContainText('1');

    // Navigate to history
    await page.click('text=View History');
    await expect(page).toHaveURL('/dashboard/history');

    // Verify history shows the entry
    await expect(page.locator('[data-testid="time-entry"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="time-entry"]')).toContainText('Test User');

    // Navigate to export
    await page.click('text=Export Report');
    await expect(page).toHaveURL('/dashboard/export');

    // Test export functionality
    await page.selectOption('select[name="format"]', 'csv');
    await page.selectOption('select[name="period"]', 'today');

    // Start download
    const downloadPromise = page.waitForDownload();
    await page.click('button[type="submit"]');
    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toContain('.csv');

    // Navigate to settings
    await page.click('text=Settings');
    await expect(page).toHaveURL('/dashboard/settings');

    // Verify settings page
    await expect(page.locator('text=Profile Settings')).toBeVisible();
    await expect(page.locator('input[name="full_name"]')).toHaveValue('Test User');

    // Update profile
    await page.fill('input[name="full_name"]', 'Updated Test User');
    await page.click('button[type="submit"]');

    // Verify success message
    await expect(page.locator('text=Profile updated successfully')).toBeVisible();

    // Test California toggle if available
    const californiaToggle = page.locator('input[name="california_employee"]');
    if (await californiaToggle.isVisible()) {
      await californiaToggle.check();
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Settings updated')).toBeVisible();
    }
  });

  test('should handle subscription flow', async ({ page }) => {
    // Start from dashboard (assuming user is logged in)
    await page.goto('/dashboard');

    // Navigate to subscription
    await page.click('text=Upgrade');
    await expect(page).toHaveURL('/dashboard/subscription');

    // Verify subscription page
    await expect(page.locator('text=Current Plan')).toBeVisible();
    await expect(page.locator('text=Free Trial')).toBeVisible();

    // Click upgrade button
    await page.click('text=Upgrade to Pro');

    // Should redirect to Stripe (in test mode, this might be mocked)
    // For now, just verify the redirect attempt
    await expect(page.locator('text=Redirecting')).toBeVisible({ timeout: 5000 });
  });

  test('should handle group functionality', async ({ page }) => {
    // Navigate to groups
    await page.goto('/dashboard/groups');

    // Verify groups page
    await expect(page.locator('text=My Groups')).toBeVisible();

    // Create new group
    await page.click('text=Create Group');
    await page.fill('input[name="group_name"]', 'Test Team');
    await page.fill('textarea[name="description"]', 'Test team for E2E testing');
    await page.click('button[type="submit"]');

    // Verify group created
    await expect(page.locator('text=Test Team')).toBeVisible();

    // Test invitation functionality
    await page.click('text=Invite Members');
    await page.fill('input[name="email"]', 'member@example.com');
    await page.click('button[type="submit"]');

    // Verify invitation sent
    await expect(page.locator('text=Invitation sent')).toBeVisible();
  });

  test('should handle habit tracking mode', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');

    // Switch to habit tracking mode
    const modeToggle = page.locator('[data-testid="mode-toggle"]');
    if (await modeToggle.isVisible()) {
      await modeToggle.click();

      // Verify habit tracking mode
      await expect(page.locator('text=Habit Tracker')).toBeVisible();
      await expect(page.locator('[data-testid="habit-list"]')).toBeVisible();

      // Add a habit
      await page.click('text=Add Habit');
      await page.fill('input[name="habit_name"]', 'Daily Exercise');
      await page.fill('input[name="target_value"]', '30');
      await page.selectOption('select[name="unit"]', 'minutes');
      await page.click('button[type="submit"]');

      // Verify habit added
      await expect(page.locator('text=Daily Exercise')).toBeVisible();

      // Mark habit as completed
      await page.click('[data-testid="habit-complete"]');
      await expect(page.locator('[data-testid="habit-completed"]')).toBeVisible();
    }
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Test network error handling
    await page.route('**/api/v1/time-entries', route => route.abort());

    await page.goto('/dashboard');

    // Try to start tracking with network error
    await page.click('[data-testid="track-button"]');

    // Should show error message
    await expect(page.locator('text=Connection error')).toBeVisible({ timeout: 10000 });

    // Test recovery
    await page.unroute('**/api/v1/time-entries');

    // Try again
    await page.click('[data-testid="track-button"]');
    await expect(page.locator('text=Clock Out')).toBeVisible();
  });
});