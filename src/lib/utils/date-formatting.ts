/**
 * Date and Time Formatting Utilities
 *
 * Locale-aware date and time formatting using JavaScript Intl API
 */

import { SupportedLanguage } from '../types/language-config';

export interface DateFormatOptions {
  locale?: string;
  dateStyle?: 'full' | 'long' | 'medium' | 'short';
  timeStyle?: 'full' | 'long' | 'medium' | 'short';
  format?: 'date' | 'time' | 'datetime';
  customFormat?: Intl.DateTimeFormatOptions;
}

export interface DurationFormatOptions {
  locale?: string;
  style?: 'long' | 'short' | 'narrow';
  units?: ('hours' | 'minutes' | 'seconds')[];
}

/**
 * Format date according to locale conventions
 */
export function formatDate(
  date: Date | string | number,
  options: DateFormatOptions = {}
): string {
  const {
    locale = 'en-US',
    dateStyle = 'medium',
    format = 'date',
    customFormat
  } = options;

  try {
    const dateObj = new Date(date);

    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date provided to formatDate:', date);
      return String(date);
    }

    let formatOptions: Intl.DateTimeFormatOptions;

    if (customFormat) {
      formatOptions = customFormat;
    } else if (format === 'date') {
      formatOptions = { dateStyle };
    } else {
      // Default to medium date format
      formatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      };
    }

    return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj);
  } catch (error) {
    console.error('Date formatting error:', error);
    return String(date);
  }
}

/**
 * Format time according to locale conventions
 */
export function formatTime(
  date: Date | string | number,
  options: DateFormatOptions = {}
): string {
  const {
    locale = 'en-US',
    timeStyle = 'short',
    customFormat
  } = options;

  try {
    const dateObj = new Date(date);

    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date provided to formatTime:', date);
      return String(date);
    }

    let formatOptions: Intl.DateTimeFormatOptions;

    if (customFormat) {
      formatOptions = customFormat;
    } else {
      formatOptions = { timeStyle };
    }

    return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj);
  } catch (error) {
    console.error('Time formatting error:', error);
    return String(date);
  }
}

/**
 * Format date and time together
 */
export function formatDateTime(
  date: Date | string | number,
  options: DateFormatOptions = {}
): string {
  const {
    locale = 'en-US',
    dateStyle = 'medium',
    timeStyle = 'short',
    customFormat
  } = options;

  try {
    const dateObj = new Date(date);

    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date provided to formatDateTime:', date);
      return String(date);
    }

    let formatOptions: Intl.DateTimeFormatOptions;

    if (customFormat) {
      formatOptions = customFormat;
    } else {
      formatOptions = { dateStyle, timeStyle };
    }

    return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj);
  } catch (error) {
    console.error('DateTime formatting error:', error);
    return String(date);
  }
}

/**
 * Format duration in hours and minutes
 */
