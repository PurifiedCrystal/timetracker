/**
 * Unit tests for TimeEntryService
 */
import { TimeEntryService } from '@/services/TimeEntryService';
import { createMockSupabaseClient } from '@/lib/mock-session';

// Mock the database client
jest.mock('@/lib/database', () => ({
  createSupabaseServiceClient: jest.fn(() => createMockSupabaseClient())
}));

describe('TimeEntryService', () => {
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: jest.fn(() => ({
              lte: jest.fn(() => ({
                order: jest.fn(() => ({
                  single: jest.fn(),
                  limit: jest.fn(() => ({
                    single: jest.fn()
                  }))
                }))
              }))
            })),
            single: jest.fn(),
            order: jest.fn(() => ({
              limit: jest.fn()
            }))
          }))
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn()
          }))
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn()
            }))
          }))
        })),
        delete: jest.fn(() => ({
          eq: jest.fn()
        }))
      }))
    };
  });

  describe('getTimeEntriesForUser', () => {
    it('should return time entries for valid user', async () => {
      const mockEntries = [
        {
          id: 'entry1',
          user_id: 'test-user-123',
          clock_in: '2024-01-01T09:00:00.000Z',
          clock_out: '2024-01-01T17:00:00.000Z',
          duration_minutes: 480,
          break_minutes: 60,
          overtime_minutes: 0
        },
        {
          id: 'entry2',
          user_id: 'test-user-123',
          clock_in: '2024-01-02T09:00:00.000Z',
          clock_out: '2024-01-02T18:00:00.000Z',
          duration_minutes: 540,
          break_minutes: 60,
          overtime_minutes: 60
        }
      ];

      const mockChain = {
        order: jest.fn(() => ({
          limit: jest.fn().mockResolvedValue({
            data: mockEntries,
            error: null
          })
        }))
      };

      mockClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue(mockChain)
        })
      });

      const result = await TimeEntryService.getTimeEntriesForUser('test-user-123', mockClient);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEntries);
      expect(result.data?.length).toBe(2);
    });

    it('should return empty array for user with no entries', async () => {
      const mockChain = {
        order: jest.fn(() => ({
          limit: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        }))
      };

      mockClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue(mockChain)
        })
      });

      const result = await TimeEntryService.getTimeEntriesForUser('no-entries-user', mockClient);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle database errors', async () => {
      const mockChain = {
        order: jest.fn(() => ({
          limit: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' }
          })
        }))
      };

      mockClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue(mockChain)
        })
      });

      const result = await TimeEntryService.getTimeEntriesForUser('test-user-123', mockClient);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('getTimeEntriesForPeriod', () => {
    it('should return time entries for specific date range', async () => {
      const mockEntries = [
        {
          id: 'entry1',
          user_id: 'test-user-123',
          clock_in: '2024-01-15T09:00:00.000Z',
          clock_out: '2024-01-15T17:00:00.000Z',
          duration_minutes: 480
        }
      ];

      const mockChain = {
        lte: jest.fn(() => ({
          order: jest.fn().mockResolvedValue({
            data: mockEntries,
            error: null
          })
        }))
      };

      mockClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue(mockChain)
          })
        })
      });

      const result = await TimeEntryService.getTimeEntriesForPeriod(
        'test-user-123',
        '2024-01-01T00:00:00.000Z',
        '2024-01-31T23:59:59.999Z',
        mockClient
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEntries);
    });

    it('should return empty array for period with no entries', async () => {
      const mockChain = {
        lte: jest.fn(() => ({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        }))
      };

      mockClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue(mockChain)
          })
        })
      });

      const result = await TimeEntryService.getTimeEntriesForPeriod(
        'test-user-123',
        '2024-12-01T00:00:00.000Z',
        '2024-12-31T23:59:59.999Z',
        mockClient
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('createTimeEntry', () => {
    it('should create new time entry successfully', async () => {
      const newEntry = {
        user_id: 'test-user-123',
        clock_in: '2024-01-01T09:00:00.000Z',
        metadata: { mode: 'work' }
      };

      const createdEntry = {
        id: 'new-entry-123',
        ...newEntry,
        clock_out: null,
        duration_minutes: null,
        break_minutes: 0,
        overtime_minutes: 0,
        created_at: '2024-01-01T09:00:00.000Z'
      };

      const mockChain = {
        single: jest.fn().mockResolvedValue({
          data: createdEntry,
          error: null
        })
      };

      mockClient.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue(mockChain)
        })
      });

      const result = await TimeEntryService.createTimeEntry(newEntry, mockClient);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(createdEntry);
    });

    it('should return error for invalid time entry data', async () => {
      const invalidEntry = {
        user_id: '',
        clock_in: 'invalid-date'
      };

      const mockChain = {
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Invalid input data' }
        })
      };

      mockClient.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue(mockChain)
        })
      });

      const result = await TimeEntryService.createTimeEntry(invalidEntry as any, mockClient);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid input data');
    });
  });

  describe('updateTimeEntry', () => {
    it('should update time entry successfully', async () => {
      const updates = {
        clock_out: '2024-01-01T17:00:00.000Z',
        duration_minutes: 480,
        break_minutes: 60
      };

      const updatedEntry = {
        id: 'entry-123',
        user_id: 'test-user-123',
        clock_in: '2024-01-01T09:00:00.000Z',
        ...updates,
        created_at: '2024-01-01T09:00:00.000Z',
        updated_at: '2024-01-01T17:00:00.000Z'
      };

      const mockChain = {
        single: jest.fn().mockResolvedValue({
          data: updatedEntry,
          error: null
        })
      };

      mockClient.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue(mockChain)
          })
        })
      });

      const result = await TimeEntryService.updateTimeEntry('entry-123', updates, mockClient);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedEntry);
    });

    it('should return error for non-existent entry', async () => {
      const updates = { clock_out: '2024-01-01T17:00:00.000Z' };

      const mockChain = {
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'No rows updated' }
        })
      };

      mockClient.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue(mockChain)
          })
        })
      });

      const result = await TimeEntryService.updateTimeEntry('invalid-entry', updates, mockClient);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No rows updated');
    });
  });

  describe('getActiveTimeEntry', () => {
    it('should return active time entry when exists', async () => {
      const activeEntry = {
        id: 'active-entry-123',
        user_id: 'test-user-123',
        clock_in: '2024-01-01T09:00:00.000Z',
        clock_out: null,
        duration_minutes: null
      };

      const mockChain = {
        single: jest.fn().mockResolvedValue({
          data: activeEntry,
          error: null
        })
      };

      mockClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue(mockChain)
        })
      });

      const result = await TimeEntryService.getActiveTimeEntry('test-user-123', mockClient);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(activeEntry);
    });

    it('should return null when no active entry exists', async () => {
      const mockChain = {
        single: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      };

      mockClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue(mockChain)
        })
      });

      const result = await TimeEntryService.getActiveTimeEntry('test-user-123', mockClient);

      expect(result.success).toBe(true);
      expect(result.data).toBe(null);
    });

    it('should handle database errors', async () => {
      const mockChain = {
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' }
        })
      };

      mockClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue(mockChain)
        })
      });

      const result = await TimeEntryService.getActiveTimeEntry('test-user-123', mockClient);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
    });
  });

  describe('calculateDuration', () => {
    it('should calculate duration correctly', () => {
      const clockIn = '2024-01-01T09:00:00.000Z';
      const clockOut = '2024-01-01T17:30:00.000Z';

      const duration = TimeEntryService.calculateDuration(clockIn, clockOut);

      expect(duration).toBe(510); // 8.5 hours = 510 minutes
    });

    it('should return 0 for same clock in and out times', () => {
      const clockTime = '2024-01-01T09:00:00.000Z';

      const duration = TimeEntryService.calculateDuration(clockTime, clockTime);

      expect(duration).toBe(0);
    });

    it('should handle invalid dates', () => {
      const duration = TimeEntryService.calculateDuration('invalid', '2024-01-01T17:00:00.000Z');

      expect(duration).toBe(0);
    });
  });

  describe('validateTimeEntry', () => {
    it('should validate complete time entry', () => {
      const validEntry = {
        user_id: 'test-user-123',
        clock_in: '2024-01-01T09:00:00.000Z',
        clock_out: '2024-01-01T17:00:00.000Z',
        duration_minutes: 480
      };

      const result = TimeEntryService.validateTimeEntry(validEntry);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should return errors for invalid time entry', () => {
      const invalidEntry = {
        user_id: '',
        clock_in: 'invalid-date',
        clock_out: '2024-01-01T08:00:00.000Z', // Before clock in
        duration_minutes: -60
      };

      const result = TimeEntryService.validateTimeEntry(invalidEntry);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('User ID is required');
      expect(result.errors).toContain('Invalid clock in time');
    });

    it('should validate clock out is after clock in', () => {
      const entry = {
        user_id: 'test-user-123',
        clock_in: '2024-01-01T17:00:00.000Z',
        clock_out: '2024-01-01T09:00:00.000Z', // Before clock in
        duration_minutes: 480
      };

      const result = TimeEntryService.validateTimeEntry(entry);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Clock out must be after clock in');
    });
  });

  describe('deleteTimeEntry', () => {
    it('should delete time entry successfully', async () => {
      const mockChain = {
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      };

      mockClient.from.mockReturnValue({
        delete: jest.fn().mockReturnValue(mockChain)
      });

      const result = await TimeEntryService.deleteTimeEntry('entry-123', mockClient);

      expect(result.success).toBe(true);
    });

    it('should return error for failed deletion', async () => {
      const mockChain = {
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Entry not found' }
        })
      };

      mockClient.from.mockReturnValue({
        delete: jest.fn().mockReturnValue(mockChain)
      });

      const result = await TimeEntryService.deleteTimeEntry('invalid-entry', mockClient);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Entry not found');
    });
  });

  describe('getTodaysSummary', () => {
    it('should calculate today\'s summary correctly', async () => {
      const todaysEntries = [
        {
          id: 'entry1',
          user_id: 'test-user-123',
          clock_in: '2024-01-01T09:00:00.000Z',
          clock_out: '2024-01-01T17:00:00.000Z',
          duration_minutes: 480,
          break_minutes: 60,
          overtime_minutes: 0
        },
        {
          id: 'entry2',
          user_id: 'test-user-123',
          clock_in: '2024-01-01T19:00:00.000Z',
          clock_out: '2024-01-01T21:00:00.000Z',
          duration_minutes: 120,
          break_minutes: 0,
          overtime_minutes: 120
        }
      ];

      const mockChain = {
        lte: jest.fn(() => ({
          order: jest.fn().mockResolvedValue({
            data: todaysEntries,
            error: null
          })
        }))
      };

      mockClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue(mockChain)
          })
        })
      });

      const result = await TimeEntryService.getTodaysSummary('test-user-123', mockClient);

      expect(result.success).toBe(true);
      expect(result.data?.total_hours).toBe(10); // 600 minutes = 10 hours
      expect(result.data?.sessions).toBe(2);
      expect(result.data?.total_break_minutes).toBe(60);
      expect(result.data?.total_overtime_minutes).toBe(120);
    });

    it('should return zero summary for no entries today', async () => {
      const mockChain = {
        lte: jest.fn(() => ({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        }))
      };

      mockClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue(mockChain)
          })
        })
      });

      const result = await TimeEntryService.getTodaysSummary('test-user-123', mockClient);

      expect(result.success).toBe(true);
      expect(result.data?.total_hours).toBe(0);
      expect(result.data?.sessions).toBe(0);
      expect(result.data?.total_break_minutes).toBe(0);
      expect(result.data?.total_overtime_minutes).toBe(0);
    });
  });
});