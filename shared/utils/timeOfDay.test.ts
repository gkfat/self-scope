import {
    describe, expect, it,
} from 'vitest';
import {
    fromTimeOfDay, toTimeOfDay,
} from './timeOfDay';

describe('timeOfDay', () => {
    it.each([
        [
            'AM',
            12,
            0,
            '00:00',
        ],
        [
            'AM',
            1,
            5,
            '01:05',
        ],
        [
            'AM',
            11,
            59,
            '11:59',
        ],
        [
            'PM',
            12,
            0,
            '12:00',
        ],
        [
            'PM',
            1,
            30,
            '13:30',
        ],
        [
            'PM',
            11,
            59,
            '23:59',
        ],
    ] as const)('%s %s:%s is %s', (period, hour, minute, expected) => {
        expect(toTimeOfDay({
            period, hour, minute,
        })).toBe(expected);
        expect(fromTimeOfDay(expected)).toEqual({
            period, hour, minute,
        });
    });

    it('rejects text that is not a 24h time', () => {
        expect(fromTimeOfDay('')).toBeNull();
        expect(fromTimeOfDay('24:00')).toBeNull();
        expect(fromTimeOfDay('7:30')).toBeNull();
        expect(fromTimeOfDay('12:60')).toBeNull();
    });
});
