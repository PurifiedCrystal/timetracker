import { NextRequest } from 'next/server';
import { GET } from '@/app/api/v1/time-entries/route';

describe('/api/v1/time-entries GET', () => {
  describe('Authentication Required', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/time-entries', {
        method: 'GET',
      });

      const response = await GET(request);
      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  describe('Valid Requests', () => {
    it('should return paginated time entries for authenticated user', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/time-entries', {
        method: 'GET',
        headers: {
          'x-user-id': 'test-user-id',
          'x-user-email': 'test@example.com'
        }
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('entries');
      expect(data).toHaveProperty('pagination');
      expect(Array.isArray(data.entries)).toBe(true);
      expect(data.pagination).toHaveProperty('total');
      expect(data.pagination).toHaveProperty('page');
      expect(data.pagination).toHaveProperty('limit');
    });

    it('should filter by date range when provided', async () => {
      const startDate = '2023-01-01';
      const endDate = '2023-01-31';
      const url = new URL('http://localhost:3000/api/v1/time-entries');
      url.searchParams.set('start_date', startDate);
      url.searchParams.set('end_date', endDate);

      const request = new NextRequest(url.toString(), {
        method: 'GET',
        headers: {
          'x-user-id': 'test-user-id',
          'x-user-email': 'test@example.com'
        }
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('entries');
      expect(data).toHaveProperty('filters');
      expect(data.filters).toHaveProperty('start_date', startDate);
      expect(data.filters).toHaveProperty('end_date', endDate);
    });

    it('should support pagination parameters', async () => {
      const url = new URL('http://localhost:3000/api/v1/time-entries');
      url.searchParams.set('page', '2');
      url.searchParams.set('limit', '10');

      const request = new NextRequest(url.toString(), {
        method: 'GET',
        headers: {
          'x-user-id': 'test-user-id',
          'x-user-email': 'test@example.com'
        }
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.pagination).toHaveProperty('page', 2);
      expect(data.pagination).toHaveProperty('limit', 10);
    });
  });

  describe('Data Validation', () => {
    it('should validate date format for date filters', async () => {
      const url = new URL('http://localhost:3000/api/v1/time-entries');
      url.searchParams.set('start_date', 'invalid-date');

      const request = new NextRequest(url.toString(), {
        method: 'GET',
        headers: {
          'x-user-id': 'test-user-id',
          'x-user-email': 'test@example.com'
        }
      });

      const response = await GET(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Invalid date format');
    });

    it('should validate pagination parameters', async () => {
      const url = new URL('http://localhost:3000/api/v1/time-entries');
      url.searchParams.set('page', '0'); // Invalid: page should be >= 1
      url.searchParams.set('limit', '1000'); // Invalid: limit too high

      const request = new NextRequest(url.toString(), {
        method: 'GET',
        headers: {
          'x-user-id': 'test-user-id',
          'x-user-email': 'test@example.com'
        }
      });

      const response = await GET(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  describe('Response Format', () => {
    it('should return properly formatted time entry objects', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/time-entries', {
        method: 'GET',
        headers: {
          'x-user-id': 'test-user-id',
          'x-user-email': 'test@example.com'
        }
      });

      const response = await GET(request);
      const data = await response.json();

      if (data.entries.length > 0) {
        const entry = data.entries[0];
        expect(entry).toHaveProperty('id');
        expect(entry).toHaveProperty('clock_in');
        expect(entry).toHaveProperty('clock_out');
        expect(entry).toHaveProperty('duration_minutes');
        expect(entry).toHaveProperty('break_minutes');
        expect(entry).toHaveProperty('overtime_minutes');
        expect(entry).toHaveProperty('created_at');
      }
    });
  });
});