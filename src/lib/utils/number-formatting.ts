/**
 * Number and Currency Formatting Utilities
 *
 * Locale-aware number, currency, and percentage formatting using JavaScript Intl API
 */

export interface NumberFormatOptions {
  locale?: string;
  style?: 'decimal' | 'currency' | 'percent' | 'unit';
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  useGrouping?: boolean;
  signDisplay?: 'auto' | 'never' | 'always' | 'exceptZero';
}

export interface CurrencyFormatOptions extends NumberFormatOptions {
  currency: string;
  currencyDisplay?: 'symbol' | 'code' | 'name';
}

export interface PercentageFormatOptions extends NumberFormatOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

/**
 * Format number according to locale conventions
 */
export function formatNumber(
  value: number,
  options: NumberFormatOptions = {}
): string {
  const {
    locale = 'en-US',
    style = 'decimal',
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping = true,
    signDisplay = 'auto'
  } = options;

  try {
    if (typeof value !== 'number' || isNaN(value)) {
      console.warn('Invalid number provided to formatNumber:', value);
      return '0';
    }

    const formatOptions: Intl.NumberFormatOptions = {
      style,
      useGrouping,
      signDisplay
    };

    if (minimumFractionDigits !== undefined) {
      formatOptions.minimumFractionDigits = minimumFractionDigits;
    }

    if (maximumFractionDigits !== undefined) {
      formatOptions.maximumFractionDigits = maximumFractionDigits;
    }

    return new Intl.NumberFormat(locale, formatOptions).format(value);
  } catch (error) {
    console.error('Number formatting error:', error);
    return String(value);
  }
}

/**
 * Format currency according to locale conventions
 */
export function formatCurrency(
  value: number,
  options: CurrencyFormatOptions
): string {
  const {
    locale = 'en-US',
    currency,
    currencyDisplay = 'symbol',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    useGrouping = true,
    signDisplay = 'auto'
  } = options;

  try {
    if (typeof value !== 'number' || isNaN(value)) {
      console.warn('Invalid number provided to formatCurrency:', value);
      return `${currency} 0.00`;
    }

    if (!currency) {
      throw new Error('Currency code is required for currency formatting');
    }

    const formatOptions: Intl.NumberFormatOptions = {
      style: 'currency',
      currency,
      currencyDisplay,
      minimumFractionDigits,
      maximumFractionDigits,
      useGrouping,
      signDisplay
    };

    return new Intl.NumberFormat(locale, formatOptions).format(value);
  } catch (error) {
    console.error('Currency formatting error:', error);
    return `${currency || '$'} ${value.toFixed(2)}`;
  }
}

/**
 * Format percentage according to locale conventions
 */
export function formatPercentage(
  value: number,
  options: PercentageFormatOptions = {}
): string {
  const {
    locale = 'en-US',
    minimumFractionDigits = 0,
    maximumFractionDigits = 1,
    useGrouping = true,
    signDisplay = 'auto'
  } = options;

  try {
    if (typeof value !== 'number' || isNaN(value)) {
      console.warn('Invalid number provided to formatPercentage:', value);
      return '0%';
    }

    const formatOptions: Intl.NumberFormatOptions = {
      style: 'percent',
      minimumFractionDigits,
      maximumFractionDigits,
      useGrouping,
      signDisplay
    };

    return new Intl.NumberFormat(locale, formatOptions).format(value);
  } catch (error) {
    console.error('Percentage formatting error:', error);
    return `${(value * 100).toFixed(maximumFractionDigits)}%`;
  }
}

/**
 * Format hours with decimal precision
 */
export function formatHours(
  hours: number,
  options: NumberFormatOptions = {}
): string {
  const {
    locale = 'en-US',
    minimumFractionDigits = 1,
    maximumFractionDigits = 2
  } = options;

  try {
    if (typeof hours !== 'number' || isNaN(hours)) {
      console.warn('Invalid hours provided to formatHours:', hours);
      return '0.0h';
    }

    const formatted = formatNumber(hours, {
      locale,
      minimumFractionDigits,
      maximumFractionDigits
    });

    // Add 'h' suffix for hours
    return `${formatted}h`;
  } catch (error) {
    console.error('Hours formatting error:', error);
    return `${hours.toFixed(1)}h`;
  }
}

/**
 * Format rate (e.g., hourly rate)
 */
export function formatRate(
  rate: number,
  currency: string = 'USD',
  options: Partial<CurrencyFormatOptions> = {}
): string {
  const {
    locale = 'en-US',
    currencyDisplay = 'symbol',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2
  } = options;

  try {
    const formattedAmount = formatCurrency(rate, {
      locale,
      currency,
      currencyDisplay,
      minimumFractionDigits,
      maximumFractionDigits
    });

    return `${formattedAmount}/hr`;
  } catch (error) {
    console.error('Rate formatting error:', error);
    return `${currency} ${rate.toFixed(2)}/hr`;
  }
}

