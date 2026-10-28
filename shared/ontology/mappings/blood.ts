import {
    BLOOD_TYPES, type BloodType,
} from '../../schemas/common';
import { keywordRule } from './keywordRule';
import type { MappingEntry } from '../schema';

/** The four blood types, e.g. "blood:A". "Unknown" is not a term: it says nothing. */
export const BLOOD_TERMS: readonly string[] = BLOOD_TYPES.filter((type) => type !== 'UNKNOWN').map((type) => `blood:${type}`);

export const bloodTermsOf = (type: BloodType): string[] => (type === 'UNKNOWN' ? [] : [`blood:${type}`]);

const rule = keywordRule('BLOOD');

/**
 * The rule is by keyword, and kept to the plainest keywords of the reviewed readings (two ends a type, three for type B, which the reading calls free). Blood type
 * as a personality is a popular belief, mostly known from Japan; researchers there say it has no scientific basis, so it
 * is only ever shown as folklore and adds no more than a hint to an axis.
 */
export const BLOOD_MAPPINGS: readonly MappingEntry[] = [
    ...rule('blood:A', 'B5.A', 'A5.A'), // orderly, attentive to detail
    ...rule('blood:B', 'A2.A', 'A4.A', 'E5.B'), // views of its own, curious, free
    ...rule('blood:O', 'B6.A', 'D3.A'), // clear goals, values the team
    ...rule('blood:AB', 'D1.B', 'C1.B'), // cool and objective
];
