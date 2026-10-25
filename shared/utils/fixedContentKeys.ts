// Plain `.ts` import specifiers: this file is also run directly by Node
// (type stripping) from scripts/, where extensionless imports do not resolve.
import {
    MBTI_TYPES, ZODIACS,
} from '../schemas/common.ts';
import type {
    BloodType, MbtiType, Zodiac,
} from '../schemas/common.ts';

export const FIXED_CONTENT_TYPES = [
    'SUMMARY',
    'ZODIAC',
    'BLOOD',
    'MBTI',
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
    zodiac: Zodiac;
    mbti: MbtiType;
    /** null when the blood type is unknown or not given */
    bloodType: Exclude<BloodType, 'UNKNOWN'> | null;
};

/**
 * Deterministic key of a summary combination: `zodiac_MBTI` or `zodiac_MBTI_blood`.
 * Using it as the document id is what keeps a combination unique (RULE-021).
 */
export function summaryKey(combination: SummaryCombination): string {
    const base = `${combination.zodiac}_${combination.mbti}`;

    return combination.bloodType ? `${base}_${combination.bloodType}` : base;
}

export function parseSummaryKey(key: string): SummaryCombination | null {
    const [
        zodiac,
        mbti,
        bloodType,
        ...rest
    ] = key.split('_');

    if (rest.length > 0) return null;
    if (!ZODIACS.includes(zodiac as Zodiac)) return null;
    if (!MBTI_TYPES.includes(mbti as MbtiType)) return null;

    if (bloodType === undefined) {
        return {
            zodiac: zodiac as Zodiac, mbti: mbti as MbtiType, bloodType: null,
        };
    }

    if (!(ANALYZABLE_BLOOD_TYPES as readonly string[]).includes(bloodType)) return null;

    return {
        zodiac: zodiac as Zodiac,
        mbti: mbti as MbtiType,
        bloodType: bloodType as SummaryCombination['bloodType'],
    };
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
    }
}

/**
 * Every document id that must exist before launch:
 * 192 zodiac x mbti + 768 zodiac x mbti x blood summaries (960) plus 12 + 4 + 16 single results.
 */
export function expectedFixedContentIds(): string[] {
    const ids: string[] = [];

    for (const zodiac of ZODIACS) {
        for (const mbti of MBTI_TYPES) {
            ids.push(fixedContentId('SUMMARY', summaryKey({
                zodiac, mbti, bloodType: null,
            })));

            for (const bloodType of ANALYZABLE_BLOOD_TYPES) {
                ids.push(fixedContentId('SUMMARY', summaryKey({
                    zodiac, mbti, bloodType,
                })));
            }
        }
    }

    for (const zodiac of ZODIACS) ids.push(fixedContentId('ZODIAC', zodiac));
    for (const bloodType of ANALYZABLE_BLOOD_TYPES) ids.push(fixedContentId('BLOOD', bloodType));
    for (const mbti of MBTI_TYPES) ids.push(fixedContentId('MBTI', mbti));

    return ids;
}