/**
 * Format large numbers with abbreviations (K, M, B)
 */
export function formatCompactNumber(
  value: number,
  options: NumberFormatOptions = {}
): string {
  const {
    locale = 'en-US',
    minimumFractionDigits = 0,
    maximumFractionDigits = 1
  } = options;

  try {
    if (typeof value !== 'number' || isNaN(value)) {
      console.warn('Invalid number provided to formatCompactNumber:', value);
      return '0';
    }

    // Use Intl.NumberFormat with compact notation if available
    const formatOptions: Intl.NumberFormatOptions = {
      notation: 'compact',
      compactDisplay: 'short',
      minimumFractionDigits,
      maximumFractionDigits
    };

    return new Intl.NumberFormat(locale, formatOptions).format(value);
  } catch (error) {
    // Fallback for browsers that don't support compact notation
    console.warn('Compact number formatting not supported, using fallback:', error);

    if (Math.abs(value) >= 1e9) {
      return `${(value / 1e9).toFixed(1)}B`;
    } else if (Math.abs(value) >= 1e6) {
      return `${(value / 1e6).toFixed(1)}M`;
    } else if (Math.abs(value) >= 1e3) {
      return `${(value / 1e3).toFixed(1)}K`;
    } else {
      return formatNumber(value, { locale, maximumFractionDigits });
    }
  }
}

/**
 * Get number format info for a locale
 */
export function getNumberFormatInfo(locale: string = 'en-US') {
  try {
    // Use a sample number to detect formatting patterns
    const sampleNumber = 1234.56;
    const formatted = new Intl.NumberFormat(locale).format(sampleNumber);

    // Detect decimal separator
    const decimalSeparator = formatted.includes(',') && formatted.includes('.')
      ? (formatted.indexOf(',') > formatted.indexOf('.') ? ',' : '.')
      : formatted.includes(',') ? ',' : '.';

    // Detect thousands separator
    const thousandsSeparator = decimalSeparator === '.' ? ',' :
      (formatted.includes(' ') ? ' ' : '.');

    return {
      decimalSeparator,
      thousandsSeparator,
      sample: formatted
    };
  } catch (error) {
    console.error('Number format detection error:', error);
    return {
      decimalSeparator: '.',
      thousandsSeparator: ',',
      sample: '1,234.56'
    };
  }
}

/**
 * Parse locale-formatted number string back to number
 */
export function parseLocalizedNumber(
  value: string,
  locale: string = 'en-US'
): number {
  try {
    if (typeof value !== 'string') {
      return NaN;
    }

    const formatInfo = getNumberFormatInfo(locale);

    // Remove thousands separators and normalize decimal separator
    let normalized = value
      .replace(new RegExp(`\\${formatInfo.thousandsSeparator}`, 'g'), '')
      .replace(formatInfo.decimalSeparator, '.');

    // Remove any non-numeric characters except decimal point and minus sign
    normalized = normalized.replace(/[^\d.-]/g, '');

    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  } catch (error) {
    console.error('Number parsing error:', error);
    return 0;
  }
}

/**
 * Utility for common time tracking number formats
 */
export const timeTrackingFormats = {
  /**
   * Format hours worked (e.g., "8.5h", "40.0h")
   */
  hoursWorked: (hours: number, locale?: string) =>
    formatHours(hours, { locale, minimumFractionDigits: 1, maximumFractionDigits: 1 }),

  /**
   * Format earnings with currency
   */
  earnings: (amount: number, currency: string = 'USD', locale?: string) =>
    formatCurrency(amount, { locale, currency, minimumFractionDigits: 2 }),

  /**
   * Format hourly rate
   */
  hourlyRate: (rate: number, currency: string = 'USD', locale?: string) =>
    formatRate(rate, currency, { locale }),

  /**
   * Format efficiency percentage
   */
  efficiency: (ratio: number, locale?: string) =>
    formatPercentage(ratio, { locale, maximumFractionDigits: 0 }),

  /**
   * Format total time in compact format
   */
  totalTime: (hours: number, locale?: string) => {
    if (hours >= 1000) {
      return formatCompactNumber(hours, { locale }) + 'h';
    }
    return formatHours(hours, { locale });
  },

  /**
   * Format budget or target amounts
   */
  budget: (amount: number, currency: string = 'USD', locale?: string) =>
    formatCurrency(amount, { locale, currency, minimumFractionDigits: 0, maximumFractionDigits: 0 })
};