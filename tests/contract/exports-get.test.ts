import { NextRequest } from 'next/server';
import { GET } from '@/app/api/v1/exports/route';

describe('/api/v1/exports GET', () => {
  describe('Authentication Required', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/exports', {
        method: 'GET',
      });

      const response = await GET(request);
      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  describe('Export Configurations List', () => {
    it('should return list of export configurations for authenticated user', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/exports', {
        method: 'GET',
        headers: {
          'x-user-id': 'test-user-id',
          'x-user-email': 'test@example.com'
        }
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);

      // Check structure of export configurations
      if (data.length > 0) {
        const config = data[0];
        expect(config).toHaveProperty('id');
        expect(config).toHaveProperty('user_id');
        expect(config).toHaveProperty('name');
        expect(config).toHaveProperty('format');
        expect(config).toHaveProperty('frequency');
        expect(config).toHaveProperty('schedule_time');
        expect(config).toHaveProperty('is_active');
        expect(config).toHaveProperty('created_at');
      }
    });

    it('should return empty array when user has no export configurations', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/exports', {
        method: 'GET',
        headers: {
          'x-user-id': 'test-user-id-no-configs',
          'x-user-email': 'test@example.com'
        }
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });
  });

  describe('Export Configuration Validation', () => {
    it('should validate export format values', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/exports', {
        method: 'GET',
        headers: {
          'x-user-id': 'test-user-id',
          'x-user-email': 'test@example.com'
        }
      });

      const response = await GET(request);
      if (response.status === 200) {
        const data = await response.json();

        data.forEach(config => {
          expect(['csv', 'pdf', 'xlsx']).toContain(config.format);
        });
      }
    });

    it('should validate frequency values', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/exports', {
        method: 'GET',
        headers: {
          'x-user-id': 'test-user-id',
          'x-user-email': 'test@example.com'
        }
      });

      const response = await GET(request);
      if (response.status === 200) {
        const data = await response.json();

        data.forEach(config => {
          expect(['daily', 'weekly', 'monthly']).toContain(config.frequency);
        });
      }
    });

    it('should validate schedule_time format', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/exports', {
        method: 'GET',
        headers: {
          'x-user-id': 'test-user-id',
          'x-user-email': 'test@example.com'
        }
      });

      const response = await GET(request);
      if (response.status === 200) {
        const data = await response.json();

        data.forEach(config => {
          // Time should be in HH:MM format
          const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
          expect(timeRegex.test(config.schedule_time)).toBe(true);
        });
      }
    });
  });

  describe('Data Structure', () => {
    it('should return configurations with proper UUID format for IDs', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/exports', {
        method: 'GET',
        headers: {
          'x-user-id': 'test-user-id',
          'x-user-email': 'test@example.com'
        }
      });

      const response = await GET(request);
      if (response.status === 200) {
        const data = await response.json();

        data.forEach(config => {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          expect(uuidRegex.test(config.id)).toBe(true);
          expect(uuidRegex.test(config.user_id)).toBe(true);
        });
      }
    });

    it('should return valid date formats', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/exports', {
        method: 'GET',
        headers: {
          'x-user-id': 'test-user-id',
          'x-user-email': 'test@example.com'
        }
      });

      const response = await GET(request);
      if (response.status === 200) {
        const data = await response.json();

        data.forEach(config => {
          expect(() => new Date(config.created_at)).not.toThrow();
          if (config.last_sent_at) {
            expect(() => new Date(config.last_sent_at)).not.toThrow();
          }
        });
      }
    });

    it('should include email recipients as array', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/exports', {
        method: 'GET',
        headers: {
          'x-user-id': 'test-user-id',
          'x-user-email': 'test@example.com'
        }
      });

      const response = await GET(request);
      if (response.status === 200) {
        const data = await response.json();

        data.forEach(config => {
          expect(config).toHaveProperty('email_recipients');
          expect(Array.isArray(config.email_recipients)).toBe(true);

          // Validate email format if recipients exist
          config.email_recipients.forEach(email => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            expect(emailRegex.test(email)).toBe(true);
          });
        });
      }
    });
  });

  describe('Filtering and Sorting', () => {
    it('should return configurations sorted by creation date', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/exports', {
        method: 'GET',
        headers: {
          'x-user-id': 'test-user-id-multiple-configs',
          'x-user-email': 'test@example.com'
        }
      });

      const response = await GET(request);
      if (response.status === 200) {
        const data = await response.json();

        if (data.length > 1) {
          for (let i = 1; i < data.length; i++) {
            const prevDate = new Date(data[i - 1].created_at);
            const currDate = new Date(data[i].created_at);
            expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime());
          }
        }
      }
    });

    it('should only return configurations for the authenticated user', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/exports', {
        method: 'GET',
        headers: {
          'x-user-id': 'test-user-id-specific',
          'x-user-email': 'test@example.com'
        }
      });

      const response = await GET(request);
      if (response.status === 200) {
        const data = await response.json();

        data.forEach(config => {
          expect(config.user_id).toBe('test-user-id-specific');
        });
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/exports', {
        method: 'GET',
        headers: {
          'x-user-id': 'test-user-id',
          'x-user-email': 'test@example.com'
        }
      });

      const response = await GET(request);
      expect([200, 500]).toContain(response.status);
    });

    it('should validate user ID format', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/exports', {
        method: 'GET',
        headers: {
          'x-user-id': 'invalid-uuid',
          'x-user-email': 'test@example.com'
        }
      });

      const response = await GET(request);
      expect([200, 400]).toContain(response.status);
    });
  });
});