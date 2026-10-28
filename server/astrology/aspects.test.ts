import {
    describe, expect, it,
} from 'vitest';
import {
    NATAL_BODIES, type NatalBody, 
} from '../../shared/constants/natal';
import {
    angularDistance, findAspects,
} from './aspects';
import { computeNatalLongitudes } from './natalChart';

/** Ten bodies spread so that no pair makes an aspect by accident, with the two named ones moved where wanted. */
const apart = (overrides: Partial<Record<NatalBody, number>>): Record<NatalBody, number> => ({
    SUN: 0,
    MOON: 31,
    MERCURY: 62,
    VENUS: 93,
    MARS: 124,
    JUPITER: 155,
    SATURN: 186,
    URANUS: 217,
    NEPTUNE: 248,
    PLUTO: 279,
    ...overrides,
}) as Record<NatalBody, number>;

const only = (longitudes: Record<NatalBody, number>, first: NatalBody, second: NatalBody) => findAspects(longitudes)
    .filter((a) => (a.body1 === first && a.body2 === second) || (a.body1 === second && a.body2 === first));

describe('angularDistance', () => {
    it.each([
        [
            0,
            5,
            5,
        ],
        [
            358,
            2,
            4,
        ],
        [
            2,
            358,
            4,
        ],
        [
            10,
            190,
            180,
        ],
        [
            0,
            270,
            90,
        ],
        [
            350,
            110,
            120,
        ],
    ])('between %s and %s is %s degrees', (first, second, expected) => {
        expect(angularDistance(first, second)).toBe(expected);
    });
});

describe('findAspects', () => {
    it('finds a conjunction within its orb and reports the distance from exact', () => {
        const found = only(apart({
            SUN: 100, MOON: 105,
        }), 'SUN', 'MOON');

        expect(found).toEqual([
            {
                body1: 'SUN', body2: 'MOON', type: 'CONJUNCTION', orb: 5,
            },
        ]);
    });

    it('treats a pair across 0 degrees as close together: 358 and 2 are 4 degrees apart', () => {
        const found = only(apart({
            SUN: 358, MOON: 2,
        }), 'SUN', 'MOON');

        expect(found).toEqual([
            {
                body1: 'SUN', body2: 'MOON', type: 'CONJUNCTION', orb: 4,
            },
        ]);
    });

    it('does not find an aspect outside its orb: 100 degrees is 10 from the square', () => {
        expect(only(apart({
            SUN: 0, MOON: 100,
        }), 'SUN', 'MOON')).toEqual([]);
    });

    it('keeps the orb of the sextile at 6 and of the others at 8, and not a hair more', () => {
        const at = (distance: number) => only(apart({
            SUN: 0, MOON: distance,
        }), 'SUN', 'MOON').map((a) => a.type);

        expect(at(66)).toEqual(['SEXTILE']);
        expect(at(66.01)).toEqual([]);
        expect(at(54)).toEqual(['SEXTILE']);
        expect(at(53.99)).toEqual([]);
        expect(at(98)).toEqual(['SQUARE']);
        expect(at(98.01)).toEqual([]);
        expect(at(128)).toEqual(['TRINE']);
        expect(at(128.01)).toEqual([]);
        expect(at(172)).toEqual(['OPPOSITION']);
        expect(at(171.99)).toEqual([]);
        expect(at(8)).toEqual(['CONJUNCTION']);
        expect(at(8.01)).toEqual([]);
    });

    it('finds a trine and an opposition', () => {
        expect(only(apart({
            SUN: 10, MOON: 128,
        }), 'SUN', 'MOON')[0]).toMatchObject({
            type: 'TRINE', orb: 2,
        });
        expect(only(apart({
            SUN: 10, MOON: 185,
        }), 'SUN', 'MOON')[0]).toMatchObject({
            type: 'OPPOSITION', orb: 5,
        });
    });

    it('makes at most one aspect of a pair and lists a pair once', () => {
        const aspects = findAspects(computeNatalLongitudes(new Date(Date.UTC(1990, 5, 15, 10)), 25.033, 121.5654).bodies);
        const keys = aspects.map((a) => `${a.body1}-${a.body2}`);

        expect(new Set(keys).size).toBe(keys.length);
        expect(aspects.every((a) => NATAL_BODIES.indexOf(a.body1) < NATAL_BODIES.indexOf(a.body2))).toBe(true);
    });

    it('works from the exact longitudes of the published chart of Albert Einstein', () => {
        const { bodies } = computeNatalLongitudes(new Date(Date.UTC(1879, 2, 14, 10, 50, 4)), 48.4, 9.99);
        const aspects = findAspects(bodies);
        const between = (first: NatalBody, second: NatalBody) => aspects.find((a) => a.body1 === first && a.body2 === second);

        // Mercury 3 Aries and Saturn 4 Aries are about a degree apart; Sun 23 Pisces to Mars 26 Capricorn is about 57
        expect(between('MERCURY', 'SATURN')).toMatchObject({ type: 'CONJUNCTION' });
        expect(between('MERCURY', 'SATURN')?.orb).toBeLessThan(2);
        expect(between('SUN', 'MARS')).toMatchObject({ type: 'SEXTILE' });
        expect(between('SUN', 'MARS')?.orb).toBeLessThan(5);
        // Sun 23 Pisces and Mercury 3 Aries are about 10 apart: outside the conjunction's 8 degrees
        expect(between('SUN', 'MERCURY')).toBeUndefined();
    });
});
