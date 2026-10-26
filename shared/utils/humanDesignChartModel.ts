import {
    CENTERS, CHANNELS,
} from '../constants/humanDesign';
import {
    CENTER_POLYGONS, CHANNEL_CURVES, GATE_POSITIONS,
} from '../constants/humanDesignLayout';
import type { HumanDesignResult } from '../schemas/firestore/humanDesign.schema';

type Point = readonly [number, number];

/** Which chart activates a gate: the Personality (black), the Design (red), or both. */
export type GateState = 'NONE' | 'PERSONALITY' | 'DESIGN' | 'BOTH';

export type ChartGate = {
    gate: number;
    x: number;
    y: number;
    state: GateState;
};

export type ChartChannelHalf = {
    d: string;
    state: GateState;
};

export type ChartChannel = {
    key: string;
    /** The whole channel, drawn as the grey track */
    d: string;
    /** Both gates are active; only then are the colored halves drawn. */
    defined: boolean;
    halves: [ChartChannelHalf, ChartChannelHalf];
};

export type ChartCenter = {
    center: (typeof CENTERS)[number];
    points: string;
    defined: boolean;
};

export type ChartModel = {
    centers: ChartCenter[];
    channels: ChartChannel[];
    gates: ChartGate[];
};

const round = (value: number): number => Math.round(value * 100) / 100;
const fmt = (point: Point): string => `${round(point[0])} ${round(point[1])}`;

function position(gate: number): Point {
    const found = GATE_POSITIONS[gate];

    if (!found) throw new Error(`No drawing position for gate ${gate}`);

    return found;
}

const mid = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

/** The path of a channel and of its two halves (each half belongs to the gate at its end). */
function channelPaths(from: number, to: number, control: Point | undefined): { whole: string; halves: [string, string] } {
    const a = position(from);
    const b = position(to);

    if (!control) {
        const middle = mid(a, b);

        return {
            whole: `M ${fmt(a)} L ${fmt(b)}`,
            halves: [`M ${fmt(a)} L ${fmt(middle)}`, `M ${fmt(middle)} L ${fmt(b)}`],
        };
    }

    // Splitting a quadratic curve at t = 0.5 gives two quadratics.
    const middle: Point = [(a[0] + 2 * control[0] + b[0]) / 4, (a[1] + 2 * control[1] + b[1]) / 4];

    return {
        whole: `M ${fmt(a)} Q ${fmt(control)} ${fmt(b)}`,
        halves: [`M ${fmt(a)} Q ${fmt(mid(a, control))} ${fmt(middle)}`, `M ${fmt(middle)} Q ${fmt(mid(control, b))} ${fmt(b)}`],
    };
}

/** Everything the bodygraph needs to be drawn, from a calculated chart. */
export function buildChartModel(
    chart: Pick<HumanDesignResult, 'personality' | 'design' | 'channels' | 'definedCenters'>,
): ChartModel {
    const personality = new Set(chart.personality.map((activation) => activation.gate));
    const design = new Set(chart.design.map((activation) => activation.gate));

    const stateOf = (gate: number): GateState => {
        const inPersonality = personality.has(gate);
        const inDesign = design.has(gate);

        if (inPersonality && inDesign) return 'BOTH';
        if (inPersonality) return 'PERSONALITY';
        if (inDesign) return 'DESIGN';

        return 'NONE';
    };

    const defined = new Set(chart.definedCenters);
    const definedChannels = new Set(chart.channels.map(([a, b]) => `${a}-${b}`));

    return {
        centers: CENTERS.map((center) => ({
            center,
            points: CENTER_POLYGONS[center],
            defined: defined.has(center),
        })),
        channels: CHANNELS.map(([from, to]) => {
            const key = `${from}-${to}`;
            const paths = channelPaths(from, to, CHANNEL_CURVES[key]);

            return {
                key,
                d: paths.whole,
                defined: definedChannels.has(key),
                halves: [
                    {
                        d: paths.halves[0], state: stateOf(from),
                    }, {
                        d: paths.halves[1], state: stateOf(to),
                    },
                ],
            };
        }),
        gates: Object.entries(GATE_POSITIONS).map(([gate, [x, y]]) => ({
            gate: Number(gate), x, y, state: stateOf(Number(gate)),
        })),
    };
}
