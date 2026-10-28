import {
    CENTER_GATES, CENTERS, CHANNELS, GATE_SPAN_DEGREES, GATE_WHEEL, GATE_WHEEL_START_DEGREES, LINE_SPAN_DEGREES, MOTOR_CENTERS,
    type Center,
} from '../constants/humanDesign';
import type {
    HumanDesignActivation, HumanDesignBody, HumanDesignResult, IncarnationCross,
} from '../schemas/firestore/humanDesign.schema';

const normalizeDegrees = (degrees: number): number => ((degrees % 360) + 360) % 360;

/** Where a body's ecliptic longitude falls on the gate wheel. */
export function activationFromLongitude(body: HumanDesignBody, longitude: number): HumanDesignActivation {
    const fromStart = normalizeDegrees(longitude - GATE_WHEEL_START_DEGREES);
    // Guard against floating-point drift pushing 359.9999… past the last index.
    const gateIndex = Math.min(63, Math.floor(fromStart / GATE_SPAN_DEGREES));
    const withinGate = fromStart - gateIndex * GATE_SPAN_DEGREES;
    const line = Math.min(6, Math.floor(withinGate / LINE_SPAN_DEGREES) + 1);

    return {
        body,
        gate: GATE_WHEEL[gateIndex] as number,
        line,
    };
}

export const centerOfGate = (() => {
    const lookup = new Map<number, Center>();

    for (const center of CENTERS) {
        for (const gate of CENTER_GATES[center]) lookup.set(gate, center);
    }

    return (gate: number): Center => {
        const center = lookup.get(gate);

        if (!center) throw new Error(`Gate ${gate} does not belong to any center`);

        return center;
    };
})();

/** Centers reachable from `start` through defined channels. */
function reachable(start: Center, links: ReadonlyMap<Center, Set<Center>>): Set<Center> {
    const seen = new Set<Center>([start]);
    const queue: Center[] = [start];

    while (queue.length > 0) {
        const current = queue.shift() as Center;

        for (const next of links.get(current) ?? []) {
            if (seen.has(next)) continue;

            seen.add(next);
            queue.push(next);
        }
    }

    return seen;
}

function definitionFrom(count: number): HumanDesignResult['definition'] {
    if (count === 0) return 'NONE';
    if (count === 1) return 'SINGLE';
    if (count === 2) return 'SPLIT';
    if (count === 3) return 'TRIPLE_SPLIT';

    return 'QUADRUPLE_SPLIT';
}

/**
 * Profiles 1/3 to 3/6 live a Right Angle (personal destiny), 4/1 a Juxtaposition (fixed fate),
 * and 4/6 to 6/3 a Left Angle (transpersonal destiny).
 */
function crossAngleFor(profile: string): IncarnationCross['angle'] {
    if (profile === '4/1') return 'JUXTAPOSITION';
    if ([
        '1/3',
        '1/4',
        '2/4',
        '2/5',
        '3/5',
        '3/6',
    ].includes(profile)) return 'RIGHT_ANGLE';

    return 'LEFT_ANGLE';
}

function crossGates(
    personality: readonly HumanDesignActivation[],
    design: readonly HumanDesignActivation[],
): IncarnationCross['gates'] {
    const gateOf = (activations: readonly HumanDesignActivation[], body: HumanDesignBody): number => {
        const found = activations.find((activation) => activation.body === body);

        if (!found) throw new Error(`${body} activation is required to derive the incarnation cross`);

        return found.gate;
    };

    return [
        gateOf(personality, 'SUN'),
        gateOf(personality, 'EARTH'),
        gateOf(design, 'SUN'),
        gateOf(design, 'EARTH'),
    ];
}

/**
 * Derive everything except the gate activations from the two activation lists
 * (Personality = at birth, Design = 88° of solar arc earlier). Pure, so it can be
 * tested with hand-picked gates.
 *
 * Changing what this calculates: raise RULE_VERSIONS.HUMAN_DESIGN in shared/utils/analysisBasis.ts.
 */
