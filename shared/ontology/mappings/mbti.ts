import { MBTI_AXES } from '../../constants/mbtiGuide';
import type { MappingEntry } from '../schema';

/** The terms of MBTI: the side of each of the four pairs a result leans to, e.g. "mbti:EI:I". */
export const MBTI_TERMS: readonly string[] = MBTI_AXES.flatMap((axis) => [axis.first.letter, axis.second.letter].map((letter) => `mbti:${axis.key}:${letter}`));

/** The terms of one result, e.g. INTJ -> mbti:EI:I, mbti:SN:N, mbti:TF:T, mbti:JP:J. */
export function mbtiTermsOf(type: string): string[] {
    return MBTI_AXES.map((axis, index) => `mbti:${axis.key}:${type[index] ?? ''}`);
}

const mapping = (term: string, axisEnd: string): MappingEntry => ({
    system: 'MBTI',
    term: `mbti:${term}`,
    axisEnd,
    method: 'structural',
    kind: 'trait',
});

/**
 * The rule is structural: each side of a pair points at the ends of the axes that the pair's own definition describes
 * (Myers & Briggs Foundation, "The MBTI preferences", https://www.myersbriggs.org/my-mbti-personality-type/the-mbti-preferences/):
 *
 * - E gets energy from interacting with people, I from the inner world: D4 (social vs. solitary).
 * - S attends to concrete details and facts and trusts experience: A5.A (details) and A3.B (proven ways).
 *   N attends to patterns, possibilities and the big picture: A5.B (whole) and A3.A (new ways).
 * - T decides by logical analysis and objectivity: A1.A and D1.B. F decides by personal and social values, with
 *   understanding and harmony: D1.A and D3.A. F is NOT mapped to the emotional-sensitivity axis (C1): the Foundation
 *   itself says a Feeling preference is not emotionality.
 * - J prefers structure, plans, schedules and being organized: B5.A and B1.A. P prefers staying flexible and responding
 *   as things come up: B5.B and B1.B.
 */
export const MBTI_MAPPINGS: readonly MappingEntry[] = [
    mapping('EI:E', 'D4.A'),
    mapping('EI:I', 'D4.B'),
    mapping('SN:S', 'A5.A'),
    mapping('SN:S', 'A3.B'),
    mapping('SN:N', 'A5.B'),
    mapping('SN:N', 'A3.A'),
    mapping('TF:T', 'A1.A'),
    mapping('TF:T', 'D1.B'),
    mapping('TF:F', 'D1.A'),
    mapping('TF:F', 'D3.A'),
    mapping('JP:J', 'B5.A'),
    mapping('JP:J', 'B1.A'),
    mapping('JP:P', 'B5.B'),
    mapping('JP:P', 'B1.B'),
];
