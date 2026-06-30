import { describe, it, expect } from 'vitest';
import dayjs from 'dayjs';
import { formatDate, daysUntil, isOverdue, monthsBetween, getMonthRange } from '@core/utils/date';

describe('formatDate', () => {
  it('formats date with DD/MM/YYYY', () => {
    expect(formatDate('2024-12-31', 'DD/MM/YYYY')).toBe('31/12/2024');
  });

  it('formats date with MM/DD/YYYY', () => {
    expect(formatDate('2024-01-05', 'MM/DD/YYYY')).toBe('01/05/2024');
  });

  it('returns empty string for empty input', () => {
    expect(formatDate('', 'DD/MM/YYYY')).toBe('');
  });
});

describe('daysUntil', () => {
  it('returns positive number for future date', () => {
    const future = dayjs().add(10, 'day').format('YYYY-MM-DD');
    expect(daysUntil(future)).toBeGreaterThan(0);
  });

  it('returns negative number for past date', () => {
    const past = dayjs().subtract(5, 'day').format('YYYY-MM-DD');
    expect(daysUntil(past)).toBeLessThan(0);
  });
});

describe('isOverdue', () => {
  it('returns true for past date', () => {
    const past = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    expect(isOverdue(past)).toBe(true);
  });

  it('returns false for future date', () => {
    const future = dayjs().add(1, 'day').format('YYYY-MM-DD');
    expect(isOverdue(future)).toBe(false);
  });
});

describe('monthsBetween', () => {
  it('calculates months between two dates', () => {
    expect(monthsBetween('2024-01-01', '2024-06-01')).toBe(5);
  });

  it('returns 0 for same month', () => {
    expect(monthsBetween('2024-03-01', '2024-03-31')).toBe(0);
  });
});

describe('getMonthRange', () => {
  it('returns startDate and endDate for current month', () => {
    const { startDate, endDate } = getMonthRange(0);
    expect(startDate).toMatch(/^\d{4}-\d{2}-01$/);
    expect(endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(endDate >= startDate).toBe(true);
  });
});
