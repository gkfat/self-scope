import {
    describe, expect, it,
} from 'vitest';
import {
    CENTER_GATES, CENTERS, CHANNELS, GATE_WHEEL,
} from '../constants/humanDesign';
import type {
    HumanDesignActivation, HumanDesignBody,
} from '../schemas/firestore/humanDesign.schema';
import {
    activationFromLongitude, centerOfGate, deriveChart, hangingGates,
} from './humanDesignChart';
import { CHANNEL_NAMES } from '../constants/humanDesignChannels';
import { CHANNEL_MEANINGS } from '../constants/humanDesignChannelMeanings';
import { GATE_INFO } from '../constants/humanDesignGates';
import { HUMAN_DESIGN_BODY_LABELS } from '../constants/humanDesignLabels';
import { humanDesignBodySchema } from '../schemas/firestore/humanDesign.schema';

const sun = (gate: number, line = 1): HumanDesignActivation => ({
    body: 'SUN', gate, line,
});
const earth = (gateNumber: number): HumanDesignActivation => ({
    body: 'EARTH', gate: gateNumber, line: 1,
});
const gate = (value: number, body: HumanDesignBody = 'MARS'): HumanDesignActivation => ({
    body, gate: value, line: 1,
});

/** Chart from a plain list of gates (the Sun lines only matter for the profile). */
const chartOf = (gates: number[], personalitySunLine = 1, designSunLine = 3) => deriveChart(
    [
        sun(gates[0] ?? 1, personalitySunLine),
        earth(gates[0] ?? 1),
        ...gates.slice(1).map((value) => gate(value)),
    ],
    [sun(gates[0] ?? 1, designSunLine), earth(gates[0] ?? 1)],
);

describe('reference data', () => {
    it('has all 64 gates once in the wheel, and in the centers', () => {
        const all = Array.from({ length: 64 }, (_, index) => index + 1);

        expect([...GATE_WHEEL].sort((a, b) => a - b)).toEqual(all);
        expect(CENTERS.flatMap((center) => CENTER_GATES[center]).sort((a, b) => a - b)).toEqual(all);
    });

    it('has 36 distinct channels between gates of different centers', () => {
        const centerOf = new Map(CENTERS.flatMap((center) => CENTER_GATES[center].map((g) => [g, center] as const)));

        expect(CHANNELS).toHaveLength(36);
        expect(new Set(CHANNELS.map(([a, b]) => `${a}-${b}`)).size).toBe(36);

        for (const [a, b] of CHANNELS) expect(centerOf.get(a)).not.toBe(centerOf.get(b));
    });

    it('uses every gate in at most the channels the system defines', () => {
        const used = new Set(CHANNELS.flat());

        expect(used.size).toBe(64);
    });
});

describe('activationFromLongitude', () => {
    it('starts the wheel with Gate 41 at 2° Aquarius', () => {
        expect(activationFromLongitude('SUN', 302)).toEqual({
            body: 'SUN', gate: 41, line: 1,
        });
    });

    it.each([
        // known gate boundaries: Gate 25 begins at 28°15' Pisces, Gate 17 at 3°52'30" Aries
        [358.25, 25],
        [3.875, 17],
        [0, 25],
        [301.999, 60],
    ])('longitude %s falls in gate %s', (longitude, expected) => {
        expect(activationFromLongitude('SUN', longitude).gate).toBe(expected);
    });

    it('counts six lines per gate', () => {
        expect(activationFromLongitude('SUN', 302 + 0.9375 * 5 + 0.01).line).toBe(6);
        expect(activationFromLongitude('SUN', 302 + 0.9375 + 0.01).line).toBe(2);
    });

    it('wraps negative and above-360 longitudes', () => {
        expect(activationFromLongitude('SUN', -58)).toEqual(activationFromLongitude('SUN', 302));
        expect(activationFromLongitude('SUN', 662)).toEqual(activationFromLongitude('SUN', 302));
    });
});

