import { describe, it, expect } from 'vitest';
import { formatCurrency, parseCurrency, formatCompact, percentage } from '@core/utils/currency';
import type { AppSettings } from '@core/database/types';

const mockSettings: AppSettings = {
  appName: 'Test',
  currency: 'INR',
  currencySymbol: '₹',
  dateFormat: 'DD/MM/YYYY',
  language: 'en',
  themeMode: 'light',
  showCents: true,
  compactMode: false,
  enableBudgetAlerts: true,
  enableGoalReminders: true,
  enableLoanDueAlerts: true,
  weekStartDay: 1,
  decimalPlaces: 2,
  decimalSeparator: '.',
  thousandSeparator: ',',
  autoBackup: false,
};

describe('formatCurrency', () => {
  it('formats positive values', () => {
    const result = formatCurrency(1000, mockSettings);
    expect(result).toContain('1,000');
    expect(result).toContain('₹');
  });

  it('formats zero as zero', () => {
    const result = formatCurrency(0, mockSettings);
    expect(result).toContain('0');
  });

  it('formats negative values', () => {
    const result = formatCurrency(-500, mockSettings);
    expect(result).toContain('500');
  });

  it('hides cents when showCents=false', () => {
    const result = formatCurrency(1000.50, mockSettings, false);
    expect(result).not.toContain('.50');
  });
});

describe('parseCurrency', () => {
  it('strips currency symbol', () => {
    expect(parseCurrency('₹1,000')).toBe(1000);
  });

  it('handles plain numbers', () => {
    expect(parseCurrency('500.75')).toBe(500.75);
  });

  it('returns 0 for invalid input', () => {
    expect(parseCurrency('abc')).toBe(0);
  });
});

describe('formatCompact', () => {
  it('formats thousands as K', () => {
    expect(formatCompact(5000, '₹')).toContain('K');
  });

  it('formats lakhs as L (Indian format)', () => {
    const result = formatCompact(150000, '₹');
    expect(result).toContain('L');
  });

  it('formats crores', () => {
    const result = formatCompact(10000000, '₹');
    expect(result).toContain('Cr');
  });
});

describe('percentage', () => {
  it('calculates percentage correctly', () => {
    expect(percentage(50, 200)).toBe(25);
  });

  it('returns 0 when total is 0', () => {
    expect(percentage(50, 0)).toBe(0);
  });

  it('can exceed 100', () => {
    expect(percentage(150, 100)).toBe(150);
  });
});
