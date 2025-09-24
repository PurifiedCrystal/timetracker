export type ExportFormat = 'csv' | 'pdf' | 'xlsx';
export type ExportFrequency = 'daily' | 'weekly' | 'monthly';

export interface ExportConfiguration {
  id: string;
  user_id: string;
  name: string;
  format: ExportFormat;
  frequency: ExportFrequency;
  schedule_time: string; // Time format: "HH:MM"
  email_recipients: string[];
  date_range_days: number;
  is_active: boolean;
  created_at: string;
  last_sent_at: string | null;
}

export interface CreateExportConfigData {
  user_id: string;
  name: string;
  format: ExportFormat;
  frequency: ExportFrequency;
  schedule_time: string;
  email_recipients?: string[];
  date_range_days?: number;
  is_active?: boolean;
}

export interface UpdateExportConfigData {
  name?: string;
  schedule_time?: string;
  email_recipients?: string[];
  date_range_days?: number;
  is_active?: boolean;
}

export interface GenerateExportRequest {
  format: ExportFormat;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  include_breaks?: boolean;
  include_overtime?: boolean;
  group_by?: 'day' | 'week' | 'month';
}

export interface GenerateExportResponse {
  download_url: string;
  expires_at: string;
  file_size?: number;
  format: ExportFormat;
}

export interface ExportFile {
  id: string;
  user_id: string;
  filename: string;
  format: ExportFormat;
  file_path: string;
  file_size: number;
  download_url: string;
  expires_at: string;
  generated_at: string;
  downloaded_at: string | null;
}

// Export data structures
export interface ExportTimeEntry {
  date: string;
  clock_in: string;
  clock_out: string;
  duration_hours: number;
  break_minutes: number;
  overtime_hours: number;
  location?: string;
  project?: string;
  notes?: string;
}

export interface ExportSummary {
  period_start: string;
  period_end: string;
  total_entries: number;
  total_hours: number;
  total_overtime_hours: number;
  total_break_minutes: number;
  entries: ExportTimeEntry[];
}

// Export format configurations
export interface CSVExportConfig {
  delimiter: ',' | ';' | '\t';
  include_headers: boolean;
  date_format: 'ISO' | 'US' | 'EU';
  time_format: '12h' | '24h';
}

export interface PDFExportConfig {
  page_size: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
  include_summary: boolean;
  include_charts: boolean;
  company_logo?: string;
  company_name?: string;
}

export interface ExcelExportConfig {
  include_formulas: boolean;
  include_charts: boolean;
  worksheet_name: string;
  freeze_headers: boolean;
}

// Validation functions
export function isValidExportFormat(format: string): format is ExportFormat {
  return ['csv', 'pdf', 'xlsx'].includes(format);
}

export function isValidExportFrequency(frequency: string): frequency is ExportFrequency {
  return ['daily', 'weekly', 'monthly'].includes(frequency);
}

export function isValidTimeFormat(time: string): boolean {
  return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
}

export function isValidEmailList(emails: string[]): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emails.every(email => emailRegex.test(email.trim()));
}

// Utility functions
export function getExportFormatMimeType(format: ExportFormat): string {
  switch (format) {
    case 'csv':
      return 'text/csv';
    case 'pdf':
      return 'application/pdf';
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    default:
      return 'application/octet-stream';
  }
}

export function getExportFormatExtension(format: ExportFormat): string {
  return format; // csv, pdf, xlsx
}

export function generateExportFilename(
  format: ExportFormat,
  startDate: string,
  endDate: string,
  userId?: string
): string {
  const start = startDate.replace(/-/g, '');
  const end = endDate.replace(/-/g, '');
  const userSuffix = userId ? `_${userId.substring(0, 8)}` : '';

  return `timetracker_${start}_${end}${userSuffix}.${format}`;
}

export function formatExportDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };

  return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
}