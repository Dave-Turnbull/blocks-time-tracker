import { describe, it, expect } from 'vitest';
import { readableTime, readableDate } from '../../utils/utils';

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