describe('deriveChart', () => {
    it('is a Reflector with lunar authority when no channel is complete', () => {
        const chart = chartOf([
            1,
            2,
            3,
        ]);

        expect(chart).toMatchObject({
            type: 'REFLECTOR', strategy: 'WAIT_A_LUNAR_CYCLE', authority: 'LUNAR', definition: 'NONE', definedCenters: [], channels: [],
        });
    });

    it('is a Generator when the sacral is defined and no motor reaches the throat', () => {
        // 5-15 connects Sacral and G
        const chart = chartOf([5, 15]);

        expect(chart).toMatchObject({
            type: 'GENERATOR', strategy: 'RESPOND', authority: 'SACRAL', definition: 'SINGLE',
        });
        expect(chart.definedCenters).toEqual(['G', 'SACRAL']);
    });

    it('is a Manifesting Generator when the sacral reaches the throat', () => {
        // 20-34 connects Throat and Sacral
        expect(chartOf([20, 34])).toMatchObject({
            type: 'MANIFESTING_GENERATOR', strategy: 'RESPOND', authority: 'SACRAL',
        });
    });

    it('is a Manifesting Generator when any motor, not only the sacral, reaches the throat', () => {
        // 34-57 gives Sacral + Spleen; 21-45 gives Heart + Throat: the heart is a motor on the throat
        expect(chartOf([
            34,
            57,
            21,
            45,
        ]).type).toBe('MANIFESTING_GENERATOR');
        // 5-15 gives Sacral + G only: no motor reaches the throat
        expect(chartOf([5, 15]).type).toBe('GENERATOR');
        // sacral reaches the throat through the G center: 5-15, 7-31 are not connected (G to Throat needs 7-31)
        expect(chartOf([
            5,
            15,
            7,
            31,
        ]).type).toBe('MANIFESTING_GENERATOR');
    });

    it('is a Manifestor when a motor reaches the throat and the sacral is open', () => {
        // 21-45: Heart to Throat
        expect(chartOf([21, 45])).toMatchObject({
            type: 'MANIFESTOR', strategy: 'INFORM', authority: 'EGO',
        });
        // 35-36: Throat to Solar Plexus
        expect(chartOf([35, 36])).toMatchObject({
            type: 'MANIFESTOR', authority: 'EMOTIONAL',
        });
    });

    it('is a Projector when no motor reaches the throat and the sacral is open', () => {
        // 17-62: Ajna to Throat, mental projector
        expect(chartOf([17, 62])).toMatchObject({
            type: 'PROJECTOR', strategy: 'WAIT_FOR_INVITATION', authority: 'MENTAL',
        });
        // 57-20 is Spleen to Throat: splenic
        expect(chartOf([57, 20])).toMatchObject({
            type: 'PROJECTOR', authority: 'SPLENIC',
        });
    });

    it('ranks authority: emotional, then sacral, splenic, ego, self-projected, mental', () => {
        expect(chartOf([
            35,
            36,
            5,
            15,
        ]).authority).toBe('EMOTIONAL');
        expect(chartOf([34, 57]).authority).toBe('SACRAL');
        expect(chartOf([57, 10]).authority).toBe('SPLENIC');
        expect(chartOf([25, 51]).authority).toBe('EGO');
        expect(chartOf([1, 8]).authority).toBe('SELF_PROJECTED');
        expect(chartOf([4, 63]).authority).toBe('MENTAL');
    });

    it('counts the separate groups of defined centers', () => {
        expect(chartOf([1, 8]).definition).toBe('SINGLE');
        expect(chartOf([
            1,
            8,
            4,
            63,
        ]).definition).toBe('SPLIT');
        expect(chartOf([
            1,
            8,
            4,
            63,
            53,
            42,
        ]).definition).toBe('TRIPLE_SPLIT');
        expect(chartOf([
            1,
            8,
            4,
            63,
            53,
            42,
            37,
            40,
        ]).definition).toBe('QUADRUPLE_SPLIT');
    });

    it('does not count a gate that has no partner as a channel', () => {
        const chart = chartOf([
            1,
            2,
            3,
            4,
        ]);

        expect(chart.channels).toEqual([]);
        expect(chart.type).toBe('REFLECTOR');
    });

    it('finds a channel whose gates come from different charts', () => {
        const chart = deriveChart([sun(1, 4), earth(1)], [sun(8, 1), earth(8)]);

        expect(chart.channels).toEqual([[1, 8]]);
        expect(chart.profile).toBe('4/1');
    });

    it('builds the profile from the Sun lines', () => {
        expect(chartOf([1], 6, 2).profile).toBe('6/2');
    });

    it('names the incarnation cross by its four Sun and Earth gates', () => {
        const chart = deriveChart([sun(63), earth(64)], [sun(5), earth(35)]);

        expect(chart.incarnationCross.gates).toEqual([
            63,
            64,
            5,
            35,
        ]);
    });

    it.each([
        [
            1,
            3,
            'RIGHT_ANGLE',
        ],
        [
            2,
            5,
            'RIGHT_ANGLE',
        ],
        [
            3,
            6,
            'RIGHT_ANGLE',
        ],
        [
            4,
            1,
            'JUXTAPOSITION',
        ],
        [
            4,
            6,
            'LEFT_ANGLE',
        ],
        [
            5,
            2,
            'LEFT_ANGLE',
        ],
        [
            6,
            3,
            'LEFT_ANGLE',
        ],
    ])('profile %s/%s lives a %s cross', (personalityLine, designLine, angle) => {
        expect(chartOf([1], personalityLine, designLine).incarnationCross.angle).toBe(angle);
    });
});

