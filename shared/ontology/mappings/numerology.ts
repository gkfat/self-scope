import { NUMEROLOGY_NUMBERS } from '../../schemas/common';
import { keywordRule } from './keywordRule';
import type { MappingEntry } from '../schema';

/** The life path numbers 1 to 9 and the master numbers 11, 22 and 33, e.g. "numerology:7". */
export const NUMEROLOGY_TERMS: readonly string[] = NUMEROLOGY_NUMBERS.map((number) => `numerology:${number}`);

export const numerologyTermsOf = (lifePath: number | string): string[] => [`numerology:${lifePath}`];

const rule = keywordRule('NUMEROLOGY');

/**
 * The rule is by keyword: a number points at an axis end where the keywords of the number, as the reviewed readings list
 * them, say what the end describes. Popular numerology writing agrees on the large lines (1 to 3 lead and decide, 4 to 6
 * look for stability and security, 7 turns inward, 9 is compassionate, 11 inspires and has insight, 22 builds); the rest
 * is the project's reviewed readings. It is numerology, with no scientific evidence behind it.
 */
export const NUMEROLOGY_MAPPINGS: readonly MappingEntry[] = [
    ...rule('numerology:1', 'E3.A', 'B3.A', 'B2.A', 'A3.A'), // independent, decisive, pioneering, ready to try
    ...rule('numerology:2', 'D3.A', 'D2.A', 'A2.B', 'C2.B'), // coordinates, senses what others need, minds others' views, keeps displeasure inside
    ...rule('numerology:3', 'C2.A', 'C4.A', 'A3.A'), // expressive, optimistic, creative
    ...rule('numerology:4', 'E6.A', 'B5.A', 'B4.A'), // responsible, orderly, enduring
    ...rule('numerology:5', 'B4.B', 'A4.A', 'E1.B', 'E5.B'), // adaptable, curious, takes to change, free
    ...rule('numerology:6', 'D2.A', 'E6.A', 'D3.A'), // cares for others, responsible, makes harmony
    ...rule('numerology:7', 'A4.B', 'D4.B'), // deep thinking, quiet, researches alone
    ...rule('numerology:8', 'B6.A', 'B3.A', 'E6.A'), // goal-driven, decisive, takes responsibility
    ...rule('numerology:9', 'D6.A', 'E2.A', 'D2.A'), // accepting, idealistic, caring
    ...rule('numerology:11', 'A1.B', 'E2.A', 'C1.A'), // sharp intuition, ideals, senses the atmosphere
    ...rule('numerology:22', 'B1.A', 'B5.A', 'D5.A'), // long-range planning, organizes and builds, influence
    ...rule('numerology:33', 'D2.A', 'D5.A'), // selfless care, guides others
];
