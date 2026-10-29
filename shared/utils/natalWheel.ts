import { ZODIACS } from '../schemas/common';
import type { NatalChartResponse } from '../schemas/api/natalChart.schema';
import {
    NATAL_BODIES, type NatalBody, 
} from '../constants/natal';

/** How far a body is from the start of the ascendant's sign, 0 to 360: the whole-sign houses begin there. */
export function wheelDegrees(chart: NatalChartResponse, body: NatalBody): number {
    const placement = chart.bodies[body];
    const start = ZODIACS.indexOf(chart.ascendant.sign);
    const at = ZODIACS.indexOf(placement.sign);

    return (((at - start + 12) % 12) * 30) + placement.degree;
}

/**
 * A point on the wheel for a distance along the zodiac. The ascendant is at nine o'clock and the signs run
 * counter-clockwise, the way a birth chart is drawn.
 */
export function wheelPoint(degrees: number, radius: number, center: number): { x: number; y: number } {
    const angle = ((180 + degrees) * Math.PI) / 180;

    return {
        x: center + (radius * Math.cos(angle)),
        y: center - (radius * Math.sin(angle)),
    };
}

/**
 * The radius each body is drawn at: bodies that stand close together are moved to other rings so that their glyphs
 * do not sit on each other. Deterministic, in the order of the bodies.
 */
export function spreadBodies(chart: NatalChartResponse, radii: readonly number[], closerThan: number): Array<{ body: NatalBody; degrees: number; radius: number }> {
    const placed: Array<{ body: NatalBody; degrees: number; radius: number }> = [];

    for (const body of NATAL_BODIES) {
        const degrees = wheelDegrees(chart, body);
        const taken = placed.filter((other) => Math.min(Math.abs(other.degrees - degrees), 360 - Math.abs(other.degrees - degrees)) < closerThan).map((other) => other.radius);
        const radius = radii.find((candidate) => !taken.includes(candidate)) ?? radii[0] ?? 0;

        placed.push({
            body, degrees, radius,
        });
    }

    return placed;
}
