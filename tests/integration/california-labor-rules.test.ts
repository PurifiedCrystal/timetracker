import { NextRequest } from 'next/server';
import { POST, PATCH } from '@/app/api/v1/time-entries/route';
import { PATCH as PATCH_PROFILE } from '@/app/api/v1/profile/route';

describe('California Labor Rules Integration', () => {
  const californiaUserId = 'test-user-ca-id';
  const nonCaliforniaUserId = 'test-user-other-id';

  beforeAll(async () => {
    // Set up California user profile
    const profileRequest = new NextRequest('http://localhost:3000/api/v1/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': californiaUserId,
        'x-user-email': 'ca-user@example.com'
      },
      body: JSON.stringify({
        location_state: 'CA',
        timezone: 'America/Los_Angeles'
      })
    });
    await PATCH_PROFILE(profileRequest);

    // Set up non-California user profile
    const nonCaProfileRequest = new NextRequest('http://localhost:3000/api/v1/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': nonCaliforniaUserId,
        'x-user-email': 'other-user@example.com'
      },
      body: JSON.stringify({
        location_state: 'NY',
        timezone: 'America/New_York'
      })
    });
    await PATCH_PROFILE(nonCaProfileRequest);
  });

  describe('Daily Overtime Rules (CA)', () => {
    it('should calculate daily overtime for California users after 8 hours', async () => {
      // Clock in for California user
      const clockInTime = new Date();
      clockInTime.setHours(clockInTime.getHours() - 9); // 9 hours ago

      const clockInRequest = new NextRequest('http://localhost:3000/api/v1/time-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': californiaUserId,
          'x-user-email': 'ca-user@example.com'
        },
        body: JSON.stringify({
          clock_in: clockInTime.toISOString()
        })
      });

      const clockInResponse = await POST(clockInRequest);
      expect(clockInResponse.status).toBe(201);

      const clockInData = await clockInResponse.json();
      const timeEntryId = clockInData.id;

      // Clock out after 9 hours
      const clockOutTime = new Date();
      const clockOutRequest = new NextRequest(`http://localhost:3000/api/v1/time-entries/${timeEntryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': californiaUserId,
          'x-user-email': 'ca-user@example.com'
        },
        body: JSON.stringify({
          clock_out: clockOutTime.toISOString(),
          break_minutes: 0
        })
      });

      const clockOutResponse = await PATCH(clockOutRequest);
      expect(clockOutResponse.status).toBe(200);

      const data = await clockOutResponse.json();

      // Should have 1 hour of daily overtime (9 hours - 8 hours threshold)
      expect(data.overtime_minutes).toBeGreaterThanOrEqual(50); // ~1 hour, allowing for test timing
      expect(data.labor_rules_applied).toContain('daily_overtime');
      expect(data.total_hours).toBeGreaterThanOrEqual(8.8);
    });

    it('should not apply daily overtime for non-California users', async () => {
      // Clock in for non-CA user
      const clockInTime = new Date();
      clockInTime.setHours(clockInTime.getHours() - 9); // 9 hours ago

      const clockInRequest = new NextRequest('http://localhost:3000/api/v1/time-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': nonCaliforniaUserId,
          'x-user-email': 'other-user@example.com'
        },
        body: JSON.stringify({
          clock_in: clockInTime.toISOString()
        })
      });

      const clockInResponse = await POST(clockInRequest);
      const clockInData = await clockInResponse.json();
      const timeEntryId = clockInData.id;

      // Clock out after 9 hours
      const clockOutTime = new Date();
      const clockOutRequest = new NextRequest(`http://localhost:3000/api/v1/time-entries/${timeEntryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': nonCaliforniaUserId,
          'x-user-email': 'other-user@example.com'
        },
        body: JSON.stringify({
          clock_out: clockOutTime.toISOString(),
          break_minutes: 0
        })
      });

      const clockOutResponse = await PATCH(clockOutRequest);
      const data = await clockOutResponse.json();

      // Should NOT have daily overtime applied
      expect(data.overtime_minutes || 0).toBe(0);
      expect(data.labor_rules_applied || []).not.toContain('daily_overtime');
    });
  });

  describe('Meal Period Requirements (CA)', () => {
    it('should flag meal period violation for California users working 5+ hours without break', async () => {
      // Clock in for California user
      const clockInTime = new Date();
      clockInTime.setHours(clockInTime.getHours() - 6); // 6 hours ago

      const clockInRequest = new NextRequest('http://localhost:3000/api/v1/time-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': californiaUserId,
          'x-user-email': 'ca-user@example.com'
        },
        body: JSON.stringify({
          clock_in: clockInTime.toISOString()
        })
      });

      const clockInResponse = await POST(clockInRequest);
      const clockInData = await clockInResponse.json();
      const timeEntryId = clockInData.id;

      // Clock out after 6 hours with no breaks
      const clockOutTime = new Date();
      const clockOutRequest = new NextRequest(`http://localhost:3000/api/v1/time-entries/${timeEntryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': californiaUserId,
          'x-user-email': 'ca-user@example.com'
        },
        body: JSON.stringify({
          clock_out: clockOutTime.toISOString(),
          break_minutes: 0 // No break taken
        })
      });

      const clockOutResponse = await PATCH(clockOutRequest);
      const data = await clockOutResponse.json();

      // Should flag meal period violation
      expect(data.labor_violations).toContainEqual(
        expect.objectContaining({
          type: 'meal_period',
          hours_worked: expect.any(Number),
          required_break_minutes: 30
        })
      );
      expect(data.labor_rules_applied).toContain('meal_period_check');
    });

    it('should not flag meal period violation when adequate break is provided', async () => {
      // Clock in for California user
      const clockInTime = new Date();
      clockInTime.setHours(clockInTime.getHours() - 6); // 6 hours ago

      const clockInRequest = new NextRequest('http://localhost:3000/api/v1/time-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': californiaUserId,
          'x-user-email': 'ca-user@example.com'
        },
        body: JSON.stringify({
          clock_in: clockInTime.toISOString()
        })
      });

      const clockInResponse = await POST(clockInRequest);
      const clockInData = await clockInResponse.json();
      const timeEntryId = clockInData.id;

      // Clock out after 6 hours with 30-minute break
      const clockOutTime = new Date();
      const clockOutRequest = new NextRequest(`http://localhost:3000/api/v1/time-entries/${timeEntryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': californiaUserId,
          'x-user-email': 'ca-user@example.com'
        },
        body: JSON.stringify({
          clock_out: clockOutTime.toISOString(),
          break_minutes: 30 // Adequate break provided
        })
      });

      const clockOutResponse = await PATCH(clockOutRequest);
      const data = await clockOutResponse.json();

      // Should NOT flag meal period violation
      const mealViolations = (data.labor_violations || []).filter(v => v.type === 'meal_period');
      expect(mealViolations).toHaveLength(0);
    });
  });

  describe('Weekly Overtime Rules (CA)', () => {
    it('should calculate weekly overtime for California users after 40 hours', async () => {
      // This test would require creating multiple time entries across a week
      // For simplicity, we'll create entries that simulate a week of work

      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7); // Start of previous week

      // Create multiple 9-hour days (45 total hours)
      const timeEntries = [];
      for (let day = 0; day < 5; day++) {
        const dayStart = new Date(weekStart);
        dayStart.setDate(dayStart.getDate() + day);
        dayStart.setHours(9, 0, 0, 0);

        const dayEnd = new Date(dayStart);
        dayEnd.setHours(18, 0, 0, 0); // 9 hours later

        // Create time entry for this day
        const clockInRequest = new NextRequest('http://localhost:3000/api/v1/time-entries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': californiaUserId,
            'x-user-email': 'ca-user@example.com'
          },
          body: JSON.stringify({
            clock_in: dayStart.toISOString()
          })
        });

        const clockInResponse = await POST(clockInRequest);
        const clockInData = await clockInResponse.json();

        // Clock out
        const clockOutRequest = new NextRequest(`http://localhost:3000/api/v1/time-entries/${clockInData.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': californiaUserId,
            'x-user-email': 'ca-user@example.com'
          },
          body: JSON.stringify({
            clock_out: dayEnd.toISOString(),
            break_minutes: 30
          })
        });

        const clockOutResponse = await PATCH(clockOutRequest);
        const data = await clockOutResponse.json();
        timeEntries.push(data);
      }

      // Last entry should show weekly overtime
      const lastEntry = timeEntries[timeEntries.length - 1];
      expect(lastEntry.weekly_overtime_hours).toBeGreaterThan(0);
      expect(lastEntry.labor_rules_applied).toContain('weekly_overtime');
    });
  });

  describe('Double Overtime Rules (CA)', () => {
    it('should calculate double overtime for California users after 12 hours in a day', async () => {
      // Clock in for California user
      const clockInTime = new Date();
      clockInTime.setHours(clockInTime.getHours() - 13); // 13 hours ago

      const clockInRequest = new NextRequest('http://localhost:3000/api/v1/time-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': californiaUserId,
          'x-user-email': 'ca-user@example.com'
        },
        body: JSON.stringify({
          clock_in: clockInTime.toISOString()
        })
      });

      const clockInResponse = await POST(clockInRequest);
      const clockInData = await clockInResponse.json();
      const timeEntryId = clockInData.id;

      // Clock out after 13 hours
      const clockOutTime = new Date();
      const clockOutRequest = new NextRequest(`http://localhost:3000/api/v1/time-entries/${timeEntryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': californiaUserId,
          'x-user-email': 'ca-user@example.com'
        },
        body: JSON.stringify({
          clock_out: clockOutTime.toISOString(),
          break_minutes: 60 // 1 hour break
        })
      });

      const clockOutResponse = await PATCH(clockOutRequest);
      const data = await clockOutResponse.json();

      // Should have both regular overtime (8-12 hours) and double overtime (12+ hours)
      expect(data.overtime_minutes).toBeGreaterThan(240); // More than 4 hours
      expect(data.double_overtime_minutes).toBeGreaterThan(0);
      expect(data.labor_rules_applied).toContain('double_overtime');
    });
  });

  describe('Labor Rules Summary', () => {
    it('should provide summary of all applied labor rules', async () => {
      // Create a complex scenario with multiple rule applications
      const clockInTime = new Date();
      clockInTime.setHours(clockInTime.getHours() - 10); // 10 hours ago

      const clockInRequest = new NextRequest('http://localhost:3000/api/v1/time-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': californiaUserId,
          'x-user-email': 'ca-user@example.com'
        },
        body: JSON.stringify({
          clock_in: clockInTime.toISOString()
        })
      });

      const clockInResponse = await POST(clockInRequest);
      const clockInData = await clockInResponse.json();
      const timeEntryId = clockInData.id;

      // Clock out after 10 hours with inadequate break
      const clockOutTime = new Date();
      const clockOutRequest = new NextRequest(`http://localhost:3000/api/v1/time-entries/${timeEntryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': californiaUserId,
          'x-user-email': 'ca-user@example.com'
        },
        body: JSON.stringify({
          clock_out: clockOutTime.toISOString(),
          break_minutes: 15 // Inadequate break for 10-hour shift
        })
      });

      const clockOutResponse = await PATCH(clockOutRequest);
      const data = await clockOutResponse.json();

      // Should have comprehensive labor rules summary
      expect(data).toHaveProperty('labor_rules_summary');
      expect(data.labor_rules_summary).toHaveProperty('total_regular_hours');
      expect(data.labor_rules_summary).toHaveProperty('total_overtime_hours');
      expect(data.labor_rules_summary).toHaveProperty('violations_count');
      expect(data.labor_rules_summary).toHaveProperty('compliance_status');
    });
  });
});