export function deriveChart(
    personality: readonly HumanDesignActivation[],
    design: readonly HumanDesignActivation[],
): HumanDesignResult {
    const activeGates = new Set([...personality, ...design].map((activation) => activation.gate));
    const channels = CHANNELS.filter(([a, b]) => activeGates.has(a) && activeGates.has(b));

    const links = new Map<Center, Set<Center>>();
    const defined = new Set<Center>();

    for (const [a, b] of channels) {
        const from = centerOfGate(a);
        const to = centerOfGate(b);

        defined.add(from);
        defined.add(to);
        links.set(from, (links.get(from) ?? new Set()).add(to));
        links.set(to, (links.get(to) ?? new Set()).add(from));
    }

    // Connected groups of defined centers
    const grouped = new Set<Center>();
    let groups = 0;

    for (const center of defined) {
        if (grouped.has(center)) continue;

        groups += 1;
        for (const member of reachable(center, links)) grouped.add(member);
    }

    const motorReachesThroat = MOTOR_CENTERS.some((motor) => defined.has(motor) && reachable(motor, links).has('THROAT'));

    const type = ((): HumanDesignResult['type'] => {
        if (defined.size === 0) return 'REFLECTOR';
        if (defined.has('SACRAL')) return motorReachesThroat ? 'MANIFESTING_GENERATOR' : 'GENERATOR';

        return motorReachesThroat ? 'MANIFESTOR' : 'PROJECTOR';
    })();

    const strategy = ((): HumanDesignResult['strategy'] => {
        if (type === 'MANIFESTOR') return 'INFORM';
        if (type === 'PROJECTOR') return 'WAIT_FOR_INVITATION';
        if (type === 'REFLECTOR') return 'WAIT_A_LUNAR_CYCLE';

        return 'RESPOND';
    })();

    const authority = ((): HumanDesignResult['authority'] => {
        if (type === 'REFLECTOR') return 'LUNAR';
        if (defined.has('SOLAR_PLEXUS')) return 'EMOTIONAL';
        if (defined.has('SACRAL')) return 'SACRAL';
        if (defined.has('SPLEEN')) return 'SPLENIC';
        if (defined.has('HEART')) return 'EGO';
        if (defined.has('G')) return 'SELF_PROJECTED';

        return 'MENTAL';
    })();

    const sunLine = (activations: readonly HumanDesignActivation[]): number => {
        const sun = activations.find((activation) => activation.body === 'SUN');

        if (!sun) throw new Error('Sun activation is required to derive the profile');

        return sun.line;
    };

    const profile = `${sunLine(personality)}/${sunLine(design)}`;

    return {
        type,
        strategy,
        authority,
        profile,
        definition: definitionFrom(groups),
        incarnationCross: {
            angle: crossAngleFor(profile),
            gates: crossGates(personality, design),
        },
        definedCenters: CENTERS.filter((center) => defined.has(center)),
        channels: channels.map(([a, b]) => [a, b]),
        personality: [...personality],
        design: [...design],
    };
}

export type HangingGate = {
    gate: number;
    center: Center;
    /** The channels this gate belongs to, with the gate that would complete each one */
    channels: Array<{ key: string; partner: number }>;
};

/**
 * Gates that are active but have no partner: each one is half of a channel. Which channels it could
 * complete is fixed by the system, so it can be shown without any interpretation.
 */
export function hangingGates(chart: Pick<HumanDesignResult, 'personality' | 'design' | 'channels'>): HangingGate[] {
    const inChannel = new Set(chart.channels.flat());
    const active = new Set([...chart.personality, ...chart.design].map((activation) => activation.gate));

    return [...active]
        .filter((gate) => !inChannel.has(gate))
        .sort((a, b) => a - b)
        .map((gate) => ({
            gate,
            center: centerOfGate(gate),
            channels: CHANNELS
                .filter(([a, b]) => a === gate || b === gate)
                .map(([a, b]) => ({
                    key: `${a}-${b}`, partner: a === gate ? b : a,
                })),
        }));
}
