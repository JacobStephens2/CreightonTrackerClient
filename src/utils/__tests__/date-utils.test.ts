import { describe, it, expect } from 'vitest';
import { formatDate, parseDate, addDays, daysBetween, getDatesInMonth, firstDayOfMonth } from '../date-utils';

describe('formatDate', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('pads single-digit months and days', () => {
    expect(formatDate(new Date(2026, 2, 3))).toBe('2026-03-03');
  });
});

describe('parseDate', () => {
  it('parses YYYY-MM-DD to a Date', () => {
    const d = parseDate('2026-03-15');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(2); // March = 2
    expect(d.getDate()).toBe(15);
  });
});

describe('addDays', () => {
  it('adds positive days', () => {
    expect(addDays('2026-01-30', 3)).toBe('2026-02-02');
  });

  it('subtracts days with negative value', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('handles month boundary', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
  });
});

describe('daysBetween', () => {
  it('calculates positive difference', () => {
    expect(daysBetween('2026-01-01', '2026-01-10')).toBe(9);
  });

  it('returns 0 for same date', () => {
    expect(daysBetween('2026-03-15', '2026-03-15')).toBe(0);
  });

  it('returns negative for reversed dates', () => {
    expect(daysBetween('2026-01-10', '2026-01-01')).toBe(-9);
  });
});

describe('getDatesInMonth', () => {
  it('returns correct number of days for January', () => {
    const dates = getDatesInMonth(2026, 0);
    expect(dates.length).toBe(31);
    expect(dates[0]).toBe('2026-01-01');
    expect(dates[30]).toBe('2026-01-31');
  });

  it('handles February non-leap year', () => {
    const dates = getDatesInMonth(2026, 1);
    expect(dates.length).toBe(28);
  });

  it('handles February leap year', () => {
    const dates = getDatesInMonth(2024, 1);
    expect(dates.length).toBe(29);
  });
});

describe('firstDayOfMonth', () => {
  it('returns the weekday index for the first of the month', () => {
    // March 1, 2026 is a Sunday
    expect(firstDayOfMonth(2026, 2)).toBe(0);
  });
});
