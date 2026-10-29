import {
    describe, expect, it,
} from 'vitest';
import { multiReportCost } from './multiDimensionPricing';

describe('multiReportCost', () => {
    it('is the sum of the systems\' own prices times 1.2, rounded down', () => {
        // 2 x 1.2 = 2.4
        expect(multiReportCost(['ZODIAC', 'MBTI'])).toBe(2);
        // 3 x 1.2 = 3.6
        expect(multiReportCost([
            'ZODIAC',
            'BLOOD',
            'MBTI',
        ])).toBe(3);
        // 6 x 1.2 = 7.2
        expect(multiReportCost([
            'MBTI',
            'HUMAN_DESIGN',
            'BAZI',
        ])).toBe(7);
        // 10 x 1.2 = 12
        expect(multiReportCost([
            'ZODIAC',
            'BLOOD',
            'MBTI',
            'NUMEROLOGY',
            'MAYA_KIN',
            'HUMAN_DESIGN',
            'BAZI',
        ])).toBe(12);
    });

    it('prices the human design at 2 points and the BaZi chart at 3', () => {
        // 1 + 2 = 3 -> 3.6
        expect(multiReportCost(['ZODIAC', 'HUMAN_DESIGN'])).toBe(3);
        // 1 + 3 = 4 -> 4.8
        expect(multiReportCost(['ZODIAC', 'BAZI'])).toBe(4);
        // 2 + 3 = 5 -> 6
        expect(multiReportCost(['HUMAN_DESIGN', 'BAZI'])).toBe(6);
    });

    it('is the same whether or not the combination was ever written down: there is no cheaper branch', () => {
        expect(multiReportCost(['ZODIAC', 'MBTI'])).toBe(multiReportCost(['MBTI', 'ZODIAC']));
        expect(multiReportCost([
            'ZODIAC',
            'ZODIAC',
            'MBTI',
        ])).toBe(2);
    });

    it('is not offered for fewer than two systems', () => {
        expect(multiReportCost([])).toBeNull();
        expect(multiReportCost(['ZODIAC'])).toBeNull();
        expect(multiReportCost(['ZODIAC', 'ZODIAC'])).toBeNull();
    });
});
