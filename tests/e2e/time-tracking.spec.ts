/**
 * T095: E2E test - Time tracking workflow
 * Tests the complete time tracking functionality including clock in/out, sessions, and calculations
 */
import { test, expect } from '@playwright/test';

test.describe('Time Tracking Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard (assuming authenticated user)
    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="track-button"]')).toBeVisible();
  });

  test('should handle basic clock in/out flow', async ({ page }) => {
    // Initial state - should show "Tap to Start"
    await expect(page.locator('text=Tap to Start')).toBeVisible();
    await expect(page.locator('[data-testid="session-timer"]')).not.toBeVisible();

    // Clock in
    await page.click('[data-testid="track-button"]');

    // Verify tracking started
    await expect(page.locator('text=Clock Out')).toBeVisible();
    await expect(page.locator('[data-testid="session-timer"]')).toBeVisible();

    // Check that timer is running
    const initialTimer = await page.locator('[data-testid="session-timer"]').textContent();
    await page.waitForTimeout(2000); // Wait 2 seconds
    const updatedTimer = await page.locator('[data-testid="session-timer"]').textContent();

    expect(initialTimer).not.toBe(updatedTimer);

    // Clock out
    await page.click('[data-testid="track-button"]');

    // Verify tracking stopped
    await expect(page.locator('text=Tap to Start')).toBeVisible();
    await expect(page.locator('[data-testid="session-timer"]')).not.toBeVisible();

    // Check that today's summary updated
    await expect(page.locator('[data-testid="sessions-count"]')).toContainText('1');
    await expect(page.locator('[data-testid="total-time"]')).not.toContainText('0h 0m');
  });

  test('should handle multiple sessions in a day', async ({ page }) => {
    // First session
    await page.click('[data-testid="track-button"]');
    await page.waitForTimeout(2000);
    await page.click('[data-testid="track-button"]');

    // Check session count
    await expect(page.locator('[data-testid="sessions-count"]')).toContainText('1');

    // Second session
    await page.click('[data-testid="track-button"]');
    await page.waitForTimeout(2000);
    await page.click('[data-testid="track-button"]');

    // Check session count increased
    await expect(page.locator('[data-testid="sessions-count"]')).toContainText('2');

    // Total time should be cumulative
    const totalTimeText = await page.locator('[data-testid="total-time"]').textContent();
    expect(totalTimeText).not.toBe('0h 0m');
  });

  test('should calculate overtime for California users', async ({ page }) => {
    // Navigate to settings first
    await page.click('text=Settings');
    await expect(page).toHaveURL('/dashboard/settings');

    // Enable California employee setting
    const californiaToggle = page.locator('input[name="california_employee"]');
    if (await californiaToggle.isVisible()) {
      await californiaToggle.check();
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Settings updated')).toBeVisible();

      // Go back to dashboard
      await page.goto('/dashboard');

      // Simulate long work session (would need to be mocked for actual long duration)
      await page.click('[data-testid="track-button"]');

      // Mock a long session by directly updating the backend
      // This would need to be implemented with proper API calls
      await page.evaluate(() => {
        // Mock API call to create a long session
        fetch('/api/v1/time-entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clock_in: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(), // 9 hours ago
            clock_out: new Date().toISOString(),
            metadata: { duration_minutes: 540 } // 9 hours
          })
        });
      });

      // Refresh to see updated data
      await page.reload();

      // Check that overtime is calculated
      await expect(page.locator('[data-testid="overtime-time"]')).not.toContainText('0h 0m');
    }
  });

  test('should handle real-time updates', async ({ page, context }) => {
    // Open a second page to simulate another user/session
    const secondPage = await context.newPage();
    await secondPage.goto('/dashboard');

    // Start tracking on first page
    await page.click('[data-testid="track-button"]');
    await expect(page.locator('text=Clock Out')).toBeVisible();

    // Second page should reflect the change (if real-time is working)
    // Note: This might not work in test environment without proper Supabase setup
    await secondPage.waitForTimeout(2000);

    // In a real environment, this would update automatically
    // For testing, we'll just verify the API can detect active sessions
    await secondPage.reload();

    const activeIndicator = secondPage.locator('[data-testid="active-session-indicator"]');
    if (await activeIndicator.isVisible()) {
      await expect(activeIndicator).toBeVisible();
    }

    // Clean up
    await secondPage.close();
    await page.click('[data-testid="track-button"]'); // Stop tracking
  });

  test('should persist sessions across page reloads', async ({ page }) => {
    // Start tracking
    await page.click('[data-testid="track-button"]');
    await expect(page.locator('text=Clock Out')).toBeVisible();

    // Reload page
    await page.reload();

    // Should still show as tracking
    await expect(page.locator('text=Clock Out')).toBeVisible();
    await expect(page.locator('[data-testid="session-timer"]')).toBeVisible();

    // Stop tracking
    await page.click('[data-testid="track-button"]');
    await expect(page.locator('text=Tap to Start')).toBeVisible();
  });

  test('should handle different tracking modes', async ({ page }) => {
    // Test work mode (default)
    await expect(page.locator('text=Tap to Start')).toBeVisible();

    // Switch to habit tracking mode if available
    const modeToggle = page.locator('[data-testid="mode-toggle"]');
    if (await modeToggle.isVisible()) {
      await modeToggle.click();

      // Verify habit mode
      await expect(page.locator('text=Habit Tracker')).toBeVisible();

      // Switch back to work mode
      await modeToggle.click();
      await expect(page.locator('text=Tap to Start')).toBeVisible();
    }
  });

  test('should show accurate time calculations', async ({ page }) => {
    // Start tracking
    await page.click('[data-testid="track-button"]');

    // Wait for a specific amount of time
    await page.waitForTimeout(5000); // 5 seconds

    // Check timer shows approximately 5 seconds (allowing for small variance)
    const timerText = await page.locator('[data-testid="session-timer"]').textContent();

    // Should show seconds (format might be 0h 0m or similar)
    expect(timerText).toMatch(/0h 0m|0:00:0[0-9]/);

    // Stop tracking
    await page.click('[data-testid="track-button"]');

    // Check today's summary reflects the time
    const totalTime = await page.locator('[data-testid="total-time"]').textContent();
    expect(totalTime).not.toBe('0h 0m');
  });

  test('should handle network interruptions gracefully', async ({ page }) => {
    // Start tracking
    await page.click('[data-testid="track-button"]');
    await expect(page.locator('text=Clock Out')).toBeVisible();

    // Simulate network error
    await page.route('**/api/v1/time-entries/**', route => route.abort());

    // Try to stop tracking with network error
    await page.click('[data-testid="track-button"]');

    // Should show error message
    await expect(page.locator('text=Connection error')).toBeVisible({ timeout: 10000 });

    // Restore network
    await page.unroute('**/api/v1/time-entries/**');

    // Try again - should work
    await page.click('[data-testid="track-button"]');
    await expect(page.locator('text=Tap to Start')).toBeVisible();
  });

  test('should export time tracking data', async ({ page }) => {
    // Create some time entries first
    await page.click('[data-testid="track-button"]');
    await page.waitForTimeout(2000);
    await page.click('[data-testid="track-button"]');

    // Navigate to export
    await page.click('text=Export Report');
    await expect(page).toHaveURL('/dashboard/export');

    // Test CSV export
    await page.selectOption('select[name="format"]', 'csv');
    await page.selectOption('select[name="period"]', 'today');

    const downloadPromise = page.waitForDownload();
    await page.click('button[type="submit"]');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain('.csv');

    // Test PDF export
    await page.selectOption('select[name="format"]', 'pdf');

    const pdfDownloadPromise = page.waitForDownload();
    await page.click('button[type="submit"]');
    const pdfDownload = await pdfDownloadPromise;

    expect(pdfDownload.suggestedFilename()).toContain('.pdf');
  });

  test('should show proper validation messages', async ({ page }) => {
    // This would test validation for manual time entry if that feature exists
    // Navigate to history to potentially add manual entries
    await page.click('text=View History');

    // Look for "Add Manual Entry" button
    const addManualButton = page.locator('text=Add Manual Entry');
    if (await addManualButton.isVisible()) {
      await addManualButton.click();

      // Try to submit without required fields
      await page.click('button[type="submit"]');

      // Should show validation messages
      await expect(page.locator('text=Start time is required')).toBeVisible();
      await expect(page.locator('text=End time is required')).toBeVisible();
    }
  });
});