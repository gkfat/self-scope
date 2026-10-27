import {
    describe, expect, it,
} from 'vitest';
import { createReportRequestSchema } from './detailedReport.schema';

describe('createReportRequestSchema', () => {
    it('accepts two or more different dimensions', () => {
        expect(createReportRequestSchema.safeParse({ dimensions: ['ZODIAC', 'HUMAN_DESIGN'] }).success).toBe(true);
        expect(createReportRequestSchema.safeParse({
            dimensions: [
                'ZODIAC',
                'BLOOD',
                'MBTI',
                'HUMAN_DESIGN',
            ], 
        }).success).toBe(true);
    });

    it('rejects a choice without the human design', () => {
        expect(createReportRequestSchema.safeParse({ dimensions: ['ZODIAC', 'MBTI'] }).success).toBe(false);
    });

    it('rejects fewer than two dimensions', () => {
        expect(createReportRequestSchema.safeParse({ dimensions: [] }).success).toBe(false);
        expect(createReportRequestSchema.safeParse({ dimensions: ['HUMAN_DESIGN'] }).success).toBe(false);
    });

    it('rejects a repeated dimension and an unknown one', () => {
        expect(createReportRequestSchema.safeParse({ dimensions: ['HUMAN_DESIGN', 'HUMAN_DESIGN'] }).success).toBe(false);
        expect(createReportRequestSchema.safeParse({ dimensions: ['HUMAN_DESIGN', 'TAROT'] }).success).toBe(false);
    });

    it('requires the dimensions field', () => {
        expect(createReportRequestSchema.safeParse({}).success).toBe(false);
    });
});
