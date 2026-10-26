import {
    describe, expect, it,
} from 'vitest';
import {
    CENTER_GATES, CENTERS, CHANNELS,
} from '../constants/humanDesign';
import {
    CENTER_POLYGONS, CHANNEL_CURVES, GATE_POSITIONS,
} from '../constants/humanDesignLayout';
import type { HumanDesignActivation } from '../schemas/firestore/humanDesign.schema';
import { buildChartModel } from './humanDesignChartModel';

type Point = [number, number];

const parsePolygon = (points: string): Point[] => points.split(' ').map((pair) => pair.split(',').map(Number) as Point);

/** Ray casting: true when the point lies inside the polygon. */
function inside(point: Point, polygon: Point[]): boolean {
    let result = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i] as Point;
        const [xj, yj] = polygon[j] as Point;

        if ((yi > point[1]) !== (yj > point[1]) && point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi) {
            result = !result;
        }
    }

    return result;
}

const activation = (gate: number): HumanDesignActivation => ({
    body: 'MARS', gate, line: 1,
});

describe('drawing layout', () => {
    it('places every one of the 64 gates', () => {
        for (let gate = 1; gate <= 64; gate += 1) expect(GATE_POSITIONS[gate], `gate ${gate}`).toBeDefined();
    });

    it('puts each gate inside the center it belongs to', () => {
        for (const center of CENTERS) {
            const polygon = parsePolygon(CENTER_POLYGONS[center]);

            for (const gate of CENTER_GATES[center]) {
                expect(inside(GATE_POSITIONS[gate] as Point, polygon), `gate ${gate} in ${center}`).toBe(true);
            }
        }
    });

    it('keeps gate markers from overlapping each other', () => {
        const entries = Object.entries(GATE_POSITIONS);

        for (let i = 0; i < entries.length; i += 1) {
            for (let j = i + 1; j < entries.length; j += 1) {
                const [gateA, [xa, ya]] = entries[i] as [string, Point];
                const [gateB, [xb, yb]] = entries[j] as [string, Point];

                expect(Math.hypot(xa - xb, ya - yb), `gates ${gateA} and ${gateB}`).toBeGreaterThanOrEqual(13);
            }
        }
    });

    it('only bends channels that exist', () => {
        const keys = new Set(CHANNELS.map(([a, b]) => `${a}-${b}`));

        for (const key of Object.keys(CHANNEL_CURVES)) expect(keys.has(key), key).toBe(true);
    });
});

describe('buildChartModel', () => {
    const chart = {
        // 1990-06-15 12:00 Madrid, the channels 2-14 and 13-33
        personality: [
            12,
            11,
            63,
            19,
            33,
            20,
            2,
            21,
            53,
            61,
            58,
            38,
            1,
        ].map(activation),
        design: [
            36,
            6,
            14,
            13,
            7,
            36,
            19,
            41,
            15,
            61,
            58,
            38,
            1,
        ].map(activation),
        channels: [[2, 14], [13, 33]] as Array<[number, number]>,
        definedCenters: [
            'THROAT',
            'G',
            'SACRAL',
        ] as Array<(typeof CENTERS)[number]>,
    };
    const model = buildChartModel(chart);

    it('has all nine centers, 36 channels and 64 gates', () => {
        expect(model.centers).toHaveLength(9);
        expect(model.channels).toHaveLength(36);
        expect(model.gates).toHaveLength(64);
    });

    it('marks the defined centers and channels only', () => {
        expect(model.centers.filter((c) => c.defined).map((c) => c.center)).toEqual([
            'THROAT',
            'G',
            'SACRAL',
        ]);
        expect(model.channels.filter((c) => c.defined).map((c) => c.key)).toEqual(['2-14', '13-33']);
    });

    it('tells which chart activates a gate', () => {
        const state = (gate: number) => model.gates.find((g) => g.gate === gate)?.state;

        expect(state(12)).toBe('PERSONALITY');
        expect(state(36)).toBe('DESIGN');
        expect(state(61)).toBe('BOTH');
        expect(state(50)).toBe('NONE');
    });

    it('colors each half of a channel by its own gate', () => {
        const channel = model.channels.find((c) => c.key === '2-14');

        expect(channel?.halves.map((half) => half.state)).toEqual(['PERSONALITY', 'DESIGN']);
    });

    it('draws each half from its gate to the middle of the channel', () => {
        const [first, second] = model.channels.find((c) => c.key === '1-8')?.halves ?? [];
        const [x1, y1] = GATE_POSITIONS[1] as Point;
        const [x8, y8] = GATE_POSITIONS[8] as Point;

        expect(first?.d.startsWith(`M ${x1} ${y1}`)).toBe(true);
        expect(second?.d.endsWith(`${x8} ${y8}`)).toBe(true);
        // the halves meet where the channel is cut
        expect(first?.d.split(' L ')[1]).toBe(second?.d.split(' L ')[0]?.replace('M ', ''));
    });

    it('draws a bent channel as two curves that meet in the middle', () => {
        const [first, second] = model.channels.find((c) => c.key === '26-44')?.halves ?? [];
        const endOfFirst = first?.d.split(' ').slice(-2).join(' ');
        const startOfSecond = second?.d.split(' Q ')[0]?.replace('M ', '');

        expect(endOfFirst).toBe(startOfSecond);
    });
});
