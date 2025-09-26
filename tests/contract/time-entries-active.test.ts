import { NextRequest } from 'next/server';
import { GET } from '@/app/api/v1/time-entries/active/route';

describe('/api/v1/time-entries/active GET', () => {
  describe('Authentication Required', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/time-entries/active', {
        method: 'GET',
      });

      const response = await GET(request);
      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  describe('Active Session Present', () => {
    it('should return active session when user is clocked in', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/time-entries/active', {
        method: 'GET',
        headers: {
          'x-user-id': 'test-user-id',
          'x-user-email': 'test@example.com'
        }
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('entry');
      expect(data).toHaveProperty('is_clocked_in');
      expect(data).toHaveProperty('current_duration');

      if (data.is_clocked_in) {
        expect(data.entry).toHaveProperty('id');
        expect(data.entry).toHaveProperty('clock_in');
        expect(data.entry.clock_out).toBeNull();
        expect(typeof data.current_duration).toBe('number');
        expect(data.current_duration).toBeGreaterThanOrEqual(0);
      }
    });

    it('should calculate current duration correctly', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/time-entries/active', {
        method: 'GET',
        headers: {
          'x-user-id': 'test-user-id',
          'x-user-email': 'test@example.com'
        }
      });

      const response = await GET(request);
      const data = await response.json();

      if (data.is_clocked_in && data.entry) {
        const clockInTime = new Date(data.entry.clock_in);
        const now = new Date();
        const expectedDuration = Math.floor((now.getTime() - clockInTime.getTime()) / (1000 * 60));

        // Allow for small timing differences in test execution
        expect(Math.abs(data.current_duration - expectedDuration)).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('No Active Session', () => {
    it('should return null entry when user is not clocked in', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/time-entries/active', {
        method: 'GET',
        headers: {
          'x-user-id': 'test-user-id-no-session',
          'x-user-email': 'test@example.com'
        }
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.entry).toBeNull();
      expect(data.is_clocked_in).toBe(false);
      expect(data.current_duration).toBe(0);
    });
  });

  describe('Response Format', () => {
    it('should return consistent response structure', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/time-entries/active', {
        method: 'GET',
        headers: {
          'x-user-id': 'test-user-id',
          'x-user-email': 'test@example.com'
        }
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('entry');
      expect(data).toHaveProperty('is_clocked_in');
      expect(data).toHaveProperty('current_duration');
      expect(typeof data.is_clocked_in).toBe('boolean');
      expect(typeof data.current_duration).toBe('number');
    });
  });

  describe('Edge Cases', () => {
    it('should handle corrupted active sessions', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/time-entries/active', {
        method: 'GET',
        headers: {
          'x-user-id': 'test-user-id-corrupted-session',
          'x-user-email': 'test@example.com'
        }
      });

      const response = await GET(request);
      expect([200, 500]).toContain(response.status);

      if (response.status === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('entry');
        expect(data).toHaveProperty('is_clocked_in');
        expect(data).toHaveProperty('current_duration');
      }
    });

    it('should handle database connection issues', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/time-entries/active', {
        method: 'GET',
        headers: {
          'x-user-id': 'test-user-id',
          'x-user-email': 'test@example.com'
        }
      });

      const response = await GET(request);
      expect([200, 500]).toContain(response.status);
    });
  });
});