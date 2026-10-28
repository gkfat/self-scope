import { CENTERS } from '../../constants/humanDesign';
import { CHANNEL_NAMES } from '../../constants/humanDesignChannels';
import {
    humanDesignAuthoritySchema, humanDesignTypeSchema, type HumanDesignResult,
} from '../../schemas/firestore/humanDesign.schema';
import type { MappingEntry } from '../schema';

/**
 * The terms of the human design the mapping rules use: the type, the inner authority, a defined center and a channel.
 * The profile, the definition and the angle of the cross say how a life role plays out, not a trait, and are not mapped.
 */
export const HUMAN_DESIGN_TERMS: readonly string[] = [
    ...humanDesignTypeSchema.options.map((type) => `hd:type:${type}`),
    ...humanDesignAuthoritySchema.options.map((authority) => `hd:authority:${authority}`),
    ...CENTERS.map((center) => `hd:center:${center}:defined`),
    ...Object.keys(CHANNEL_NAMES).map((channel) => `hd:channel:${channel}`),
];

/** The terms of one chart: its type, its authority, each defined center and each complete channel. */
export function humanDesignTermsOf(chart: Pick<HumanDesignResult, 'type' | 'authority' | 'definedCenters' | 'channels'>): string[] {
    return [
        `hd:type:${chart.type}`,
        `hd:authority:${chart.authority}`,
        ...chart.definedCenters.map((center) => `hd:center:${center}:defined`),
        ...chart.channels.map(([a, b]) => `hd:channel:${Math.min(a, b)}-${Math.max(a, b)}`),
    ];
}

const rule = (term: string, ...axisEnds: string[]): MappingEntry[] => axisEnds.map((axisEnd) => ({
    system: 'HUMAN_DESIGN',
    term,
    axisEnd,
    method: 'structural',
    kind: 'trait',
}));

/**
 * The rule is structural: a term points at an axis end only where the reading already fixed in the project for that
 * term (the center, channel and type texts, which have been reviewed) says in so many words what the end describes.
 * Where the text says nothing the end describes, the term stays unmapped; nothing is stretched to fill an end.
 * Not mapped on purpose: the projector (guiding and waiting for an invitation points both ways on the lead / support
 * axis), the external authority (its definition could not be confirmed from sources), the head, throat and G centers.
 */
