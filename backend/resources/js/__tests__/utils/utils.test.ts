import { describe, it, expect } from 'vitest';
import { readableTime, readableDate, addDays, daysBetween, listDates, extendDateWindow } from '../../utils/utils';

// ---------------------------------------------------------------------------
// readableTime
// ---------------------------------------------------------------------------

describe('readableTime', () => {
    it('formats midnight as 00:00', () => {
        expect(readableTime(0)).toBe('00:00');
    });

    it('formats exactly one hour', () => {
        expect(readableTime(60)).toBe('01:00');
    });

    it('pads hours to two digits', () => {
        expect(readableTime(540)).toBe('09:00');
    });

    it('formats minutes correctly', () => {
        expect(readableTime(90)).toBe('01:30');
        expect(readableTime(75)).toBe('01:15');
    });

    it('pads minutes to two digits', () => {
        expect(readableTime(61)).toBe('01:01');
        expect(readableTime(5)).toBe('00:05');
    });

    it('formats the last minute of the day', () => {
        expect(readableTime(1439)).toBe('23:59');
    });

    it('formats noon', () => {
        expect(readableTime(720)).toBe('12:00');
    });
});

// ---------------------------------------------------------------------------
// readableDate
// ---------------------------------------------------------------------------

describe('readableDate', () => {
    // Day-of-week correctness (2024-01-01 is a Monday)
    it('returns the correct day of week', () => {
        expect(readableDate('2024-01-01')).toMatch(/^Monday/);
        expect(readableDate('2024-01-02')).toMatch(/^Tuesday/);
        expect(readableDate('2024-01-06')).toMatch(/^Saturday/);
        expect(readableDate('2024-01-07')).toMatch(/^Sunday/);
    });

    // Month names
    it('includes the full month name', () => {
        expect(readableDate('2024-01-01')).toContain('January');
        expect(readableDate('2024-06-15')).toContain('June');
        expect(readableDate('2024-12-25')).toContain('December');
    });

    // Year
    it('includes the year', () => {
        expect(readableDate('2024-08-01')).toContain('2024');
    });

    // Ordinal suffixes — normal cases
    it('uses "st" suffix for 1, 21, 31', () => {
        expect(readableDate('2024-01-01')).toContain('1st');
        expect(readableDate('2024-01-21')).toContain('21st');
        expect(readableDate('2024-01-31')).toContain('31st');
    });

    it('uses "nd" suffix for 2, 22', () => {
        expect(readableDate('2024-01-02')).toContain('2nd');
        expect(readableDate('2024-01-22')).toContain('22nd');
    });

    it('uses "rd" suffix for 3, 23', () => {
        expect(readableDate('2024-01-03')).toContain('3rd');
        expect(readableDate('2024-01-23')).toContain('23rd');
    });

    it('uses "th" suffix for 4–20', () => {
        expect(readableDate('2024-01-04')).toContain('4th');
        expect(readableDate('2024-01-11')).toContain('11th');
        expect(readableDate('2024-01-12')).toContain('12th');
        expect(readableDate('2024-01-13')).toContain('13th');
        expect(readableDate('2024-01-20')).toContain('20th');
    });

    // Edge cases: 11th, 12th, 13th must NOT use st/nd/rd
    it('uses "th" for 11, 12, 13 (not st/nd/rd)', () => {
        expect(readableDate('2024-01-11')).not.toContain('11st');
        expect(readableDate('2024-01-12')).not.toContain('12nd');
        expect(readableDate('2024-01-13')).not.toContain('13rd');
        expect(readableDate('2024-01-11')).toContain('11th');
        expect(readableDate('2024-01-12')).toContain('12th');
        expect(readableDate('2024-01-13')).toContain('13th');
    });

    // Full format check
    it('produces the full formatted string correctly', () => {
        expect(readableDate('2024-08-01')).toBe('Thursday 1st August 2024');
    });
});

// ---------------------------------------------------------------------------
// addDays / daysBetween / listDates
// ---------------------------------------------------------------------------

describe('addDays', () => {
    it('adds days within a month', () => {
        expect(addDays('2026-06-10', 5)).toBe('2026-06-15');
    });

    it('subtracts days', () => {
        expect(addDays('2026-06-10', -10)).toBe('2026-05-31');
    });

    it('crosses month and year boundaries', () => {
        expect(addDays('2026-12-28', 10)).toBe('2027-01-07');
        expect(addDays('2026-01-03', -5)).toBe('2025-12-29');
    });

    it('handles leap years', () => {
        expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
        expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
    });

    it('returns the same date for zero', () => {
        expect(addDays('2026-06-10', 0)).toBe('2026-06-10');
    });
});

describe('daysBetween', () => {
    it('returns zero for the same date', () => {
        expect(daysBetween('2026-06-10', '2026-06-10')).toBe(0);
    });

    it('counts forwards and backwards', () => {
        expect(daysBetween('2026-06-10', '2026-06-15')).toBe(5);
        expect(daysBetween('2026-06-15', '2026-06-10')).toBe(-5);
    });

    it('counts across month boundaries', () => {
        expect(daysBetween('2026-05-31', '2026-06-02')).toBe(2);
    });
});

describe('listDates', () => {
    it('lists an inclusive range in order', () => {
        expect(listDates('2026-06-28', '2026-07-01')).toEqual([
            '2026-06-28', '2026-06-29', '2026-06-30', '2026-07-01',
        ]);
    });

    it('returns a single date when start equals end', () => {
        expect(listDates('2026-06-28', '2026-06-28')).toEqual(['2026-06-28']);
    });

    it('returns empty when start is after end', () => {
        expect(listDates('2026-06-29', '2026-06-28')).toEqual([]);
    });
});

// ---------------------------------------------------------------------------
// extendDateWindow
// ---------------------------------------------------------------------------

describe('extendDateWindow', () => {
    const win = { start: '2026-06-01', end: '2026-06-20' }; // 20 days

    it('grows into the past while under the max', () => {
        expect(extendDateWindow(win, 'past', 10, 30)).toEqual({
            start: '2026-05-22',
            end: '2026-06-20',
        });
    });

    it('grows into the future while under the max', () => {
        expect(extendDateWindow(win, 'future', 10, 30)).toEqual({
            start: '2026-06-01',
            end: '2026-06-30',
        });
    });

    it('slides instead of growing once at the max', () => {
        const full = { start: '2026-06-01', end: '2026-06-30' }; // 30 days
        expect(extendDateWindow(full, 'past', 10, 30)).toEqual({
            start: '2026-05-22',
            end: '2026-06-20',
        });
        expect(extendDateWindow(full, 'future', 10, 30)).toEqual({
            start: '2026-06-11',
            end: '2026-07-10',
        });
    });
});
