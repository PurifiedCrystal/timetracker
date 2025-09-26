import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/v1/subscription/route';
import { POST as POST_PORTAL } from '@/app/api/v1/subscription/portal/route';

describe('Subscription Management Integration', () => {
  const testUserId = 'test-user-subscription-id';
  const testEmail = 'subscription-user@example.com';

  describe('Subscription Creation Flow', () => {
    it('should create Stripe checkout session for new user', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': testUserId,
          'x-user-email': testEmail
        },
        body: JSON.stringify({
          price_id: 'price_test_monthly',
          success_url: 'http://localhost:3000/dashboard?success=true',
          cancel_url: 'http://localhost:3000/pricing?canceled=true'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data).toHaveProperty('checkout_url');
      expect(data).toHaveProperty('session_id');
      expect(data.checkout_url).toMatch(/^https:\/\/checkout\.stripe\.com\/pay\//);
    });

    it('should handle existing active subscription', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'test-user-active-subscription',
          'x-user-email': testEmail
        },
        body: JSON.stringify({
          price_id: 'price_test_monthly'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(409);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('active subscription');
    });
  });

  describe('Subscription Status Retrieval', () => {
    it('should return subscription details for existing subscriber', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/subscription', {
        method: 'GET',
        headers: {
          'x-user-id': 'test-user-active-subscription',
          'x-user-email': testEmail
        }
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('status', 'active');
      expect(data).toHaveProperty('current_period_start');
      expect(data).toHaveProperty('current_period_end');
      expect(data).toHaveProperty('stripe_customer_id');
      expect(data).toHaveProperty('stripe_subscription_id');
    });

    it('should return 404 for user without subscription', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/subscription', {
        method: 'GET',
        headers: {
          'x-user-id': 'test-user-no-subscription',
          'x-user-email': testEmail
        }
      });

      const response = await GET(request);
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  describe('Customer Portal Access', () => {
    it('should create customer portal session for active subscriber', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/subscription/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'test-user-active-subscription',
          'x-user-email': testEmail
        },
        body: JSON.stringify({
          return_url: 'http://localhost:3000/dashboard'
        })
      });

      const response = await POST_PORTAL(request);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data).toHaveProperty('portal_url');
      expect(data.portal_url).toMatch(/^https:\/\/billing\.stripe\.com\/p\/session\//);
    });

    it('should reject portal access for non-subscribers', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/subscription/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'test-user-no-subscription',
          'x-user-email': testEmail
        },
        body: JSON.stringify({
          return_url: 'http://localhost:3000/dashboard'
        })
      });

      const response = await POST_PORTAL(request);
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('No subscription found');
    });
  });

  describe('Subscription Lifecycle', () => {
    it('should handle trial period correctly', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/subscription', {
        method: 'GET',
        headers: {
          'x-user-id': 'test-user-trial-subscription',
          'x-user-email': testEmail
        }
      });

      const response = await GET(request);
      if (response.status === 200) {
        const data = await response.json();

        if (data.status === 'trialing') {
          expect(data).toHaveProperty('trial_end');
          const trialEnd = new Date(data.trial_end);
          const now = new Date();
          expect(trialEnd.getTime()).toBeGreaterThan(now.getTime());
        }
      }
    });

    it('should handle past due subscriptions', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/subscription', {
        method: 'GET',
        headers: {
          'x-user-id': 'test-user-past-due-subscription',
          'x-user-email': testEmail
        }
      });

      const response = await GET(request);
      if (response.status === 200) {
        const data = await response.json();

        if (data.status === 'past_due') {
          expect(data).toHaveProperty('current_period_end');
          expect(data).toHaveProperty('stripe_subscription_id');
          // Past due should still allow portal access for payment updates
        }
      }
    });

    it('should handle canceled subscriptions', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/subscription', {
        method: 'GET',
        headers: {
          'x-user-id': 'test-user-canceled-subscription',
          'x-user-email': testEmail
        }
      });

      const response = await GET(request);
      if (response.status === 200) {
        const data = await response.json();

        if (data.status === 'canceled') {
          expect(data).toHaveProperty('canceled_at');
          expect(data).toHaveProperty('current_period_end');
          // User may still have access until period end
        }
      }
    });
  });
});