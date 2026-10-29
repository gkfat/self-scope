import {
    describe, expect, it,
} from 'vitest';
import { NatalChartService } from '../../server/services/natalChart.service';
import {
    spreadBodies, wheelDegrees, wheelPoint,
} from './natalWheel';

const chart = new NatalChartService().calculate({
    birthDate: '1989-10-27', birthTime: '06:10', birthPlace: 'tw-taipei',
});

describe('the birth chart wheel', () => {
    it('puts the ascendant at nine o\'clock and runs the signs counter-clockwise, down from there', () => {
        const start = wheelPoint(0, 100, 200);
        const quarter = wheelPoint(90, 100, 200);

        expect(Math.round(start.x)).toBe(100);
        expect(Math.round(start.y)).toBe(200);
        // A quarter of the way round is the bottom of the wheel (the fourth house cusp), not the top
        expect(Math.round(quarter.x)).toBe(200);
        expect(Math.round(quarter.y)).toBe(300);
    });

    it('measures a body from the start of the ascendant\'s sign, within one turn', () => {
        for (const body of [
            'SUN',
            'MOON',
            'PLUTO',
        ] as const) {
            const degrees = wheelDegrees(chart, body);

            expect(degrees).toBeGreaterThanOrEqual(0);
            expect(degrees).toBeLessThan(360);
        }

        // A body in the sign of the ascendant is in the first house
        const first = chart.houses[0];

        for (const body of first?.bodies ?? []) expect(wheelDegrees(chart, body)).toBeLessThan(30);
    });

    it('moves bodies that stand close together onto other rings, and draws every body once', () => {
        const placed = spreadBodies(chart, [
            146,
            128,
            102,
            112,
        ], 9);

        expect(placed.map((item) => item.body)).toHaveLength(10);

        for (const [index, item] of placed.entries()) {
            for (const other of placed.slice(index + 1)) {
                const gap = Math.min(Math.abs(item.degrees - other.degrees), 360 - Math.abs(item.degrees - other.degrees));

                if (gap < 9) expect(item.radius, `${item.body} ${other.body}`).not.toBe(other.radius);
            }
        }
    });
});
