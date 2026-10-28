import {
    describe, expect, it,
} from 'vitest';
import { SIGN_RULERS } from '../../shared/constants/natal';
import { ZODIACS } from '../../shared/schemas/common';
import { buildHouses } from './houses';
import { computeNatalChart } from './natalChart';

const allIn = (sign: (typeof ZODIACS)[number]) => ({
    SUN: sign,
    MOON: sign,
    MERCURY: sign,
    VENUS: sign,
    MARS: sign,
    JUPITER: sign,
    SATURN: sign,
    URANUS: sign,
    NEPTUNE: sign,
    PLUTO: sign,
});

describe('buildHouses', () => {
    it('counts the houses from the ascendant sign and goes round the zodiac', () => {
        const houses = buildHouses('scorpio', allIn('scorpio'));

        expect(houses.map((h) => h.house)).toEqual([
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            8,
            9,
            10,
            11,
            12,
        ]);
        expect(houses.map((h) => h.sign)).toEqual([
            'scorpio',
            'sagittarius',
            'capricorn',
            'aquarius',
            'pisces',
            'aries',
            'taurus',
            'gemini',
            'cancer',
            'leo',
            'virgo',
            'libra',
        ]);
    });

    it('puts a body in the house of its own sign', () => {
        const houses = buildHouses('scorpio', allIn('scorpio'));

        expect(houses[0]?.bodies).toHaveLength(10);
        expect(houses.slice(1).every((h) => h.bodies.length === 0)).toBe(true);
        expect(buildHouses('scorpio', allIn('sagittarius'))[1]?.bodies).toHaveLength(10);
    });

    it('gives each house the ruler of its sign: Aries by Mars, Scorpio by Pluto, Pisces by Neptune', () => {
        expect(SIGN_RULERS.aries).toBe('MARS');
        expect(SIGN_RULERS.scorpio).toBe('PLUTO');
        expect(SIGN_RULERS.pisces).toBe('NEPTUNE');
        expect(buildHouses('aries', allIn('aries'))[0]?.ruler).toBe('MARS');
        expect(Object.keys(SIGN_RULERS).sort()).toEqual([...ZODIACS].sort());
    });

    it('places every body in exactly one house, whatever the ascendant', () => {
        for (const ascendant of ZODIACS) {
            const houses = buildHouses(ascendant, {
                ...allIn('leo'), MOON: 'pisces', SATURN: 'virgo',
            });

            expect(houses.flatMap((h) => h.bodies).sort()).toEqual([
                'JUPITER',
                'MARS',
                'MERCURY',
                'MOON',
                'NEPTUNE',
                'PLUTO',
                'SATURN',
                'SUN',
                'URANUS',
                'VENUS',
            ]);
        }
    });

    it('matches the houses of the published chart of Albert Einstein (whole signs from a Cancer ascendant)', () => {
        const chart = computeNatalChart(new Date(Date.UTC(1879, 2, 14, 10, 50, 4)), 48.4, 9.99);
        const houses = buildHouses(chart.ascendant.sign, Object.fromEntries(Object.entries(chart.bodies).map(([body, p]) => [body, p.sign])) as never);
        const houseOfBody = (body: string) => houses.find((h) => (h.bodies as string[]).includes(body))?.house;

        expect(houses.map((h) => h.sign)).toEqual([
            'cancer',
            'leo',
            'virgo',
            'libra',
            'scorpio',
            'sagittarius',
            'capricorn',
            'aquarius',
            'pisces',
            'aries',
            'taurus',
            'gemini',
        ]);
        expect(houses[0]?.ruler).toBe('MOON');
        expect(houseOfBody('SUN')).toBe(9);
        expect(houseOfBody('MOON')).toBe(6);
        expect(houseOfBody('MERCURY')).toBe(10);
        expect(houseOfBody('MARS')).toBe(7);
        expect(houseOfBody('NEPTUNE')).toBe(11);
    });
});
