import {
    describe, expect, it,
} from 'vitest';
import {
    isGeneratedAnalysis, multiDimensionCost,
} from './multiDimensionPricing';

describe('multiDimensionCost', () => {
    it('charges written content 1 point for two dimensions and 3 for three', () => {
        expect(multiDimensionCost(['ZODIAC', 'MBTI'])).toBe(1);
        expect(multiDimensionCost(['BLOOD', 'ZODIAC'])).toBe(1);
        expect(multiDimensionCost(['MBTI', 'BLOOD'])).toBe(1);
        expect(multiDimensionCost([
            'ZODIAC',
            'BLOOD',
            'MBTI',
        ])).toBe(3);
    });

    it('charges generated analysis 3, 5 and 8 points for two, three and four dimensions', () => {
        expect(multiDimensionCost(['ZODIAC', 'HUMAN_DESIGN'])).toBe(3);
        expect(multiDimensionCost([
            'ZODIAC',
            'MBTI',
            'HUMAN_DESIGN',
        ])).toBe(5);
        expect(multiDimensionCost([
            'ZODIAC',
            'BLOOD',
            'MBTI',
            'HUMAN_DESIGN',
        ])).toBe(8);
    });

    it('counts the life path number like any other dimension', () => {
        expect(multiDimensionCost(['ZODIAC', 'NUMEROLOGY'])).toBe(1);
        expect(multiDimensionCost([
            'ZODIAC',
            'MBTI',
            'NUMEROLOGY',
        ])).toBe(3);
        expect(multiDimensionCost(['NUMEROLOGY', 'HUMAN_DESIGN'])).toBe(3);
        expect(multiDimensionCost([
            'ZODIAC',
            'BLOOD',
            'MBTI',
            'NUMEROLOGY',
            'HUMAN_DESIGN',
        ])).toBe(13);
    });

    it('charges written content 5 points for all four dimensions', () => {
        expect(multiDimensionCost([
            'ZODIAC',
            'BLOOD',
            'MBTI',
            'NUMEROLOGY',
        ])).toBe(5);
    });

    it('offers nothing below two dimensions', () => {
        expect(multiDimensionCost(['MBTI'])).toBeNull();
        expect(multiDimensionCost([])).toBeNull();
    });

    it('tells generated analysis from written content by the human design', () => {
        expect(isGeneratedAnalysis(['ZODIAC', 'HUMAN_DESIGN'])).toBe(true);
        expect(isGeneratedAnalysis(['ZODIAC', 'MBTI'])).toBe(false);
    });
});
