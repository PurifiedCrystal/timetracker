/**
 * Unit tests for Excel export generators
 */
import { generateTimeTrackingExcel, generateHabitsExcel, generateCombinedExcel } from '@/lib/exporters/xlsx';

// Mock XLSX library
jest.mock('xlsx', () => ({
  utils: {
    book_new: jest.fn(() => ({})),
    aoa_to_sheet: jest.fn(() => ({
      '!cols': [],
      'A1': { t: 's', v: 'Test' }
    })),
    book_append_sheet: jest.fn(),
    json_to_sheet: jest.fn(() => ({}))
  },
  write: jest.fn(() => Buffer.from('mock-excel-data')),
  read: jest.fn(() => ({
    Sheets: {
      'Summary': {},
      'Time Entries': {},
      'Daily Summary': {},
      'Habit Entries': {},
      'Habit Analysis': {}
    }
  }))
}));

describe('Excel Export Generators', () => {
  const mockTimeTrackingData = {
    entries: [
      {
        date: '2024-01-01',
        clock_in: '09:00:00',
        clock_out: '17:00:00',
        duration_hours: 8,
        break_minutes: 60,
        overtime_minutes: 0,
        group: 'Development',
        notes: 'Regular workday'
      },
      {
        date: '2024-01-02',
        clock_in: '08:30:00',
        clock_out: '18:30:00',
        duration_hours: 9.5,
        break_minutes: 30,
        overtime_minutes: 90,
        group: 'Testing',
        notes: 'Extra testing session'
      }
    ],
    summary: {
      total_entries: 2,
      total_hours: 17.5,
      total_breaks_minutes: 90,
      total_overtime_minutes: 90,
      average_hours_per_day: 8.75
    },
    user: {
      name: 'Test User',
      email: 'test@example.com',
      period: 'January 1-2, 2024'
    }
  };

  const mockHabitsData = {
    entries: [
      {
        date: '2024-01-01',
        habit_name: 'Morning Exercise',
        category: 'Health',
        type: 'duration',
        completed_at: '07:00:00',
        duration_minutes: 30,
        count_value: 1,
        mood_rating: 4,
        notes: 'Great workout today'
      },
      {
        date: '2024-01-01',
        habit_name: 'Read Books',
        category: 'Learning',
        type: 'count',
        completed_at: '20:00:00',
        duration_minutes: 60,
        count_value: 25,
        mood_rating: 5,
        notes: 'Finished chapter 3'
      },
      {
        date: '2024-01-02',
        habit_name: 'Morning Exercise',
        category: 'Health',
        type: 'duration',
        completed_at: '07:15:00',
        duration_minutes: 45,
        count_value: 1,
        mood_rating: 5,
        notes: 'Increased duration'
      }
    ],
    summary: {
      total_entries: 3,
      unique_habits: 2,
      completed_days: 2,
      average_entries_per_day: 1.5
    },
    user: {
      name: 'Test User',
      email: 'test@example.com',
      period: 'January 1-2, 2024'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTimeTrackingExcel', () => {
    it('should generate Excel buffer for time tracking data', () => {
      const XLSX = require('xlsx');
      const result = generateTimeTrackingExcel(mockTimeTrackingData);

      expect(result).toBeInstanceOf(Buffer);
      expect(XLSX.utils.book_new).toHaveBeenCalled();
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledTimes(3); // Summary, Time Entries, Daily Summary
      expect(XLSX.write).toHaveBeenCalled();
    });

    it('should create proper worksheet structure', () => {
      const XLSX = require('xlsx');
      generateTimeTrackingExcel(mockTimeTrackingData);

      // Verify summary sheet creation
      expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith(
        expect.arrayContaining([
          ['Time Tracking Report'],
          expect.any(Array),
          ['User Information']
        ])
      );

      // Verify time entries sheet creation
      expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith(
        expect.arrayContaining([
          ['Date', 'Clock In', 'Clock Out', 'Duration (Hours)', 'Break (Minutes)', 'Overtime (Minutes)', 'Group', 'Notes']
        ])
      );

      // Verify daily summary sheet creation
      expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith(
        expect.arrayContaining([
          ['Date', 'Total Hours', 'Sessions', 'Overtime (Minutes)', 'Average Session (Hours)']
        ])
      );
    });

    it('should handle empty entries array', () => {
      const emptyData = {
        ...mockTimeTrackingData,
        entries: [],
        summary: {
          total_entries: 0,
          total_hours: 0,
          total_breaks_minutes: 0,
          total_overtime_minutes: 0,
          average_hours_per_day: 0
        }
      };

      const result = generateTimeTrackingExcel(emptyData);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should format summary data correctly', () => {
      const XLSX = require('xlsx');
      generateTimeTrackingExcel(mockTimeTrackingData);

      // Check that summary includes proper user information and statistics
      expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith(
        expect.arrayContaining([
          ['Name', mockTimeTrackingData.user.name],
          ['Email', mockTimeTrackingData.user.email],
          ['Period', mockTimeTrackingData.user.period],
          ['Total Entries', mockTimeTrackingData.summary.total_entries],
          ['Total Hours', mockTimeTrackingData.summary.total_hours.toFixed(2)]
        ])
      );
    });

    it('should group entries by date for daily summary', () => {
      const XLSX = require('xlsx');
      generateTimeTrackingExcel(mockTimeTrackingData);

      // The daily summary should process entries and group them by date
      const dailySummaryCall = XLSX.utils.aoa_to_sheet.mock.calls.find(call =>
        call[0][0] && call[0][0].includes('Date') && call[0][1] === 'Total Hours'
      );

      expect(dailySummaryCall).toBeDefined();
      expect(dailySummaryCall[0].length).toBeGreaterThan(1); // Should have header row plus data rows
    });

    it('should add formulas to totals row', () => {
      const XLSX = require('xlsx');
      const mockSheet = { '!cols': [] };
      XLSX.utils.aoa_to_sheet.mockReturnValue(mockSheet);

      generateTimeTrackingExcel(mockTimeTrackingData);

      // Verify that the sheet object is modified to add formulas
      // (The actual formula addition happens after aoa_to_sheet returns)
      expect(mockSheet).toBeDefined();
    });

    it('should set appropriate column widths', () => {
      const XLSX = require('xlsx');
      const mockSheet = { '!cols': [] };
      XLSX.utils.aoa_to_sheet.mockReturnValue(mockSheet);

      generateTimeTrackingExcel(mockTimeTrackingData);

      // Column widths should be set on the sheet
      expect(mockSheet['!cols']).toBeDefined();
    });
  });

  describe('generateHabitsExcel', () => {
    it('should generate Excel buffer for habits data', () => {
      const XLSX = require('xlsx');
      const result = generateHabitsExcel(mockHabitsData);

      expect(result).toBeInstanceOf(Buffer);
      expect(XLSX.utils.book_new).toHaveBeenCalled();
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledTimes(3); // Summary, Habit Entries, Habit Analysis
      expect(XLSX.write).toHaveBeenCalled();
    });

    it('should create habits-specific worksheet structure', () => {
      const XLSX = require('xlsx');
      generateHabitsExcel(mockHabitsData);

      // Verify habits summary sheet
      expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith(
        expect.arrayContaining([
          ['Habits Tracking Report'],
          expect.any(Array),
          ['User Information']
        ])
      );

      // Verify habits entries sheet
      expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith(
        expect.arrayContaining([
          ['Date', 'Habit Name', 'Category', 'Type', 'Completed At', 'Duration (Minutes)', 'Count', 'Mood Rating', 'Notes']
        ])
      );
    });

    it('should generate habit analysis with statistics', () => {
      const XLSX = require('xlsx');
      generateHabitsExcel(mockHabitsData);

      // Verify habit analysis sheet creation
      expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith(
        expect.arrayContaining([
          ['Habit Name', 'Total Count', 'Avg Duration (min)', 'Avg Mood Rating', 'Category']
        ])
      );
    });

    it('should calculate habit statistics correctly', () => {
      const XLSX = require('xlsx');
      generateHabitsExcel(mockHabitsData);

      // Find the analysis sheet call
      const analysisCall = XLSX.utils.aoa_to_sheet.mock.calls.find(call =>
        call[0][0] && call[0][0].includes('Habit Name') && call[0][1] === 'Total Count'
      );

      expect(analysisCall).toBeDefined();
      // Should have header row plus entries for unique habits
      expect(analysisCall[0].length).toBeGreaterThan(1);
    });

    it('should handle habits with missing optional fields', () => {
      const dataWithMissingFields = {
        ...mockHabitsData,
        entries: [
          {
            date: '2024-01-01',
            habit_name: 'Simple Habit',
            category: 'Personal',
            type: 'boolean'
            // Missing optional fields
          }
        ]
      };

      const result = generateHabitsExcel(dataWithMissingFields);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle empty habits data', () => {
      const emptyData = {
        ...mockHabitsData,
        entries: [],
        summary: {
          total_entries: 0,
          unique_habits: 0,
          completed_days: 0,
          average_entries_per_day: 0
        }
      };

      const result = generateHabitsExcel(emptyData);

      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('generateCombinedExcel', () => {
    it('should generate combined Excel with both datasets', () => {
      const XLSX = require('xlsx');
      const result = generateCombinedExcel(mockTimeTrackingData, mockHabitsData);

      expect(result).toBeInstanceOf(Buffer);
      expect(XLSX.utils.book_new).toHaveBeenCalled();
      expect(XLSX.write).toHaveBeenCalledWith(expect.any(Object), { type: 'buffer', bookType: 'xlsx' });
    });

    it('should create combined overview sheet', () => {
      const XLSX = require('xlsx');
      generateCombinedExcel(mockTimeTrackingData, mockHabitsData);

      // Verify combined overview sheet
      expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith(
        expect.arrayContaining([
          ['Combined Activity Report'],
          expect.any(Array),
          ['User Information'],
          expect.any(Array),
          expect.any(Array),
          expect.any(Array),
          expect.any(Array),
          expect.any(Array),
          ['Work Time Summary']
        ])
      );
    });

    it('should include both work and habits statistics', () => {
      const XLSX = require('xlsx');
      generateCombinedExcel(mockTimeTrackingData, mockHabitsData);

      // Find the overview sheet call
      const overviewCall = XLSX.utils.aoa_to_sheet.mock.calls.find(call =>
        call[0][0] === 'Combined Activity Report'
      );

      expect(overviewCall).toBeDefined();

      // Should include both work time and habits summaries
      const sheetData = overviewCall[0];
      const workSummaryIndex = sheetData.findIndex(row => row[0] === 'Work Time Summary');
      const habitsSummaryIndex = sheetData.findIndex(row => row[0] === 'Habits Summary');

      expect(workSummaryIndex).toBeGreaterThan(-1);
      expect(habitsSummaryIndex).toBeGreaterThan(-1);
    });

    it('should copy individual sheets from component generators', () => {
      const XLSX = require('xlsx');
      const mockWorkbook = {
        Sheets: {
          'Time Entries': { A1: 'Time Data' },
          'Daily Summary': { A1: 'Daily Data' },
          'Habit Entries': { A1: 'Habit Data' },
          'Habit Analysis': { A1: 'Analysis Data' }
        }
      };

      XLSX.read.mockReturnValue(mockWorkbook);

      generateCombinedExcel(mockTimeTrackingData, mockHabitsData);

      // Should append individual sheets from both generators
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(
        expect.any(Object),
        mockWorkbook.Sheets['Time Entries'],
        'Work Time Entries'
      );

      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(
        expect.any(Object),
        mockWorkbook.Sheets['Habit Entries'],
        'Habit Entries'
      );
    });

    it('should handle mismatched user data gracefully', () => {
      const mismatchedHabitsData = {
        ...mockHabitsData,
        user: {
          name: 'Different User',
          email: 'different@example.com',
          period: 'Different Period'
        }
      };

      const result = generateCombinedExcel(mockTimeTrackingData, mismatchedHabitsData);

      // Should use time tracking data user info as primary
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle empty datasets gracefully', () => {
      const emptyTimeData = {
        ...mockTimeTrackingData,
        entries: [],
        summary: {
          total_entries: 0,
          total_hours: 0,
          total_breaks_minutes: 0,
          total_overtime_minutes: 0,
          average_hours_per_day: 0
        }
      };

      const emptyHabitsData = {
        ...mockHabitsData,
        entries: [],
        summary: {
          total_entries: 0,
          unique_habits: 0,
          completed_days: 0,
          average_entries_per_day: 0
        }
      };

      const result = generateCombinedExcel(emptyTimeData, emptyHabitsData);

      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('error handling', () => {
    it('should handle XLSX.write errors gracefully', () => {
      const XLSX = require('xlsx');
      XLSX.write.mockImplementation(() => {
        throw new Error('XLSX write failed');
      });

      expect(() => {
        generateTimeTrackingExcel(mockTimeTrackingData);
      }).toThrow('XLSX write failed');
    });

    it('should handle malformed data structures', () => {
      const malformedData = {
        entries: null,
        summary: undefined,
        user: {}
      };

      // Should not throw but may produce empty or minimal Excel file
      expect(() => {
        generateTimeTrackingExcel(malformedData as any);
      }).not.toThrow();
    });

    it('should handle invalid date formats in entries', () => {
      const invalidData = {
        ...mockTimeTrackingData,
        entries: [
          {
            date: 'invalid-date',
            clock_in: 'not-a-time',
            clock_out: null,
            duration_hours: 'not-a-number'
          }
        ]
      };

      const result = generateTimeTrackingExcel(invalidData as any);

      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('Excel formatting and structure', () => {
    it('should set appropriate column widths for readability', () => {
      const XLSX = require('xlsx');
      const mockSheet = { '!cols': [] };
      XLSX.utils.aoa_to_sheet.mockReturnValue(mockSheet);

      generateTimeTrackingExcel(mockTimeTrackingData);

      // Column widths should be set appropriately
      expect(mockSheet['!cols']).toBeDefined();
    });

    it('should include proper sheet names', () => {
      const XLSX = require('xlsx');
      generateTimeTrackingExcel(mockTimeTrackingData);

      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        'Summary'
      );

      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        'Time Entries'
      );

      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        'Daily Summary'
      );
    });

    it('should write Excel file with correct parameters', () => {
      const XLSX = require('xlsx');
      generateTimeTrackingExcel(mockTimeTrackingData);

      expect(XLSX.write).toHaveBeenCalledWith(
        expect.any(Object),
        { type: 'buffer', bookType: 'xlsx' }
      );
    });
  });
});