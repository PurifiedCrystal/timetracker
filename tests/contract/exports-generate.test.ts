import { NextRequest } from 'next/server';
import { POST } from '@/app/api/v1/exports/generate/route';

describe('/api/v1/exports/generate POST', () => {
  describe('Authentication Required', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/exports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: 'csv',
          start_date: '2023-01-01',
          end_date: '2023-01-31'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  describe('Valid Export Generation', () => {
    it('should generate CSV export with valid parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/exports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'test-user-id',
          'x-user-email': 'test@example.com'
        },
        body: JSON.stringify({
          format: 'csv',
          start_date: '2023-01-01',
          end_date: '2023-01-31'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data).toHaveProperty('download_url');
      expect(data).toHaveProperty('expires_at');
      expect(data).toHaveProperty('format', 'csv');
      expect(data).toHaveProperty('file_size');

      // Validate URL format
      expect(data.download_url).toMatch(/^https?:\/\/.+/);

      // Validate expiration date
      const expiresAt = new Date(data.expires_at);
      const now = new Date();
      expect(expiresAt.getTime()).toBeGreaterThan(now.getTime());
    });

    it('should generate PDF export with valid parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/exports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'test-user-id',
          'x-user-email': 'test@example.com'
        },
        body: JSON.stringify({
          format: 'pdf',
          start_date: '2023-01-01',
          end_date: '2023-01-31'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data).toHaveProperty('download_url');
      expect(data).toHaveProperty('expires_at');
      expect(data).toHaveProperty('format', 'pdf');
      expect(data.download_url).toContain('.pdf');
    });

    it('should generate Excel export with valid parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/exports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'test-user-id',
          'x-user-email': 'test@example.com'
        },
        body: JSON.stringify({
          format: 'xlsx',
          start_date: '2023-01-01',
          end_date: '2023-01-31'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data).toHaveProperty('download_url');
      expect(data).toHaveProperty('expires_at');
      expect(data).toHaveProperty('format', 'xlsx');
      expect(data.download_url).toContain('.xlsx');
    });
  });

  describe('Request Validation', () => {
    it('should require format parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/exports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'test-user-id',
          'x-user-email': 'test@example.com'
        },
        body: JSON.stringify({
          start_date: '2023-01-01',
          end_date: '2023-01-31'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('format');
    });

    it('should require start_date parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/exports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'test-user-id',
          'x-user-email': 'test@example.com'
        },
        body: JSON.stringify({
          format: 'csv',
          end_date: '2023-01-31'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('start_date');
    });

    it('should require end_date parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/exports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'test-user-id',
          'x-user-email': 'test@example.com'
        },
        body: JSON.stringify({
          format: 'csv',
          start_date: '2023-01-01'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('end_date');
    });

    it('should validate format enum values', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/exports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'test-user-id',
          'x-user-email': 'test@example.com'
        },
        body: JSON.stringify({
          format: 'invalid-format',
          start_date: '2023-01-01',
          end_date: '2023-01-31'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('format');
    });

    it('should validate date format', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/exports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'test-user-id',
          'x-user-email': 'test@example.com'
        },
        body: JSON.stringify({
          format: 'csv',
          start_date: 'invalid-date',
          end_date: '2023-01-31'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('date format');
    });

    it('should validate that end_date is after start_date', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/exports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'test-user-id',
          'x-user-email': 'test@example.com'
        },
        body: JSON.stringify({
          format: 'csv',
          start_date: '2023-01-31',
          end_date: '2023-01-01'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('end_date must be after start_date');
    });
  });

  describe('Date Range Limits', () => {
    it('should handle maximum date range validation', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/exports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'test-user-id',
          'x-user-email': 'test@example.com'
        },
        body: JSON.stringify({
          format: 'csv',
          start_date: '2020-01-01',
          end_date: '2023-12-31' // 4 years - might be too large
        })
      });

      const response = await POST(request);
      expect([201, 400]).toContain(response.status);

      if (response.status === 400) {
        const data = await response.json();
        expect(data).toHaveProperty('error');
        expect(data.error).toContain('date range');
      }
    });

    it('should handle future dates', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const request = new NextRequest('http://localhost:3000/api/v1/exports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'test-user-id',
          'x-user-email': 'test@example.com'
        },
        body: JSON.stringify({
          format: 'csv',
          start_date: '2023-01-01',
          end_date: futureDateStr
        })
      });

      const response = await POST(request);
      expect([201, 400]).toContain(response.status);
    });
  });

  describe('Export Content Validation', () => {
    it('should handle empty data sets', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/exports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'test-user-id-no-data',
          'x-user-email': 'test@example.com'
        },
        body: JSON.stringify({
          format: 'csv',
          start_date: '1990-01-01',
          end_date: '1990-01-31'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data).toHaveProperty('download_url');
      expect(data).toHaveProperty('record_count', 0);
    });

    it('should include metadata about the export', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/exports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'test-user-id',
          'x-user-email': 'test@example.com'
        },
        body: JSON.stringify({
          format: 'csv',
          start_date: '2023-01-01',
          end_date: '2023-01-31'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data).toHaveProperty('generated_at');
      expect(data).toHaveProperty('record_count');
      expect(data).toHaveProperty('date_range');

      expect(typeof data.record_count).toBe('number');
      expect(data.record_count).toBeGreaterThanOrEqual(0);

      expect(data.date_range).toHaveProperty('start', '2023-01-01');
      expect(data.date_range).toHaveProperty('end', '2023-01-31');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON in request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/exports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'test-user-id',
          'x-user-email': 'test@example.com'
        },
        body: 'invalid json'
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Invalid JSON');
    });

    it('should handle database connection errors', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/exports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'test-user-id',
          'x-user-email': 'test@example.com'
        },
        body: JSON.stringify({
          format: 'csv',
          start_date: '2023-01-01',
          end_date: '2023-01-31'
        })
      });

      const response = await POST(request);
      expect([201, 500]).toContain(response.status);
    });

    it('should handle file generation errors', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/exports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'test-user-id-large-dataset',
          'x-user-email': 'test@example.com'
        },
        body: JSON.stringify({
          format: 'pdf',
          start_date: '2020-01-01',
          end_date: '2023-12-31'
        })
      });

      const response = await POST(request);
      expect([201, 500, 413]).toContain(response.status);
    });
  });
});