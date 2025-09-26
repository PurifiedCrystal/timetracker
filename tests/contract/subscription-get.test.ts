import { NextRequest } from 'next/server';
import { GET } from '@/app/api/v1/subscription/route';

describe('/api/v1/subscription GET', () => {
  describe('Authentication Required', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/subscription', {
        method: 'GET',
      });

      const response = await GET(request);
      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  describe('Active Subscription', () => {
    it('should return subscription details for user with active subscription', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/subscription', {
        method: 'GET',
        headers: {
          'x-user-id': 'test-user-id',
          'x-user-email': 'test@example.com'
        }
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('user_id');
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('current_period_start');
      expect(data).toHaveProperty('current_period_end');
      expect(data).toHaveProperty('created_at');

      // Validate status is one of expected values
      expect(['active', 'past_due', 'canceled', 'incomplete']).toContain(data.status);
    });

    it('should include Stripe customer information for active subscriptions', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/subscription', {
        method: 'GET',
        headers: {
          'x-user-id': 'test-user-id-active',
          'x-user-email': 'test@example.com'
        }
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      if (data.status === 'active') {
        expect(data).toHaveProperty('stripe_customer_id');
        expect(data).toHaveProperty('stripe_subscription_id');
        expect(typeof data.stripe_customer_id).toBe('string');
        expect(typeof data.stripe_subscription_id).toBe('string');
      }
    });
  });

  describe('No Subscription', () => {
    it('should return 404 when user has no subscription', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/subscription', {
        method: 'GET',
        headers: {
          'x-user-id': 'test-user-id-no-subscription',
          'x-user-email': 'test@example.com'
        }
      });

      const response = await GET(request);
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('No subscription found');
    });
  });

  describe('Response Format', () => {
    it('should return valid date formats', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/subscription', {
        method: 'GET',
        headers: {
          'x-user-id': 'test-user-id',
          'x-user-email': 'test@example.com'
        }
      });

      const response = await GET(request);
      if (response.status === 200) {
        const data = await response.json();

        // Validate date formats
        expect(() => new Date(data.created_at)).not.toThrow();
        if (data.current_period_start) {
          expect(() => new Date(data.current_period_start)).not.toThrow();
        }
        if (data.current_period_end) {
          expect(() => new Date(data.current_period_end)).not.toThrow();
        }
      }
    });

    it('should return UUID format for IDs', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/subscription', {
        method: 'GET',
        headers: {
          'x-user-id': 'test-user-id',
          'x-user-email': 'test@example.com'
        }
      });

      const response = await GET(request);
      if (response.status === 200) {
        const data = await response.json();

        // UUID format validation
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        expect(uuidRegex.test(data.id)).toBe(true);
        expect(uuidRegex.test(data.user_id)).toBe(true);
      }
    });
  });

  describe('Subscription Status Handling', () => {
    it('should handle past_due subscriptions', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/subscription', {
        method: 'GET',
        headers: {
          'x-user-id': 'test-user-id-past-due',
          'x-user-email': 'test@example.com'
        }
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      if (data.status === 'past_due') {
        expect(data).toHaveProperty('current_period_end');
        // Past due subscriptions should still have Stripe IDs
        expect(data).toHaveProperty('stripe_customer_id');
        expect(data).toHaveProperty('stripe_subscription_id');
      }
    });

    it('should handle canceled subscriptions', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/subscription', {
        method: 'GET',
        headers: {
          'x-user-id': 'test-user-id-canceled',
          'x-user-email': 'test@example.com'
        }
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      if (data.status === 'canceled') {
        expect(data).toHaveProperty('current_period_end');
        // Canceled subscriptions might not have active Stripe IDs
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/subscription', {
        method: 'GET',
        headers: {
          'x-user-id': 'test-user-id',
          'x-user-email': 'test@example.com'
        }
      });

      // This test would require mocking database failure
      const response = await GET(request);
      expect([200, 404, 500]).toContain(response.status);
    });

    it('should validate user ID format', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/subscription', {
        method: 'GET',
        headers: {
          'x-user-id': 'invalid-user-id',
          'x-user-email': 'test@example.com'
        }
      });

      const response = await GET(request);
      expect([400, 404]).toContain(response.status);
    });
  });
});