import {
    describe, expect, it,
} from 'vitest';
import {
    addDays, addMonths, DAY_MS, taipeiDateKey,
} from './time';

describe('time utils', () => {
    it('adds days', () => {
        expect(addDays(0, 90)).toBe(90 * DAY_MS);
    });

    it('adds calendar months', () => {
        expect(addMonths(Date.UTC(2026, 0, 15), 3)).toBe(Date.UTC(2026, 3, 15));
    });

    it('clamps to the last day of a shorter month', () => {
        expect(addMonths(Date.UTC(2026, 0, 31), 1)).toBe(Date.UTC(2026, 1, 28));
        expect(addMonths(Date.UTC(2024, 0, 31), 1)).toBe(Date.UTC(2024, 1, 29));
    });

    it('rolls over the year', () => {
        expect(addMonths(Date.UTC(2026, 10, 30), 3)).toBe(Date.UTC(2027, 1, 28));
    });
});

describe('taipeiDateKey', () => {
    it.each([
        ['2026-10-27T15:59:59Z', '2026-10-27'],
        ['2026-10-27T16:00:00Z', '2026-10-28'],
        ['2026-12-31T16:00:00Z', '2027-01-01'],
        ['2026-10-27T00:00:00Z', '2026-10-27'],
    ])('%s is %s in Taipei', (instant, expected) => {
        expect(taipeiDateKey(new Date(instant))).toBe(expected);
    });
});
