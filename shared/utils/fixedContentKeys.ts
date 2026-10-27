// Plain `.ts` import specifiers: this file is also run directly by Node
// (type stripping) from scripts/, where extensionless imports do not resolve.
import {
    MBTI_TYPES, NUMEROLOGY_NUMBERS, ZODIACS,
} from '../schemas/common.ts';
import type {
    BloodType, MbtiType, NumerologyNumber, Zodiac,
} from '../schemas/common.ts';

export { NUMEROLOGY_NUMBERS };

export const FIXED_CONTENT_TYPES = [
    'SUMMARY',
    'ZODIAC',
    'BLOOD',
    'MBTI',
    'NUMEROLOGY',
] as const;

export type FixedContentType = typeof FIXED_CONTENT_TYPES[number];

/** Blood types that can have a blood-type analysis (UNKNOWN is excluded, RULE-002). */
export const ANALYZABLE_BLOOD_TYPES = [
    'A',
    'B',
    'O',
    'AB',
] as const;

export type SummaryCombination = {
    zodiac: Zodiac | null;
    mbti: MbtiType | null;
    /** null when the blood type is unknown or not part of the combination */
    bloodType: Exclude<BloodType, 'UNKNOWN'> | null;
    /** Life path number, as the key text */
    numerology?: NumerologyNumber | null;
};

/** Written content covers two, three or all four of the parts. */
export const MAX_SUMMARY_PARTS = 4;

/**
 * Deterministic key of a summary combination: the chosen parts in the fixed order zodiac, MBTI, blood
 * type, joined with `_` (`aries_INTJ`, `aries_A`, `INTJ_A`, `aries_INTJ_A`). Using it as the document id
 * is what keeps a combination unique (RULE-021).
 */
export function summaryKey(combination: SummaryCombination): string {
    return [
        combination.zodiac,
        combination.mbti,
        combination.bloodType,
        combination.numerology,
    ].filter((part) => typeof part === 'string').join('_');
}

const SUMMARY_PART_ORDER = [
    'zodiac',
    'mbti',
    'bloodType',
    'numerology',
] as const;

/** Which part a key token is, or null when it is none of them. */
function summaryPartOf(token: string): typeof SUMMARY_PART_ORDER[number] | null {
    if ((ZODIACS as readonly string[]).includes(token)) return 'zodiac';
    if ((MBTI_TYPES as readonly string[]).includes(token)) return 'mbti';
    if ((ANALYZABLE_BLOOD_TYPES as readonly string[]).includes(token)) return 'bloodType';
    if ((NUMEROLOGY_NUMBERS as readonly string[]).includes(token)) return 'numerology';

    return null;
}

/** The combination a key stands for, or null when it is not a legal key (at least two parts, in order). */
export function parseSummaryKey(key: string): SummaryCombination | null {
    const tokens = key.split('_');

    if (tokens.length < 2 || tokens.length > MAX_SUMMARY_PARTS) return null;

    const combination: SummaryCombination = {
        zodiac: null, mbti: null, bloodType: null, numerology: null,
    };
    let lastOrder = -1;

    for (const token of tokens) {
        const part = summaryPartOf(token);

        if (!part) return null;

        // Each part once, and in the fixed order, so one combination has exactly one key.
        const order = SUMMARY_PART_ORDER.indexOf(part);

        if (order <= lastOrder) return null;

        lastOrder = order;
        Object.assign(combination, { [part]: token });
    }

    return combination;
}

export function fixedContentId(type: FixedContentType, key: string): string {
    return `${type}_${key}`;
}

/** Whether `key` is a legal key for this content type. */
export function isValidContentKey(type: FixedContentType, key: string): boolean {
    switch (type) {
    case 'SUMMARY': return parseSummaryKey(key) !== null;
    case 'ZODIAC': return (ZODIACS as readonly string[]).includes(key);
    case 'BLOOD': return (ANALYZABLE_BLOOD_TYPES as readonly string[]).includes(key);
    case 'MBTI': return (MBTI_TYPES as readonly string[]).includes(key);
    case 'NUMEROLOGY': return (NUMEROLOGY_NUMBERS as readonly string[]).includes(key);
    }
}

/**
 * Every document id that must exist before launch:
 * every summary combination (2 to 4 of zodiac, MBTI, blood type and life path number) plus 12 + 4 + 16 + 12 single results.
 */
export function expectedFixedContentIds(): string[] {
    const ids: string[] = [];

    const zodiacs = [...ZODIACS, null];
    const mbtis = [...MBTI_TYPES, null];
    const bloods = [...ANALYZABLE_BLOOD_TYPES, null];
    const numbers = [...NUMEROLOGY_NUMBERS, null];

    // Every way to pick two, three or four of the four parts
    for (const zodiac of zodiacs) {
        for (const mbti of mbtis) {
            for (const bloodType of bloods) {
                for (const numerology of numbers) {
                    const chosen = [
                        zodiac,
                        mbti,
                        bloodType,
                        numerology,
                    ].filter((part) => part !== null).length;

                    if (chosen >= 2 && chosen <= MAX_SUMMARY_PARTS) ids.push(fixedContentId('SUMMARY', summaryKey({
                        zodiac, mbti, bloodType, numerology,
                    })));
                }
            }
        }
    }

    for (const zodiac of ZODIACS) ids.push(fixedContentId('ZODIAC', zodiac));
    for (const bloodType of ANALYZABLE_BLOOD_TYPES) ids.push(fixedContentId('BLOOD', bloodType));
    for (const mbti of MBTI_TYPES) ids.push(fixedContentId('MBTI', mbti));
    for (const number of NUMEROLOGY_NUMBERS) ids.push(fixedContentId('NUMEROLOGY', number));

    return ids;
}
