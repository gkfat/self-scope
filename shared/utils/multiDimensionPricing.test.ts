import {
    describe, expect, it,
} from 'vitest';
import {
    isGeneratedAnalysis, multiDimensionCost,
} from './multiDimensionPricing';

describe('multiDimensionCost', () => {
    it('prices written content from the sum of base prices (1 point each) and the count weight, rounded down', () => {
        expect(multiDimensionCost(['ZODIAC', 'MBTI'])).toBe(2);
        // 3 x 1.5 = 4.5
        expect(multiDimensionCost([
            'ZODIAC',
            'BLOOD',
            'MBTI',
        ])).toBe(4);
        expect(multiDimensionCost([
            'ZODIAC',
            'BLOOD',
            'MBTI',
            'NUMEROLOGY',
        ])).toBe(8);
    });

    it('counts the human design as 2 points, the BaZi chart as 3, and multiplies a generated analysis by 1.5', () => {
        // (1 + 2) x 1 x 1.5 = 4.5
        expect(multiDimensionCost(['ZODIAC', 'HUMAN_DESIGN'])).toBe(4);
        // (1 + 3) x 1 x 1.5 = 6
        expect(multiDimensionCost(['ZODIAC', 'BAZI'])).toBe(6);
        // (2 + 3) x 1 x 1.5 = 7.5
        expect(multiDimensionCost(['HUMAN_DESIGN', 'BAZI'])).toBe(7);
        // (1 + 1 + 2) x 1.5 x 1.5 = 9
        expect(multiDimensionCost([
            'ZODIAC',
            'MBTI',
            'HUMAN_DESIGN',
        ])).toBe(9);
    });

    it('stops the count weight rising at five dimensions', () => {
        // (1 + 1 + 1 + 1 + 2) x 2.5 x 1.5 = 22.5
        expect(multiDimensionCost([
            'ZODIAC',
            'BLOOD',
            'MBTI',
            'NUMEROLOGY',
            'HUMAN_DESIGN',
        ])).toBe(22);
        // (1 + 1 + 1 + 1 + 2 + 3) x 2.5 x 1.5 = 33.75, capped at 30
        expect(multiDimensionCost([
            'ZODIAC',
            'BLOOD',
            'MBTI',
            'NUMEROLOGY',
            'HUMAN_DESIGN',
            'BAZI',
        ])).toBe(30);
    });

    it('does not depend on the order or on repeats', () => {
        expect(multiDimensionCost(['HUMAN_DESIGN', 'ZODIAC'])).toBe(multiDimensionCost(['ZODIAC', 'HUMAN_DESIGN']));
        expect(multiDimensionCost([
            'ZODIAC',
            'ZODIAC',
            'MBTI',
        ])).toBe(2);
    });

    it('never costs more than 30 points', () => {
        expect(multiDimensionCost([
            'ZODIAC',
            'BLOOD',
            'MBTI',
            'NUMEROLOGY',
            'HUMAN_DESIGN',
            'BAZI',
        ])).toBe(30);
        expect(multiDimensionCost([
            'MBTI',
            'NUMEROLOGY',
            'HUMAN_DESIGN',
            'BAZI',
            'ZODIAC',
        ])).toBeLessThanOrEqual(30);
    });

    it('never gives a fraction', () => {
        const all = [
            'ZODIAC',
            'BLOOD',
            'MBTI',
            'NUMEROLOGY',
            'HUMAN_DESIGN',
            'BAZI',
        ] as const;

        for (let count = 2; count <= all.length; count++) {
            expect(Number.isInteger(multiDimensionCost(all.slice(0, count)))).toBe(true);
        }
    });

    it('offers nothing below two dimensions', () => {
        expect(multiDimensionCost(['MBTI'])).toBeNull();
        expect(multiDimensionCost([])).toBeNull();
    });
});

describe('isGeneratedAnalysis', () => {
    it('is true with the human design or the BaZi chart, false without', () => {
        expect(isGeneratedAnalysis(['ZODIAC', 'HUMAN_DESIGN'])).toBe(true);
        expect(isGeneratedAnalysis(['ZODIAC', 'BAZI'])).toBe(true);
        expect(isGeneratedAnalysis(['ZODIAC', 'MBTI'])).toBe(false);
    });
});