describe('channel names', () => {
    it('names every one of the 36 channels, and only those', () => {
        expect(Object.keys(CHANNEL_NAMES).sort()).toEqual(CHANNELS.map(([a, b]) => `${a}-${b}`).sort());
    });
});

describe('channel meanings', () => {
    it('has a short reading for every channel, and only for channels that exist', () => {
        expect(Object.keys(CHANNEL_MEANINGS).sort()).toEqual(CHANNELS.map(([a, b]) => `${a}-${b}`).sort());

        for (const [key, text] of Object.entries(CHANNEL_MEANINGS)) {
            expect(text.length, key).toBeGreaterThanOrEqual(15);
            expect(text.length, key).toBeLessThanOrEqual(60);
        }
    });

    it('never reads like a diagnosis or a promise', () => {
        const banned = /(症|病|診斷|治療|一定|必然|保證)/;

        for (const [key, text] of Object.entries(CHANNEL_MEANINGS)) expect(text, key).not.toMatch(banned);
    });
});

describe('body labels', () => {
    it('names every celestial body a gate can come from', () => {
        expect(Object.keys(HUMAN_DESIGN_BODY_LABELS).sort()).toEqual([...humanDesignBodySchema.options].sort());
    });
});

describe('gate meanings', () => {
    it('has a name and a short reading for each of the 64 gates', () => {
        expect(Object.keys(GATE_INFO).map(Number).sort((a, b) => a - b)).toEqual(Array.from({ length: 64 }, (_, index) => index + 1));

        for (const [gateNumber, info] of Object.entries(GATE_INFO)) {
            expect(info.name.length, gateNumber).toBeGreaterThanOrEqual(2);
            expect(info.meaning.length, gateNumber).toBeGreaterThanOrEqual(12);
            expect(info.meaning.length, gateNumber).toBeLessThanOrEqual(60);
        }
    });

    it('never reads like a diagnosis or a promise', () => {
        const banned = /(症|病|診斷|治療|一定|必然|保證)/;

        for (const [gateNumber, info] of Object.entries(GATE_INFO)) expect(info.meaning, gateNumber).not.toMatch(banned);
    });
});

describe('hangingGates', () => {
    it('lists active gates that have no partner, with the channels they could complete', () => {
        // 34 is active but 57, 20 and 10 are not; 1 and 8 form a channel
        const chart = deriveChart([
            sun(1),
            earth(8),
            gate(34),
        ], [sun(1), earth(8)]);
        const hanging = hangingGates(chart);

        expect(hanging.map((item) => item.gate)).toEqual([34]);
        expect(hanging[0]).toMatchObject({ center: 'SACRAL' });
        expect(hanging[0]?.channels).toEqual([
            {
                key: '10-34', partner: 10,
            },
            {
                key: '20-34', partner: 20,
            },
            {
                key: '34-57', partner: 57,
            },
        ]);
    });

    it('does not list a gate that completes a channel', () => {
        const chart = deriveChart([sun(1), earth(8)], [sun(1), earth(8)]);

        expect(hangingGates(chart)).toEqual([]);
    });

    it('knows which center a gate belongs to', () => {
        expect(centerOfGate(34)).toBe('SACRAL');
        expect(centerOfGate(61)).toBe('HEAD');
    });
});
