import {
    describe, expect, it,
} from 'vitest';
import {
    expectedFixedContentIds,
    fixedContentId,
    isValidContentKey,
    parseSummaryKey,
    summaryKey,
} from './fixedContentKeys';

describe('summary keys', () => {
    it('builds deterministic keys with and without blood type', () => {
        expect(summaryKey({
            zodiac: 'aries', mbti: 'INTJ', bloodType: null,
        })).toBe('aries_INTJ');
        expect(summaryKey({
            zodiac: 'aries', mbti: 'INTJ', bloodType: 'AB',
        })).toBe('aries_INTJ_AB');
    });

    it('round-trips through parseSummaryKey', () => {
        const combo = {
            zodiac: 'leo', mbti: 'ENFP', bloodType: 'O', numerology: null,
        } as const;

        expect(parseSummaryKey(summaryKey(combo))).toEqual(combo);
    });

    it('builds keys for pairs that leave one part out, in the fixed order', () => {
        expect(summaryKey({
            zodiac: 'aries', mbti: null, bloodType: 'A',
        })).toBe('aries_A');
        expect(summaryKey({
            zodiac: null, mbti: 'INTJ', bloodType: 'A',
        })).toBe('INTJ_A');
        expect(parseSummaryKey('aries_A')).toEqual({
            zodiac: 'aries', mbti: null, bloodType: 'A', numerology: null,
        });
        expect(parseSummaryKey('INTJ_AB')).toEqual({
            zodiac: null, mbti: 'INTJ', bloodType: 'AB', numerology: null,
        });
        expect(parseSummaryKey('aries_11')).toEqual({
            zodiac: 'aries', mbti: null, bloodType: null, numerology: '11',
        });
        expect(parseSummaryKey('INTJ_A_7')).toEqual({
            zodiac: null, mbti: 'INTJ', bloodType: 'A', numerology: '7',
        });
        expect(parseSummaryKey('aries_INTJ_A_7')).toEqual({
            zodiac: 'aries', mbti: 'INTJ', bloodType: 'A', numerology: '7',
        });
    });

    it('rejects parts out of order or repeated', () => {
        expect(parseSummaryKey('A_aries')).toBeNull();
        expect(parseSummaryKey('INTJ_aries')).toBeNull();
        expect(parseSummaryKey('aries_aries')).toBeNull();
        expect(parseSummaryKey('A_O')).toBeNull();
    });

    it('rejects malformed or unknown keys', () => {
        expect(parseSummaryKey('aries')).toBeNull();
        expect(parseSummaryKey('aries_INTJ_X')).toBeNull();
        expect(parseSummaryKey('aries_INTJ_UNKNOWN')).toBeNull();
        expect(parseSummaryKey('nope_INTJ')).toBeNull();
        expect(parseSummaryKey('aries_INTJ_A_extra')).toBeNull();
        // A number cannot come before the other parts
        expect(parseSummaryKey('aries_INTJ_A_7_extra')).toBeNull();
        expect(parseSummaryKey('7_aries')).toBeNull();
        expect(parseSummaryKey('aries_10')).toBeNull();
    });
});

describe('isValidContentKey', () => {
    it('validates each content type', () => {
        expect(isValidContentKey('ZODIAC', 'aries')).toBe(true);
        expect(isValidContentKey('ZODIAC', 'INTJ')).toBe(false);
        expect(isValidContentKey('BLOOD', 'AB')).toBe(true);
        expect(isValidContentKey('BLOOD', 'UNKNOWN')).toBe(false);
        expect(isValidContentKey('MBTI', 'INTJ')).toBe(true);
        expect(isValidContentKey('NUMEROLOGY', '11')).toBe(true);
        expect(isValidContentKey('NUMEROLOGY', '10')).toBe(false);
        expect(isValidContentKey('SUMMARY', 'aries_INTJ_A')).toBe(true);
    });
});

describe('expectedFixedContentIds', () => {
    const ids = expectedFixedContentIds();

    it('lists 14320 summaries plus 44 single results, all unique', () => {
        expect(ids).toHaveLength(14364);
        expect(new Set(ids).size).toBe(14364);
        expect(ids.filter((id) => id.startsWith('SUMMARY_'))).toHaveLength(14320);
        expect(ids.filter((id) => id.startsWith('ZODIAC_'))).toHaveLength(12);
        expect(ids.filter((id) => id.startsWith('BLOOD_'))).toHaveLength(4);
        expect(ids.filter((id) => id.startsWith('MBTI_'))).toHaveLength(16);
        expect(ids.filter((id) => id.startsWith('NUMEROLOGY_'))).toHaveLength(12);
    });

    it('splits summaries into 688 pairs, 4416 triples and 9216 with all four parts', () => {
        const summaries = ids.filter((id) => id.startsWith('SUMMARY_'));

        // zodiac x MBTI 192, zodiac x blood 48, MBTI x blood 64, and each of the three x life path number 144, 192, 48
        expect(summaries.filter((id) => id.split('_').length === 3)).toHaveLength(688);
        // zodiac x MBTI x blood 768, plus 2304, 576 and 768 with the life path number
        expect(summaries.filter((id) => id.split('_').length === 4)).toHaveLength(4416);
        // 12 x 16 x 4 x 12
        expect(summaries.filter((id) => id.split('_').length === 5)).toHaveLength(9216);
    });

    it('uses the same id format as fixedContentId', () => {
        expect(ids).toContain(fixedContentId('SUMMARY', 'aries_INTJ'));
    });
});
