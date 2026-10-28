import {
    describe, expect, it,
} from 'vitest';
import {
    houseOf, houses,
} from './horoscope';
import {
    HOROSCOPE_BODIES, horoscopeContentKeys,
} from '../constants/horoscope';
import { ZODIACS } from '../schemas/common';

describe('houseOf', () => {
    it('makes the member\'s own sign the first house', () => {
        for (const sign of ZODIACS) expect(houseOf(sign, sign), sign).toBe(1);
    });

    it('counts the next sign as the second house, and on to the twelfth', () => {
        expect(houseOf('aries', 'taurus')).toBe(2);
        expect(houseOf('aries', 'pisces')).toBe(12);
        expect(houseOf('scorpio', 'sagittarius')).toBe(2);
        expect(houseOf('scorpio', 'libra')).toBe(12);
    });

    it('goes round the zodiac: Pisces is followed by Aries', () => {
        expect(houseOf('pisces', 'aries')).toBe(2);
        expect(houseOf('pisces', 'taurus')).toBe(3);
        expect(houseOf('pisces', 'aquarius')).toBe(12);
    });

    it('gives each of the twelve signs a different house from one member\'s point of view', () => {
        for (const member of ZODIACS) {
            const seen = new Set(ZODIACS.map((sign) => houseOf(member, sign)));

            expect(seen.size, member).toBe(12);
            expect([...seen].sort((a, b) => a - b), member).toEqual(Array.from({ length: 12 }, (_, i) => i + 1));
        }
    });

    it('opposes the first and the seventh house: the opposite sign is house 7', () => {
        expect(houseOf('aries', 'libra')).toBe(7);
        expect(houseOf('cancer', 'capricorn')).toBe(7);
    });
});

describe('houses', () => {
    it('reads the five bodies in order, each with its sign and its house', () => {
        const result = houses('pisces', {
            MOON: 'aries', SUN: 'scorpio', MERCURY: 'libra', VENUS: 'sagittarius', MARS: 'pisces',
        });

        expect(result.map((entry) => entry.body)).toEqual([...HOROSCOPE_BODIES]);
        expect(result).toEqual([
            {
                body: 'MOON', sign: 'aries', house: 2,
            },
            {
                body: 'SUN', sign: 'scorpio', house: 9,
            },
            {
                body: 'MERCURY', sign: 'libra', house: 8,
            },
            {
                body: 'VENUS', sign: 'sagittarius', house: 10,
            },
            {
                body: 'MARS', sign: 'pisces', house: 1,
            },
        ]);
    });
});

describe('horoscope content keys', () => {
    it('has five bodies in twelve houses, 60 in all', () => {
        const keys = horoscopeContentKeys();

        expect(keys).toHaveLength(60);
        expect(new Set(keys).size).toBe(60);
        expect(keys).toContain('MOON_1');
        expect(keys).toContain('MARS_12');
        expect(keys).not.toContain('MOON_0');
        expect(keys).not.toContain('MOON_13');
        expect(keys).not.toContain('JUPITER_1');
    });
});