export function formatDuration(
  minutes: number,
  options: DurationFormatOptions = {}
): string {
  const {
    locale = 'en-US',
    style = 'long',
    units = ['hours', 'minutes']
  } = options;

  try {
    if (typeof minutes !== 'number' || isNaN(minutes) || minutes < 0) {
      console.warn('Invalid minutes provided to formatDuration:', minutes);
      return '0 minutes';
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    const totalSeconds = Math.floor((minutes * 60) % 60);

    // Use Intl.RelativeTimeFormat for localized units when available
    const parts: string[] = [];

    if (units.includes('hours') && hours > 0) {
      if (style === 'short') {
        parts.push(`${hours}h`);
      } else if (style === 'narrow') {
        parts.push(`${hours}h`);
      } else {
        const hourText = hours === 1 ? 'hour' : 'hours';
        parts.push(`${hours} ${hourText}`);
      }
    }

    if (units.includes('minutes') && (remainingMinutes > 0 || hours === 0)) {
      if (style === 'short') {
        parts.push(`${remainingMinutes}m`);
      } else if (style === 'narrow') {
        parts.push(`${remainingMinutes}m`);
      } else {
        const minuteText = remainingMinutes === 1 ? 'minute' : 'minutes';
        parts.push(`${remainingMinutes} ${minuteText}`);
      }
    }

    if (units.includes('seconds') && totalSeconds > 0) {
      if (style === 'short') {
        parts.push(`${totalSeconds}s`);
      } else if (style === 'narrow') {
        parts.push(`${totalSeconds}s`);
      } else {
        const secondText = totalSeconds === 1 ? 'second' : 'seconds';
        parts.push(`${totalSeconds} ${secondText}`);
      }
    }

    return parts.length > 0 ? parts.join(' ') : '0 minutes';
  } catch (error) {
    console.error('Duration formatting error:', error);
    return '0 minutes';
  }
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(
  date: Date | string | number,
  options: { locale?: string; numeric?: 'always' | 'auto' } = {}
): string {
  const { locale = 'en-US', numeric = 'auto' } = options;

  try {
    const dateObj = new Date(date);
    const now = new Date();

    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date provided to formatRelativeTime:', date);
      return String(date);
    }

    const diffMs = dateObj.getTime() - now.getTime();
    const diffSeconds = Math.round(diffMs / 1000);
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric });

    // Choose appropriate unit based on time difference
    if (Math.abs(diffDays) >= 1) {
      return rtf.format(diffDays, 'day');
    } else if (Math.abs(diffHours) >= 1) {
      return rtf.format(diffHours, 'hour');
    } else if (Math.abs(diffMinutes) >= 1) {
      return rtf.format(diffMinutes, 'minute');
    } else {
      return rtf.format(diffSeconds, 'second');
    }
  } catch (error) {
    console.error('Relative time formatting error:', error);
    return String(date);
  }
}

/**
 * Get locale-specific date format pattern
 */
export function getDateFormatPattern(locale: string = 'en-US'): string {
  try {
    // Create a known date and format it to detect the pattern
    const sampleDate = new Date(2023, 11, 25); // December 25, 2023
    const formatted = new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(sampleDate);

    // Analyze the formatted result to determine pattern
    if (formatted.includes('12/25/2023') || formatted.includes('12-25-2023')) {
      return 'MM/dd/yyyy';
    } else if (formatted.includes('25/12/2023') || formatted.includes('25-12-2023')) {
      return 'dd/MM/yyyy';
    } else if (formatted.includes('25.12.2023')) {
      return 'dd.MM.yyyy';
    } else if (formatted.includes('2023/12/25') || formatted.includes('2023-12-25')) {
      return 'yyyy/MM/dd';
    }

    // Default fallback
    return 'MM/dd/yyyy';
  } catch (error) {
    console.error('Date pattern detection error:', error);
    return 'MM/dd/yyyy';
  }
}

/**
 * Utility for common time tracking date formats
 */
export const timeTrackingFormats = {
  /**
   * Format for date display in time entries
   */
  entryDate: (date: Date | string | number, locale?: string) =>
    formatDate(date, { locale, dateStyle: 'medium' }),

  /**
   * Format for time display in time entries
   */
  entryTime: (date: Date | string | number, locale?: string) =>
    formatTime(date, { locale, timeStyle: 'short' }),

  /**
   * Format for date range display
   */
  dateRange: (startDate: Date | string | number, endDate: Date | string | number, locale?: string) => {
    const start = formatDate(startDate, { locale, dateStyle: 'short' });
    const end = formatDate(endDate, { locale, dateStyle: 'short' });
    return `${start} - ${end}`;
  },

  /**
   * Format for weekly summary headers
   */
  weekOf: (date: Date | string | number, locale?: string) => {
    const weekStart = new Date(date);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    return `Week of ${formatDate(weekStart, { locale, dateStyle: 'medium' })}`;
  },

  /**
   * Format for monthly summary headers
   */
  monthOf: (date: Date | string | number, locale?: string) =>
    formatDate(date, {
      locale,
      customFormat: { year: 'numeric', month: 'long' }
    })
};