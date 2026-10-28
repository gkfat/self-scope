import type { Zodiac } from '../schemas/common';

/** The classical bodies a birth chart reports besides the ascendant. */
export const NATAL_BODIES = [
    'SUN',
    'MOON',
    'MERCURY',
    'VENUS',
    'MARS',
    'JUPITER',
    'SATURN',
    'URANUS',
    'NEPTUNE',
    'PLUTO',
] as const;

export type NatalBody = typeof NATAL_BODIES[number];

/**
 * The planet each sign is ruled by, the modern rulers (Scorpio by Pluto, Aquarius by Uranus, Pisces by Neptune).
 * Changing a ruler changes what a report says: raise RULE_VERSIONS.NATAL_CHART in shared/utils/analysisBasis.ts.
 */
export const SIGN_RULERS: Readonly<Record<Zodiac, NatalBody>> = {
    aries: 'MARS',
    taurus: 'VENUS',
    gemini: 'MERCURY',
    cancer: 'MOON',
    leo: 'SUN',
    virgo: 'MERCURY',
    libra: 'VENUS',
    scorpio: 'PLUTO',
    sagittarius: 'JUPITER',
    capricorn: 'SATURN',
    aquarius: 'URANUS',
    pisces: 'NEPTUNE',
};

/**
 * The five major aspects, with the widest distance from the exact angle (the orb) that still counts. Common practice:
 * 8 degrees for the conjunction, square, trine and opposition, 6 for the sextile.
 * Changing an angle or an orb changes what a report says: raise RULE_VERSIONS.NATAL_CHART.
 */
export const ASPECTS = [
    {
        type: 'CONJUNCTION', angle: 0, maxOrb: 8,
    },
    {
        type: 'SEXTILE', angle: 60, maxOrb: 6,
    },
    {
        type: 'SQUARE', angle: 90, maxOrb: 8,
    },
    {
        type: 'TRINE', angle: 120, maxOrb: 8,
    },
    {
        type: 'OPPOSITION', angle: 180, maxOrb: 8,
    },
] as const;

export type AspectType = typeof ASPECTS[number]['type'];
