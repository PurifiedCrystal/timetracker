import { timeEntries } from '@/lib/database';
import {
  ExportFormat,
  GenerateExportRequest,
  GenerateExportResponse,
  ExportConfiguration,
  CreateExportConfigData,
  UpdateExportConfigData,
  ExportTimeEntry,
  ExportSummary,
  generateExportFilename,
  getExportFormatMimeType,
  formatExportDateRange
} from '@/types/export';
import { TimeEntryService } from './TimeEntryService';
import { UserService } from './UserService';

export class ExportService {
  /**
   * Generate export file for user's time entries
   */
  static async generateExport(userId: string, request: GenerateExportRequest): Promise<{ data: GenerateExportResponse | null; error: string | null }> {
    try {
      // Get time entries for the specified period
      const { data: timeEntriesData, error: timeEntriesError } = await TimeEntryService.getTimeEntriesForPeriod(
        userId,
        request.start_date,
        request.end_date
      );

      if (timeEntriesError) {
        return { data: null, error: timeEntriesError };
      }

      if (!timeEntriesData) {
        return { data: null, error: 'Failed to fetch time entries' };
      }

      // Get user timezone for proper formatting
      const userTimezone = await UserService.getUserTimezone(userId);

      // Transform time entries for export
      const exportEntries: ExportTimeEntry[] = timeEntriesData
        .filter(entry => entry.clock_out !== null)
        .map(entry => ({
          date: new Date(entry.clock_in).toLocaleDateString(),
          clock_in: this.formatTimeForExport(entry.clock_in, userTimezone),
          clock_out: this.formatTimeForExport(entry.clock_out!, userTimezone),
          duration_hours: Math.round((entry.duration_minutes || 0) / 60 * 100) / 100,
          break_minutes: entry.break_minutes,
          overtime_hours: Math.round(entry.overtime_minutes / 60 * 100) / 100,
          location: entry.metadata?.location || '',
          project: entry.metadata?.project || '',
          notes: entry.metadata?.notes || '',
        }));

      // Create export summary
      const exportSummary: ExportSummary = {
        period_start: request.start_date,
        period_end: request.end_date,
        total_entries: exportEntries.length,
        total_hours: Math.round(exportEntries.reduce((sum, entry) => sum + entry.duration_hours, 0) * 100) / 100,
        total_overtime_hours: Math.round(exportEntries.reduce((sum, entry) => sum + entry.overtime_hours, 0) * 100) / 100,
        total_break_minutes: exportEntries.reduce((sum, entry) => sum + entry.break_minutes, 0),
        entries: exportEntries,
      };

      // Generate file content based on format
      let fileContent: string | Buffer;
      let mimeType: string;

      switch (request.format) {
        case 'csv':
          fileContent = await this.generateCSVContent(exportSummary, request);
          mimeType = getExportFormatMimeType('csv');
          break;
        case 'pdf':
          fileContent = await this.generatePDFContent(exportSummary, request);
          mimeType = getExportFormatMimeType('pdf');
          break;
        case 'xlsx':
          fileContent = await this.generateExcelContent(exportSummary, request);
          mimeType = getExportFormatMimeType('xlsx');
          break;
        default:
          return { data: null, error: 'Unsupported export format' };
      }

      // Generate filename
      const filename = generateExportFilename(
        request.format,
        request.start_date,
        request.end_date,
        userId
      );

      // In a real implementation, you would upload to cloud storage
      // For now, we'll create a mock response
      const downloadUrl = `/api/v1/exports/download/${userId}/${filename}`;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

      return {
        data: {
          download_url: downloadUrl,
          expires_at: expiresAt,
          file_size: Buffer.isBuffer(fileContent) ? fileContent.length : Buffer.from(fileContent).length,
          format: request.format,
        },
        error: null,
      };

    } catch (err) {
      console.error('Export generation error:', err);
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown export error'
      };
    }
  }

  /**
   * Get user's export configurations
   */
  static async getExportConfigurations(userId: string): Promise<{ data: ExportConfiguration[] | null; error: string | null }> {
    // Mock implementation - in real app would use database
    return {
      data: [],
      error: null
    };
  }

  /**
   * Create export configuration
   */
  static async createExportConfiguration(configData: CreateExportConfigData): Promise<{ data: ExportConfiguration | null; error: string | null }> {
    // Validate configuration
    if (!configData.name.trim()) {
      return { data: null, error: 'Export configuration name is required' };
    }

    if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(configData.schedule_time)) {
      return { data: null, error: 'Invalid schedule time format. Use HH:MM' };
    }

    if (configData.email_recipients && configData.email_recipients.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = configData.email_recipients.filter(email => !emailRegex.test(email.trim()));
      if (invalidEmails.length > 0) {
        return { data: null, error: `Invalid email addresses: ${invalidEmails.join(', ')}` };
      }
    }

    // Mock implementation
    const mockConfig: ExportConfiguration = {
      id: `config_${Date.now()}`,
      user_id: configData.user_id,
      name: configData.name,
      format: configData.format,
      frequency: configData.frequency,
      schedule_time: configData.schedule_time,
      email_recipients: configData.email_recipients || [],
      date_range_days: configData.date_range_days || 30,
      is_active: configData.is_active !== false,
      created_at: new Date().toISOString(),
      last_sent_at: null,
    };

    return { data: mockConfig, error: null };
  }

  /**
   * Update export configuration
   */
  static async updateExportConfiguration(
    userId: string,
    configId: string,
    updates: UpdateExportConfigData
  ): Promise<{ data: ExportConfiguration | null; error: string | null }> {
    // Validation similar to create
    if (updates.schedule_time && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(updates.schedule_time)) {
      return { data: null, error: 'Invalid schedule time format. Use HH:MM' };
    }

    // Mock implementation
    return { data: null, error: 'Configuration not found' };
  }

  /**
   * Delete export configuration
   */
  static async deleteExportConfiguration(userId: string, configId: string): Promise<{ data: boolean; error: string | null }> {
    // Mock implementation
    return { data: false, error: 'Configuration not found' };
  }

  /**
   * Process scheduled exports (called by cron job)
   */
  static async processScheduledExports(): Promise<{ processed: number; errors: number }> {
    // Mock implementation - would query active configurations and send emails
    return { processed: 0, errors: 0 };
  }

  /**
   * Format time for export display
   */
  private static formatTimeForExport(isoString: string, timezone: string): string {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return new Date(isoString).toLocaleString();
    }
  }

  /**
   * Generate CSV content
   */
  private static async generateCSVContent(summary: ExportSummary, request: GenerateExportRequest): Promise<string> {
    const headers = [
      'Date',
      'Clock In',
      'Clock Out',
      'Duration (Hours)',
      'Break (Minutes)',
      'Overtime (Hours)',
      'Location',
      'Project',
      'Notes'
    ];

    const rows = summary.entries.map(entry => [
      entry.date,
      entry.clock_in,
      entry.clock_out,
      entry.duration_hours.toString(),
      entry.break_minutes.toString(),
      entry.overtime_hours.toString(),
      entry.location,
      entry.project,
      entry.notes
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Generate PDF content (mock implementation)
   */
  private static async generatePDFContent(summary: ExportSummary, request: GenerateExportRequest): Promise<Buffer> {
    // Mock implementation - in real app would use library like PDFKit or Puppeteer
    const mockPDFContent = `Mock PDF content for ${formatExportDateRange(summary.period_start, summary.period_end)}`;
    return Buffer.from(mockPDFContent);
  }

  /**
   * Generate Excel content (mock implementation)
   */
  private static async generateExcelContent(summary: ExportSummary, request: GenerateExportRequest): Promise<Buffer> {
    // Mock implementation - in real app would use library like ExcelJS
    const mockExcelContent = `Mock Excel content for ${formatExportDateRange(summary.period_start, summary.period_end)}`;
    return Buffer.from(mockExcelContent);
  }
}