import { NextRequest } from 'next/server';
import { PATCH } from '@/app/api/v1/profile/route';

describe('/api/v1/profile PATCH', () => {
  describe('Authentication Required', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: 'New Name',
          location_state: 'CA'
        })
      });

      const response = await PATCH(request);
      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  describe('Valid Requests', () => {
    it('should update user profile with valid data', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'test-user-id',
          'x-user-email': 'test@example.com'
        },
        body: JSON.stringify({
          full_name: 'Updated Name',
          location_state: 'CA'
        })
      });

      const response = await PATCH(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('full_name', 'Updated Name');
      expect(data).toHaveProperty('location_state', 'CA');
    });

    it('should validate location_state format', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'test-user-id',
          'x-user-email': 'test@example.com'
        },
        body: JSON.stringify({
          location_state: 'CALIFORNIA' // Should be 2-letter code
        })
      });

      const response = await PATCH(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  describe('Error Handling', () => {
    it('should return 400 for invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'test-user-id',
          'x-user-email': 'test@example.com'
        },
        body: 'invalid json'
      });

      const response = await PATCH(request);
      expect(response.status).toBe(400);
    });

    it('should handle database errors gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'invalid-user-id',
          'x-user-email': 'test@example.com'
        },
        body: JSON.stringify({
          full_name: 'Test Name'
        })
      });

      const response = await PATCH(request);
      expect([404, 500]).toContain(response.status);
    });
  });
});