export const HUMAN_DESIGN_MAPPINGS: readonly MappingEntry[] = [
    // Types
    ...rule('hd:type:MANIFESTOR', 'B2.A', 'E3.A'), // starts things without waiting for anyone's nod
    ...rule('hd:type:GENERATOR', 'B4.A'), // steady energy that stays with what it is invested in
    ...rule('hd:type:MANIFESTING_GENERATOR', 'A4.A'), // several interests at once, switching between them quickly
    ...rule('hd:type:REFLECTOR', 'C1.A'), // takes in the mood of the people and place around it

    // Inner authorities: what the decision rests on
    ...rule('hd:authority:EMOTIONAL', 'C1.A', 'B3.B'), // ups and downs of feeling; waits for clarity before deciding
    ...rule('hd:authority:SACRAL', 'A1.B'), // a gut response of the body, before any thinking
    ...rule('hd:authority:SPLENIC', 'A1.B', 'B3.A'), // a single, instant intuition in the moment
    ...rule('hd:authority:EGO', 'E3.A', 'E5.A'), // what I want, and what I can keep my word on
    ...rule('hd:authority:SELF_PROJECTED', 'C2.A'), // hears the answer by saying it aloud
    ...rule('hd:authority:LUNAR', 'B3.B'), // lets a whole lunar cycle pass before a big decision

    // Defined centers: the steadier sources
    ...rule('hd:center:AJNA:defined', 'A2.A'), // a fixed way of sorting and judging, a thinking style of one's own
    ...rule('hd:center:HEART:defined', 'E5.A'), // steady willpower, what is promised gets done
    ...rule('hd:center:SACRAL:defined', 'B4.A'), // lasting vitality and working energy
    ...rule('hd:center:SPLEEN:defined', 'A1.B', 'B3.A'), // steady intuition, quick reaction to what is happening
    ...rule('hd:center:SOLAR_PLEXUS:defined', 'C1.A'), // feeling that runs in waves
    ...rule('hd:center:ROOT:defined', 'C1.B'), // a fixed rhythm and drive under pressure

    // Channels, by what the project's reading of each one says
    ...rule('hd:channel:1-8', 'A2.A'), // wants to express in a way of one's own
    ...rule('hd:channel:2-14', 'A1.B'), // an intuition for direction
    ...rule('hd:channel:3-60', 'A3.A'), // a breakthrough after a stall
    ...rule('hd:channel:4-63', 'A1.A'), // asks why, answers with logic and patterns
    ...rule('hd:channel:6-59', 'D1.A'), // wants closeness, bonds through feeling
    ...rule('hd:channel:7-31', 'D5.A'), // stands up to give a direction, puts it into words
    ...rule('hd:channel:9-52', 'A5.A', 'A4.B'), // focus on detail, takes one thing deep
    ...rule('hd:channel:10-20', 'B1.B', 'C3.A'), // lives in the moment, speaks and acts directly
    ...rule('hd:channel:10-34', 'A2.A', 'E3.A'), // follows its own conviction, little swayed by others' routes
    ...rule('hd:channel:10-57', 'A1.B'), // lives by intuition
    ...rule('hd:channel:11-56', 'A4.A', 'C2.A'), // curious, collects ideas, tells them as stories
    ...rule('hd:channel:12-22', 'C2.A', 'C1.A'), // expressive and infectious when in good spirits, withdraws when low
    ...rule('hd:channel:16-48', 'A4.B', 'B4.A'), // depth and mastery through repetition
    ...rule('hd:channel:17-62', 'A5.A', 'A1.A', 'B5.A'), // organizes thoughts into clear details, with logic
    ...rule('hd:channel:18-58', 'A5.A', 'D6.B'), // sees what could be better, sensitive to imperfection
    ...rule('hd:channel:19-49', 'D1.A'), // watches whether giving and answering in a relationship are in balance
    ...rule('hd:channel:20-34', 'B3.A'), // does it at once, turns energy straight into action
    ...rule('hd:channel:20-57', 'A1.B', 'C3.A'), // feels the moment, says it as soon as the intuition comes
    ...rule('hd:channel:21-45', 'D5.A'), // wants to hold resources and the lead
    ...rule('hd:channel:23-43', 'A3.A'), // sudden insights of its own
    ...rule('hd:channel:25-51', 'B2.A', 'A3.A'), // first to try, breaks the existing arrangement
    ...rule('hd:channel:26-44', 'D5.A'), // conveys the value of a thing and moves others to it
    ...rule('hd:channel:27-50', 'D2.A', 'E6.A'), // looks after people, guards values, takes responsibility
    ...rule('hd:channel:28-38', 'B4.A', 'E2.A'), // works for what is meaningful, does not give up against resistance
    ...rule('hd:channel:29-46', 'E5.A', 'B4.A'), // says yes and goes all the way in
    ...rule('hd:channel:30-41', 'E1.B'), // a strong wish for new experience
    ...rule('hd:channel:32-54', 'E4.A'), // an ambition to rise, keeps working for growth
    ...rule('hd:channel:34-57', 'A1.B', 'B3.A'), // intuition together with drive, quick when needed
    ...rule('hd:channel:35-36', 'E1.B'), // wants new experience
    ...rule('hd:channel:37-40', 'E3.B', 'D2.A'), // values family and friends, gives to keep a relationship steady
    ...rule('hd:channel:39-55', 'C1.A'), // feeling like a tide, rising and falling
];
