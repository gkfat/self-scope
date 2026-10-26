import {
    describe, expect, it,
} from 'vitest';
import { FakeTimestamp } from '../test-utils/fakeFirestore';
import {
    toDate, toMillis,
} from './firestoreTime';

describe('firestoreTime', () => {
    it('reads epoch milliseconds, Dates and Firestore Timestamps alike', () => {
        expect(toMillis(1000)).toBe(1000);
        expect(toMillis(new Date(2000))).toBe(2000);
        expect(toMillis(new FakeTimestamp(3000))).toBe(3000);
    });

    it('converts to a Date', () => {
        expect(toDate(new FakeTimestamp(4000)).getTime()).toBe(4000);
    });

    it('refuses values that are not times instead of guessing', () => {
        expect(() => toMillis('2026-01-01')).toThrow(TypeError);
        expect(() => toMillis(null)).toThrow(TypeError);
    });
});
