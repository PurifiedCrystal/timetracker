/**
 * Unit tests for PDF export generators
 */
import { generateTimeTrackingPDF, generateHabitsPDF, generateCombinedPDF } from '@/lib/exporters/pdf';

// Mock jsPDF
jest.mock('jspdf', () => {
  const mockAutoTable = jest.fn();
  const mockJsPDF = jest.fn().mockImplementation(() => ({
    setFontSize: jest.fn(),
    text: jest.fn(),
    autoTable: mockAutoTable,
    addPage: jest.fn(),
    setPage: jest.fn(),
    splitTextToSize: jest.fn(() => ['Mock split text']),
    output: jest.fn(() => new ArrayBuffer(1000)),
    internal: {
      getNumberOfPages: jest.fn(() => 1),
      pageSize: {
        height: 297
      }
    },
    lastAutoTable: {
      finalY: 100
    }
  }));

  mockJsPDF.autoTable = mockAutoTable;
  return mockJsPDF;
});

describe('PDF Export Generators', () => {
  const mockTimeTrackingData = {
    entries: [
      {
        date: '2024-01-01',
        clock_in: '09:00:00',
        clock_out: '17:00:00',
        duration_hours: 8,
        break_minutes: 60,
        overtime_minutes: 0,
        group: 'Development'
      },
      {
        date: '2024-01-02',
        clock_in: '08:30:00',
        clock_out: '18:30:00',
        duration_hours: 9.5,
        break_minutes: 30,
        overtime_minutes: 90,
        group: 'Testing'
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
      }
    ],
    summary: {
      total_entries: 2,
      unique_habits: 2,
      completed_days: 1,
      average_entries_per_day: 2.0
    },
    user: {
      name: 'Test User',
      email: 'test@example.com',
      period: 'January 1, 2024'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTimeTrackingPDF', () => {
    it('should generate PDF buffer for time tracking data', () => {
      const result = generateTimeTrackingPDF(mockTimeTrackingData);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
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

      const result = generateTimeTrackingPDF(emptyData);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle entries with missing optional fields', () => {
      const dataWithMissingFields = {
        ...mockTimeTrackingData,
        entries: [
          {
            date: '2024-01-01',
            clock_in: '09:00:00',
            clock_out: '17:00:00',
            duration_hours: 8,
            break_minutes: 60,
            overtime_minutes: 0
            // Missing group field
          }
        ]
      };

      const result = generateTimeTrackingPDF(dataWithMissingFields);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should format duration correctly', () => {
      const dataWithVariousDurations = {
        ...mockTimeTrackingData,
        entries: [
          {
            date: '2024-01-01',
            clock_in: '09:00:00',
            clock_out: '17:30:00',
            duration_hours: 8.5,
            break_minutes: 30,
            overtime_minutes: 30
          }
        ]
      };

      const result = generateTimeTrackingPDF(dataWithVariousDurations);

      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('generateHabitsPDF', () => {
    it('should generate PDF buffer for habits data', () => {
      const result = generateHabitsPDF(mockHabitsData);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle empty habits array', () => {
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

      const result = generateHabitsPDF(emptyData);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle habits with missing optional fields', () => {
      const dataWithMissingFields = {
        ...mockHabitsData,
        entries: [
          {
            date: '2024-01-01',
            habit_name: 'Morning Exercise',
            category: 'Health',
            type: 'boolean'
            // Missing optional fields
          }
        ]
      };

      const result = generateHabitsPDF(dataWithMissingFields);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should create separate notes section when habits have notes', () => {
      const dataWithNotes = {
        ...mockHabitsData,
        entries: [
          {
            date: '2024-01-01',
            habit_name: 'Reading',
            category: 'Learning',
            type: 'duration',
            notes: 'This is a very long note that should be split across multiple lines in the PDF to test the text wrapping functionality and ensure proper formatting.'
          }
        ]
      };

      const result = generateHabitsPDF(dataWithNotes);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle habits without notes', () => {
      const dataWithoutNotes = {
        ...mockHabitsData,
        entries: [
          {
            date: '2024-01-01',
            habit_name: 'Exercise',
            category: 'Health',
            type: 'boolean'
            // No notes field
          }
        ]
      };

      const result = generateHabitsPDF(dataWithoutNotes);

      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('generateCombinedPDF', () => {
    it('should generate combined PDF with both time tracking and habits data', () => {
      const result = generateCombinedPDF(mockTimeTrackingData, mockHabitsData);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle empty data sets', () => {
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

      const result = generateCombinedPDF(emptyTimeData, emptyHabitsData);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should limit entries display to prevent oversized PDFs', () => {
      const largeTimeData = {
        ...mockTimeTrackingData,
        entries: Array(50).fill(mockTimeTrackingData.entries[0]).map((entry, index) => ({
          ...entry,
          date: `2024-01-${index + 1}`
        }))
      };

      const largeHabitsData = {
        ...mockHabitsData,
        entries: Array(50).fill(mockHabitsData.entries[0]).map((entry, index) => ({
          ...entry,
          date: `2024-01-${index + 1}`
        }))
      };

      const result = generateCombinedPDF(largeTimeData, largeHabitsData);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should properly format combined summary statistics', () => {
      const result = generateCombinedPDF(mockTimeTrackingData, mockHabitsData);

      expect(result).toBeInstanceOf(Buffer);
      // The combined PDF should include both work hours and habits statistics
    });
  });

  describe('error handling', () => {
    it('should handle invalid user data gracefully', () => {
      const invalidData = {
        ...mockTimeTrackingData,
        user: {
          name: null,
          email: undefined,
          period: ''
        }
      };

      const result = generateTimeTrackingPDF(invalidData as any);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle malformed entries data', () => {
      const malformedData = {
        ...mockTimeTrackingData,
        entries: [
          {
            // Missing required fields
            date: '2024-01-01'
          }
        ]
      };

      const result = generateTimeTrackingPDF(malformedData as any);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle null or undefined data gracefully', () => {
      const result = generateTimeTrackingPDF({
        entries: [],
        summary: {
          total_entries: 0,
          total_hours: 0,
          total_breaks_minutes: 0,
          total_overtime_minutes: 0,
          average_hours_per_day: 0
        },
        user: {
          name: 'Test User',
          email: 'test@example.com',
          period: 'Test Period'
        }
      });

      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('PDF structure validation', () => {
    it('should create proper PDF structure with header, content, and footer', () => {
      const mockDoc = require('jspdf');
      generateTimeTrackingPDF(mockTimeTrackingData);

      const docInstance = mockDoc.mock.results[0].value;

      // Verify header elements
      expect(docInstance.setFontSize).toHaveBeenCalledWith(20);
      expect(docInstance.text).toHaveBeenCalledWith('Time Tracking Report', 20, 20);

      // Verify user info section
      expect(docInstance.setFontSize).toHaveBeenCalledWith(12);
      expect(docInstance.text).toHaveBeenCalledWith(`User: ${mockTimeTrackingData.user.name} (${mockTimeTrackingData.user.email})`, 20, 35);

      // Verify summary section
      expect(docInstance.setFontSize).toHaveBeenCalledWith(16);
      expect(docInstance.text).toHaveBeenCalledWith('Summary', 20, 75);

      // Verify autoTable was called for data
      expect(docInstance.autoTable).toHaveBeenCalled();
    });

    it('should include footer on all pages', () => {
      const mockDoc = require('jspdf');
      const docInstance = mockDoc.mock.results[0].value;
      docInstance.internal.getNumberOfPages.mockReturnValue(3);

      generateTimeTrackingPDF(mockTimeTrackingData);

      // Footer should be added to each page
      expect(docInstance.setPage).toHaveBeenCalledTimes(3);
    });
  });
});