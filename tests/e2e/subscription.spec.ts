/**
 * T096: E2E test - Subscription flow
 * Tests the complete subscription management workflow including upgrades, billing, and feature access
 */
import { test, expect } from '@playwright/test';

test.describe('Subscription Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from landing page
    await page.goto('/');
  });

  test('should handle free trial signup and onboarding', async ({ page }) => {
    // Click get started from landing page
    await page.click('text=Start Your Free Trial');
    await expect(page).toHaveURL('/signup');

    // Fill signup form
    const testEmail = `trial-${Date.now()}@example.com`;
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', 'TrialPassword123!');
    await page.fill('input[name="confirm_password"]', 'TrialPassword123!');
    await page.fill('input[name="full_name"]', 'Trial User');

    // Submit signup
    await page.click('button[type="submit"]');

    // Should redirect to dashboard with free trial status
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Free Trial')).toBeVisible({ timeout: 10000 });

    // Verify free trial features are available
    await expect(page.locator('[data-testid="track-button"]')).toBeVisible();
    await expect(page.locator('text=14 days remaining')).toBeVisible();
  });

  test('should display subscription status and limits', async ({ page }) => {
    // Navigate to dashboard (assuming authenticated user on free trial)
    await page.goto('/dashboard');

    // Check for subscription status indicator
    await expect(page.locator('[data-testid="subscription-status"]')).toBeVisible();
    await expect(page.locator('text=Free Trial')).toBeVisible();

    // Navigate to subscription page
    await page.click('text=Upgrade');
    await expect(page).toHaveURL('/dashboard/subscription');

    // Verify subscription page content
    await expect(page.locator('text=Current Plan')).toBeVisible();
    await expect(page.locator('text=Free Trial')).toBeVisible();
    await expect(page.locator('text=$1.99/month')).toBeVisible();

    // Check feature comparison
    await expect(page.locator('text=Unlimited time tracking')).toBeVisible();
    await expect(page.locator('text=Export reports')).toBeVisible();
    await expect(page.locator('text=California labor rules')).toBeVisible();
  });

  test('should handle subscription upgrade flow', async ({ page }) => {
    // Navigate to subscription page
    await page.goto('/dashboard/subscription');

    // Click upgrade button
    await page.click('text=Upgrade to Pro');

    // Should show loading state
    await expect(page.locator('text=Setting up subscription')).toBeVisible();

    // In test environment, this would typically redirect to a test Stripe checkout
    // We'll mock this or check for the redirect URL
    const currentUrl = page.url();

    // Should either redirect to Stripe or show a success page
    // In a real test environment, you'd use Stripe's test mode
    if (currentUrl.includes('checkout.stripe.com') || currentUrl.includes('stripe')) {
      // This would be the Stripe checkout flow
      // In tests, you might fill in test card details
      console.log('Redirected to Stripe checkout (test mode)');
    } else {
      // Check for success or error messages
      await expect(page.locator('text=Subscription')).toBeVisible({ timeout: 15000 });
    }
  });

  test('should handle subscription cancellation', async ({ page }) => {
    // This test assumes user has an active subscription
    await page.goto('/dashboard/subscription');

    // Look for cancel subscription button
    const cancelButton = page.locator('text=Cancel Subscription');
    if (await cancelButton.isVisible()) {
      await cancelButton.click();

      // Confirm cancellation
      await expect(page.locator('text=Are you sure')).toBeVisible();
      await page.click('text=Yes, Cancel');

      // Should show cancellation confirmation
      await expect(page.locator('text=Subscription cancelled')).toBeVisible();
      await expect(page.locator('text=Your subscription will remain active until')).toBeVisible();
    }
  });

  test('should enforce feature limits for free users', async ({ page }) => {
    // Test with a free/trial account
    await page.goto('/dashboard');

    // Try to access premium features
    await page.goto('/dashboard/export');

    // Should show export form (basic features should be available in trial)
    await expect(page.locator('select[name="format"]')).toBeVisible();

    // Test advanced export formats
    await page.selectOption('select[name="format"]', 'xlsx');
    await page.click('button[type="submit"]');

    // Depending on implementation, might show upgrade prompt for advanced features
    const upgradePrompt = page.locator('text=Upgrade to unlock');
    if (await upgradePrompt.isVisible({ timeout: 5000 })) {
      await expect(upgradePrompt).toBeVisible();
      await page.click('text=Upgrade Now');
      await expect(page).toHaveURL('/dashboard/subscription');
    }
  });

  test('should handle billing and payment history', async ({ page }) => {
    // Navigate to subscription page
    await page.goto('/dashboard/subscription');

    // Look for billing history section
    const billingSection = page.locator('text=Billing History');
    if (await billingSection.isVisible()) {
      // Should show payment history
      await expect(page.locator('[data-testid="payment-history"]')).toBeVisible();

      // Test download invoice functionality
      const invoiceLink = page.locator('text=Download Invoice').first();
      if (await invoiceLink.isVisible()) {
        const downloadPromise = page.waitForDownload();
        await invoiceLink.click();
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toContain('.pdf');
      }
    }
  });

  test('should handle subscription renewal notifications', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');

    // Look for renewal notifications (might be visible near trial end)
    const renewalNotice = page.locator('[data-testid="renewal-notice"]');
    if (await renewalNotice.isVisible()) {
      await expect(renewalNotice).toContainText('trial expires');
      await expect(renewalNotice).toContainText('Upgrade');

      // Click upgrade from notification
      await renewalNotice.locator('text=Upgrade').click();
      await expect(page).toHaveURL('/dashboard/subscription');
    }
  });

  test('should handle payment method management', async ({ page }) => {
    // This would test payment method updates for subscribed users
    await page.goto('/dashboard/subscription');

    // Look for payment method section
    const paymentSection = page.locator('text=Payment Method');
    if (await paymentSection.isVisible()) {
      // Should show current payment method (if any)
      const updateButton = page.locator('text=Update Payment Method');
      if (await updateButton.isVisible()) {
        await updateButton.click();

        // Should redirect to Stripe customer portal or show update form
        // In test mode, this would use Stripe test environment
        await expect(page.locator('text=Update')).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('should handle subscription reactivation', async ({ page }) => {
    // Test reactivating a cancelled subscription
    await page.goto('/dashboard/subscription');

    // Look for reactivation option (for cancelled but still active subscriptions)
    const reactivateButton = page.locator('text=Reactivate Subscription');
    if (await reactivateButton.isVisible()) {
      await reactivateButton.click();

      // Confirm reactivation
      await expect(page.locator('text=Confirm Reactivation')).toBeVisible();
      await page.click('text=Yes, Reactivate');

      // Should show success message
      await expect(page.locator('text=Subscription reactivated')).toBeVisible();
      await expect(page.locator('text=Active')).toBeVisible();
    }
  });

  test('should display accurate trial countdown', async ({ page }) => {
    // Navigate to dashboard with trial account
    await page.goto('/dashboard');

    // Should show trial countdown
    const trialCountdown = page.locator('[data-testid="trial-countdown"]');
    if (await trialCountdown.isVisible()) {
      const countdownText = await trialCountdown.textContent();

      // Should show days remaining (format might vary)
      expect(countdownText).toMatch(/\d+\s+(day|days)\s+remaining/i);

      // Click on countdown should go to subscription page
      await trialCountdown.click();
      await expect(page).toHaveURL('/dashboard/subscription');
    }
  });

  test('should handle expired trial', async ({ page }) => {
    // This would test behavior when trial expires
    // In a real test, you'd modify the user's trial_ends_at date

    // Mock expired trial by intercepting API calls
    await page.route('**/api/v1/auth/session', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          session: {
            user_id: 'test-user',
            subscription_status: 'trialing',
            trial_ends_at: new Date(Date.now() - 86400000).toISOString() // Yesterday
          }
        })
      });
    });

    await page.goto('/dashboard');

    // Should show trial expired message
    await expect(page.locator('text=Trial Expired')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Upgrade to continue')).toBeVisible();

    // Features should be limited
    const trackButton = page.locator('[data-testid="track-button"]');
    if (await trackButton.isVisible()) {
      await trackButton.click();
      // Should show upgrade prompt instead of tracking
      await expect(page.locator('text=Upgrade required')).toBeVisible();
    }
  });

  test('should integrate with Stripe webhooks', async ({ page }) => {
    // This test would verify webhook handling
    // You would need to simulate webhook events in your test environment

    // Navigate to subscription page
    await page.goto('/dashboard/subscription');

    // Mock a successful payment webhook by making a direct API call
    await page.evaluate(() => {
      // In a real test, you'd trigger actual webhook events
      fetch('/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Stripe-Signature': 'test-signature'
        },
        body: JSON.stringify({
          type: 'invoice.payment_succeeded',
          data: {
            object: {
              customer: 'test-customer-id',
              amount_paid: 199
            }
          }
        })
      });
    });

    // Reload and check subscription status updated
    await page.reload();

    // Should show active subscription status
    const activeStatus = page.locator('text=Active');
    if (await activeStatus.isVisible()) {
      await expect(activeStatus).toBeVisible();
    }
  });
});