import { NextRequest } from 'next/server';
import { POST as POST_GENERATE } from '@/app/api/v1/exports/generate/route';
import { POST, PUT } from '@/app/api/v1/exports/route';
import { POST as POST_TIME_ENTRY, PATCH as PATCH_TIME_ENTRY } from '@/app/api/v1/time-entries/route';
import fs from 'fs';
import path from 'path';

describe('Export Functionality Integration', () => {
  const testUserId = 'test-user-export-id';
  const testEmail = 'export-user@example.com';

  beforeAll(async () => {
    // Create sample time entries for export testing
    const sampleEntries = [
      {
        clock_in: '2023-01-01T09:00:00Z',
        clock_out: '2023-01-01T17:00:00Z',
        break_minutes: 30
      },
      {
        clock_in: '2023-01-02T08:30:00Z',
        clock_out: '2023-01-02T16:45:00Z',
        break_minutes: 45
      },
      {
        clock_in: '2023-01-03T09:15:00Z',
        clock_out: '2023-01-03T18:30:00Z',
        break_minutes: 60
      }
    ];

    for (const entry of sampleEntries) {
      const clockInRequest = new NextRequest('http://localhost:3000/api/v1/time-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': testUserId,
          'x-user-email': testEmail
        },
        body: JSON.stringify({
          clock_in: entry.clock_in
        })
      });

      const clockInResponse = await POST_TIME_ENTRY(clockInRequest);
      const clockInData = await clockInResponse.json();

      const clockOutRequest = new NextRequest(`http://localhost:3000/api/v1/time-entries/${clockInData.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': testUserId,
          'x-user-email': testEmail
        },
        body: JSON.stringify({
          clock_out: entry.clock_out,
          break_minutes: entry.break_minutes
        })
      });

      await PATCH_TIME_ENTRY(clockOutRequest);
    }
  });

  describe('CSV Export Generation', () => {
    it('should generate valid CSV export with time entries data', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/exports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': testUserId,
          'x-user-email': testEmail
        },
        body: JSON.stringify({
          format: 'csv',
          start_date: '2023-01-01',
          end_date: '2023-01-03'
        })
      });

      const response = await POST_GENERATE(request);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data).toHaveProperty('download_url');
      expect(data).toHaveProperty('format', 'csv');
      expect(data).toHaveProperty('record_count');
      expect(data.record_count).toBeGreaterThan(0);

      // Verify the CSV file can be downloaded and parsed
      expect(data.download_url).toContain('.csv');
      expect(data.file_size).toBeGreaterThan(0);
    });

    it('should include proper CSV headers and data formatting', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/exports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': testUserId,
          'x-user-email': testEmail
        },
        body: JSON.stringify({
          format: 'csv',
          start_date: '2023-01-01',
          end_date: '2023-01-03'
        })
      });

      const response = await POST_GENERATE(request);
      const data = await response.json();

      expect(data).toHaveProperty('preview');
      if (data.preview) {
        expect(data.preview).toContain('Date,Clock In,Clock Out,Duration,Break Minutes,Total Hours');
        expect(data.preview).toContain('2023-01-01');
        expect(data.preview).toContain('09:00');
        expect(data.preview).toContain('17:00');
      }
    });
  });

  describe('PDF Export Generation', () => {
    it('should generate professional PDF report', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/exports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': testUserId,
          'x-user-email': testEmail
        },
        body: JSON.stringify({
          format: 'pdf',
          start_date: '2023-01-01',
          end_date: '2023-01-03'
        })
      });

      const response = await POST_GENERATE(request);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data).toHaveProperty('download_url');
      expect(data).toHaveProperty('format', 'pdf');
      expect(data.download_url).toContain('.pdf');

      // PDF should be larger than CSV due to formatting
      expect(data.file_size).toBeGreaterThan(1000); // At least 1KB
    });

    it('should include summary statistics in PDF', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/exports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': testUserId,
          'x-user-email': testEmail
        },
        body: JSON.stringify({
          format: 'pdf',
          start_date: '2023-01-01',
          end_date: '2023-01-03'
        })
      });

      const response = await POST_GENERATE(request);
      const data = await response.json();

      expect(data).toHaveProperty('summary');
      expect(data.summary).toHaveProperty('total_hours');
      expect(data.summary).toHaveProperty('total_days');
      expect(data.summary).toHaveProperty('average_hours_per_day');
      expect(data.summary.total_hours).toBeGreaterThan(0);
    });
  });

  describe('Excel Export Generation', () => {
    it('should generate Excel workbook with formatted data', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/exports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': testUserId,
          'x-user-email': testEmail
        },
        body: JSON.stringify({
          format: 'xlsx',
          start_date: '2023-01-01',
          end_date: '2023-01-03'
        })
      });

      const response = await POST_GENERATE(request);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data).toHaveProperty('download_url');
      expect(data).toHaveProperty('format', 'xlsx');
      expect(data.download_url).toContain('.xlsx');
    });

    it('should include multiple worksheets in Excel export', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/exports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': testUserId,
          'x-user-email': testEmail
        },
        body: JSON.stringify({
          format: 'xlsx',
          start_date: '2023-01-01',
          end_date: '2023-01-03'
        })
      });

      const response = await POST_GENERATE(request);
      const data = await response.json();

      expect(data).toHaveProperty('worksheets');
      expect(data.worksheets).toContain('Time Entries');
      expect(data.worksheets).toContain('Summary');
      expect(data.worksheets.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Automated Export Configuration', () => {
    it('should create and configure automated daily export', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/exports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': testUserId,
          'x-user-email': testEmail
        },
        body: JSON.stringify({
          name: 'Daily Time Report',
          format: 'csv',
          frequency: 'daily',
          schedule_time: '18:00',
          email_recipients: ['manager@company.com'],
          date_range_days: 1,
          is_active: true
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('name', 'Daily Time Report');
      expect(data).toHaveProperty('format', 'csv');
      expect(data).toHaveProperty('frequency', 'daily');
      expect(data).toHaveProperty('is_active', true);
    });

    it('should create weekly export configuration', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/exports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': testUserId,
          'x-user-email': testEmail
        },
        body: JSON.stringify({
          name: 'Weekly Summary',
          format: 'pdf',
          frequency: 'weekly',
          schedule_time: '09:00',
          email_recipients: ['hr@company.com', 'payroll@company.com'],
          date_range_days: 7,
          is_active: true
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data).toHaveProperty('frequency', 'weekly');
      expect(data).toHaveProperty('date_range_days', 7);
      expect(data.email_recipients).toHaveLength(2);
    });

    it('should update existing export configuration', async () => {
      // First create a configuration
      const createRequest = new NextRequest('http://localhost:3000/api/v1/exports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': testUserId,
          'x-user-email': testEmail
        },
        body: JSON.stringify({
          name: 'Monthly Report',
          format: 'xlsx',
          frequency: 'monthly',
          schedule_time: '10:00',
          email_recipients: ['accounting@company.com'],
          date_range_days: 30,
          is_active: true
        })
      });

      const createResponse = await POST(createRequest);
      const createData = await createResponse.json();
      const configId = createData.id;

      // Now update it
      const updateRequest = new NextRequest(`http://localhost:3000/api/v1/exports/${configId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': testUserId,
          'x-user-email': testEmail
        },
        body: JSON.stringify({
          name: 'Updated Monthly Report',
          schedule_time: '11:00',
          email_recipients: ['accounting@company.com', 'cfo@company.com'],
          is_active: false
        })
      });

      const updateResponse = await PUT(updateRequest);
      expect(updateResponse.status).toBe(200);

      const updateData = await updateResponse.json();
      expect(updateData).toHaveProperty('name', 'Updated Monthly Report');
      expect(updateData).toHaveProperty('schedule_time', '11:00');
      expect(updateData).toHaveProperty('is_active', false);
      expect(updateData.email_recipients).toHaveLength(2);
    });
  });

  describe('Export Data Accuracy', () => {
    it('should export all time entries within date range', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/exports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': testUserId,
          'x-user-email': testEmail
        },
        body: JSON.stringify({
          format: 'csv',
          start_date: '2023-01-01',
          end_date: '2023-01-03'
        })
      });

      const response = await POST_GENERATE(request);
      const data = await response.json();

      expect(data.record_count).toBe(3); // Should match our test data
      expect(data.date_range).toEqual({
        start: '2023-01-01',
        end: '2023-01-03'
      });
    });

    it('should calculate totals correctly in exports', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/exports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': testUserId,
          'x-user-email': testEmail
        },
        body: JSON.stringify({
          format: 'pdf',
          start_date: '2023-01-01',
          end_date: '2023-01-03'
        })
      });

      const response = await POST_GENERATE(request);
      const data = await response.json();

      // Calculate expected totals based on our test data
      // Day 1: 8 hours - 0.5 hours break = 7.5 hours
      // Day 2: 8.25 hours - 0.75 hours break = 7.5 hours
      // Day 3: 9.25 hours - 1 hour break = 8.25 hours
      // Total: ~23.25 hours

      expect(data.summary.total_hours).toBeCloseTo(23.25, 1);
      expect(data.summary.total_days).toBe(3);
      expect(data.summary.average_hours_per_day).toBeCloseTo(7.75, 1);
    });

    it('should handle empty date ranges gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/exports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': testUserId,
          'x-user-email': testEmail
        },
        body: JSON.stringify({
          format: 'csv',
          start_date: '1990-01-01',
          end_date: '1990-01-31'
        })
      });

      const response = await POST_GENERATE(request);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.record_count).toBe(0);
      expect(data).toHaveProperty('download_url');
    });
  });

  describe('Export File Management', () => {
    it('should provide temporary download URLs with expiration', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/exports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': testUserId,
          'x-user-email': testEmail
        },
        body: JSON.stringify({
          format: 'csv',
          start_date: '2023-01-01',
          end_date: '2023-01-03'
        })
      });

      const response = await POST_GENERATE(request);
      const data = await response.json();

      expect(data).toHaveProperty('expires_at');

      const expiresAt = new Date(data.expires_at);
      const now = new Date();
      const hourFromNow = new Date(now.getTime() + (60 * 60 * 1000));

      // URL should expire within 1 hour
      expect(expiresAt.getTime()).toBeLessThanOrEqual(hourFromNow.getTime());
      expect(expiresAt.getTime()).toBeGreaterThan(now.getTime());
    });

    it('should include file metadata in response', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/exports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': testUserId,
          'x-user-email': testEmail
        },
        body: JSON.stringify({
          format: 'xlsx',
          start_date: '2023-01-01',
          end_date: '2023-01-03'
        })
      });

      const response = await POST_GENERATE(request);
      const data = await response.json();

      expect(data).toHaveProperty('file_name');
      expect(data).toHaveProperty('file_size');
      expect(data).toHaveProperty('generated_at');
      expect(data).toHaveProperty('content_type');

      expect(data.file_name).toContain('.xlsx');
      expect(data.content_type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(data.file_size).toBeGreaterThan(0);
    });
  });

  describe('Performance and Limits', () => {
    it('should handle reasonable data volumes efficiently', async () => {
      const startTime = Date.now();

      const request = new NextRequest('http://localhost:3000/api/v1/exports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': testUserId,
          'x-user-email': testEmail
        },
        body: JSON.stringify({
          format: 'csv',
          start_date: '2023-01-01',
          end_date: '2023-01-03'
        })
      });

      const response = await POST_GENERATE(request);
      const endTime = Date.now();

      expect(response.status).toBe(201);

      // Export should complete within 5 seconds for small datasets
      expect(endTime - startTime).toBeLessThan(5000);

      const data = await response.json();
      expect(data).toHaveProperty('generation_time_ms');
      expect(data.generation_time_ms).toBeLessThan(5000);
    });
  });
});