import {
    ASPECTS, NATAL_BODIES, type AspectType, type NatalBody,
} from '../../shared/constants/natal';

export type Aspect = {
    body1: NatalBody;
    body2: NatalBody;
    type: AspectType;
    /** How far the pair is from the exact angle, in degrees, never more than the widest orb of that aspect */
    orb: number;
};

/** The shortest way round the zodiac between two longitudes, 0 to 180 degrees. */
export function angularDistance(first: number, second: number): number {
    const difference = Math.abs(first - second) % 360;

    return difference > 180 ? 360 - difference : difference;
}

/**
 * The major aspects between the ten bodies, from their exact longitudes (never from degrees cut to whole numbers, which
 * would invent or lose an aspect at the edge of an orb). Each pair makes at most one aspect: the angles are far
 * enough apart that no distance is inside the orb of two of them.
 *
 * Changing what this calculates: raise RULE_VERSIONS.NATAL_CHART in shared/utils/analysisBasis.ts.
 */
export function findAspects(longitudes: Readonly<Record<NatalBody, number>>): Aspect[] {
    const aspects: Aspect[] = [];

    NATAL_BODIES.forEach((body1, index) => {
        for (const body2 of NATAL_BODIES.slice(index + 1)) {
            const distance = angularDistance(longitudes[body1], longitudes[body2]);

            for (const aspect of ASPECTS) {
                const orb = Math.abs(distance - aspect.angle);

                if (orb <= aspect.maxOrb) {
                    aspects.push({
                        body1, body2, type: aspect.type, orb: Math.round(orb * 10) / 10,
                    });
                }
            }
        }
    });

    return aspects;
}
