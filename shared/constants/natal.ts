/** The classical bodies a birth chart reports besides the ascendant. */
export const NATAL_BODIES = [
    'SUN',
    'MOON',
    'MERCURY',
    'VENUS',
    'MARS',
    'JUPITER',
    'SATURN',
] as const;

export type NatalBody = typeof NATAL_BODIES[number];
