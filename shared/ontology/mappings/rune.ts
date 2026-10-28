import { runeContentKeys } from '../../constants/runes';
import type { MappingEntry } from '../schema';
import { stateRule } from './stateRule';

/** Every rune the day can bring, in the orientations it can take: "rune:<rune>:<orientation>". */
export const RUNE_TERMS: readonly string[] = runeContentKeys().map((key) => {
    const [rune = '', orientation = ''] = key.split('_');

    return `rune:${rune}:${orientation}`;
});

export const runeTermsOf = (rune: number, orientation: string): string[] => [`rune:${rune}:${orientation}`];

const rule = stateRule('RUNE');

/**
 * Where today leans, by the keywords of the reviewed rune readings. Runes whose keywords name no axis end stay
 * unmapped. The orientation of a rune is the project's own rule (not every tradition reads runes as reversed).
 */
export const RUNE_MAPPINGS: readonly MappingEntry[] = [
    ...rule('rune:1:upright', 'B4.A', 'E3.A'), // Uruz: an inner force, pushes by its own strength
    ...rule('rune:2:upright', 'D2.B'), // Thurisaz: clears the boundary
    ...rule('rune:3:upright', 'C2.A'), // Ansuz: says it in clear words
    ...rule('rune:6:upright', 'D2.A', 'D3.A'), // Gebo: giving and receiving in balance
    ...rule('rune:7:upright', 'E3.B'), // Wunjo: accepted, shares the good mood
    ...rule('rune:8:upright', 'B4.B'), // Hagalaz: accepts and rearranges
    ...rule('rune:10:upright', 'B3.B'), // Isa: stops, observes before acting
    ...rule('rune:11:upright', 'B6.B'), // Jera: trusts the process
    ...rule('rune:12:upright', 'B4.A'), // Eihwaz: steadiness, perseverance
    ...rule('rune:13:upright', 'E1.B'), // Perthro: open to the unknown
    ...rule('rune:13:reversed', 'E1.A'), // Perthro: wants certainty
    ...rule('rune:14:upright', 'D2.B'), // Algiz: mind the boundary
    ...rule('rune:15:upright', 'B6.A'), // Sowilo: energy into a goal
    ...rule('rune:16:upright', 'E6.A'), // Tiwaz: stands up, takes responsibility
    ...rule('rune:17:upright', 'D2.A'), // Berkano: tends what is growing
    ...rule('rune:17:reversed', 'D2.A'), // Berkano: puts one's own needs last
    ...rule('rune:18:upright', 'D3.A'), // Ehwaz: goes well together, trusting
    ...rule('rune:19:upright', 'D3.A'), // Mannaz: cooperation
    ...rule('rune:19:reversed', 'D3.A'), // Mannaz: pleases too much
    ...rule('rune:20:upright', 'A1.B', 'C1.A'), // Laguz: intuition and feeling are keen
    ...rule('rune:22:upright', 'E1.B'), // Dagaz: a turn, a step forward
    ...rule('rune:23:upright', 'E3.B', 'A3.B'), // Othala: roots, belonging, what was handed down
];
