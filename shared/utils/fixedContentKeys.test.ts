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
            zodiac: 'leo', mbti: 'ENFP', bloodType: 'O',
        } as const;

        expect(parseSummaryKey(summaryKey(combo))).toEqual(combo);
    });

    it('rejects malformed or unknown keys', () => {
        expect(parseSummaryKey('aries')).toBeNull();
        expect(parseSummaryKey('aries_INTJ_X')).toBeNull();
        expect(parseSummaryKey('aries_INTJ_UNKNOWN')).toBeNull();
        expect(parseSummaryKey('nope_INTJ')).toBeNull();
        expect(parseSummaryKey('aries_INTJ_A_extra')).toBeNull();
    });
});

describe('isValidContentKey', () => {
    it('validates each content type', () => {
        expect(isValidContentKey('ZODIAC', 'aries')).toBe(true);
        expect(isValidContentKey('ZODIAC', 'INTJ')).toBe(false);
        expect(isValidContentKey('BLOOD', 'AB')).toBe(true);
        expect(isValidContentKey('BLOOD', 'UNKNOWN')).toBe(false);
        expect(isValidContentKey('MBTI', 'INTJ')).toBe(true);
        expect(isValidContentKey('SUMMARY', 'aries_INTJ_A')).toBe(true);
    });
});

describe('expectedFixedContentIds', () => {
    const ids = expectedFixedContentIds();

    it('lists 960 summaries plus 32 single results, all unique', () => {
        expect(ids).toHaveLength(992);
        expect(new Set(ids).size).toBe(992);
        expect(ids.filter((id) => id.startsWith('SUMMARY_'))).toHaveLength(960);
        expect(ids.filter((id) => id.startsWith('ZODIAC_'))).toHaveLength(12);
        expect(ids.filter((id) => id.startsWith('BLOOD_'))).toHaveLength(4);
        expect(ids.filter((id) => id.startsWith('MBTI_'))).toHaveLength(16);
    });

    it('splits summaries into 192 two-factor and 768 three-factor combinations', () => {
        const summaries = ids.filter((id) => id.startsWith('SUMMARY_'));

        expect(summaries.filter((id) => id.split('_').length === 3)).toHaveLength(192);
        expect(summaries.filter((id) => id.split('_').length === 4)).toHaveLength(768);
    });

    it('uses the same id format as fixedContentId', () => {
        expect(ids).toContain(fixedContentId('SUMMARY', 'aries_INTJ'));
    });
});
