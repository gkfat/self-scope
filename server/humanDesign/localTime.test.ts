import {
    describe, expect, it,
} from 'vitest';
import {
    describeLocalTime, localTimeToUtc,
} from './localTime';

describe('localTimeToUtc', () => {
    it('applies a fixed offset', () => {
        expect(localTimeToUtc('1995-03-25', '14:30', 'Asia/Taipei').toISOString()).toBe('1995-03-25T06:30:00.000Z');
    });

    it('applies the daylight saving time Taiwan used in 1975', () => {
        // Taiwan observed daylight saving time (UTC+9) from April to October in 1975
        expect(localTimeToUtc('1975-07-01', '12:00', 'Asia/Taipei').toISOString()).toBe('1975-07-01T03:00:00.000Z');
        expect(localTimeToUtc('1975-12-01', '12:00', 'Asia/Taipei').toISOString()).toBe('1975-12-01T04:00:00.000Z');
    });

    it('uses the first occurrence of a time that happens twice, and the earlier offset for a time that never happens', () => {
        // UK clocks went back at 02:00 BST on 1996-10-27, so 01:30 happened at 00:30Z and again at 01:30Z
        expect(localTimeToUtc('1996-10-27', '01:30', 'Europe/London').toISOString()).toBe('1996-10-27T00:30:00.000Z');
        // UK clocks went forward at 01:00 GMT on 1996-03-31: 01:30 never happened
        expect(localTimeToUtc('1996-03-31', '01:30', 'Europe/London').toISOString()).toBe('1996-03-31T01:30:00.000Z');
    });

    it('handles zones behind UTC and across the date line', () => {
        expect(localTimeToUtc('2020-07-01', '09:00', 'America/New_York').toISOString()).toBe('2020-07-01T13:00:00.000Z');
        expect(localTimeToUtc('2020-01-01', '00:30', 'Asia/Tokyo').toISOString()).toBe('2019-12-31T15:30:00.000Z');
    });

    it('flags a time that happened twice or never at all', () => {
        expect(describeLocalTime('1996-10-27', '01:30', 'Europe/London')).toBe('AMBIGUOUS');
        expect(describeLocalTime('1996-03-31', '01:30', 'Europe/London')).toBe('NONEXISTENT');
        expect(describeLocalTime('1996-06-15', '01:30', 'Europe/London')).toBeNull();
        expect(describeLocalTime('1995-03-25', '14:30', 'Asia/Taipei')).toBeNull();
    });
});
