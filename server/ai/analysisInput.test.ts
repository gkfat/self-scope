import {
    describe, expect, it,
} from 'vitest';
import definition from '../../content/tests/personality16-v1.json';
import { buildAnalysisInput } from './analysisInput';
import { testDefinitionFileSchema } from '../../shared/schemas/firestore/test.schema';

const {
    questions, scoringRule, 
} = testDefinitionFileSchema.parse(definition);

const leaning = (toward: 'first' | 'second') => questions.map((q) => ({
    questionId: q.questionId, value: q.direction === toward ? 5 : 1,
}));

describe('buildAnalysisInput', () => {
    const base = {
        zodiac: 'aries' as const,
        bloodType: 'O' as const,
        mbti: 'ESTJ' as const,
        test: null,
        humanDesign: null,
    };

    it('keeps only plain facts', () => {
        const input = buildAnalysisInput(base);

        expect(input.profile).toEqual({
            zodiac: 'aries', bloodType: 'O', mbti: 'ESTJ', numerology: null,
        });
        expect(input.test).toBeNull();
        expect(input.humanDesign).toBeNull();
    });

    it('leaves an unknown blood type out', () => {
        expect(buildAnalysisInput({
            ...base, bloodType: 'UNKNOWN',
        }).profile.bloodType).toBeNull();
        expect(buildAnalysisInput({
            ...base, bloodType: null,
        }).profile.bloodType).toBeNull();
    });

    it('turns the saved answers into how strongly each dimension leans', () => {
        const input = buildAnalysisInput({
            ...base,
            test: {
                testVersion: '1', questions, rule: scoringRule, answers: leaning('first'),
            },
        });

        expect(input.test?.testVersion).toBe('1');
        expect(input.test?.dimensions.EI).toEqual({
            score: 16, maxScore: 16, leaning: 'E',
        });
        expect(Object.keys(input.test?.dimensions ?? {})).toEqual([
            'EI',
            'SN',
            'TF',
            'JP',
        ]);
    });

    it('does not expose the raw answers', () => {
        const input = buildAnalysisInput({
            ...base,
            test: {
                testVersion: '1', questions, rule: scoringRule, answers: leaning('second'),
            },
        });

        expect(JSON.stringify(input)).not.toContain('questionId');
    });

    it('gives the same version to the same facts and a different one when they change', () => {
        const a = buildAnalysisInput(base);
        const b = buildAnalysisInput(base);
        const c = buildAnalysisInput({
            ...base, mbti: 'INFP',
        });

        expect(a.inputVersion).toBe(b.inputVersion);
        expect(a.inputVersion).not.toBe(c.inputVersion);
        expect(a.inputVersion).toMatch(/^[0-9a-f]{16}$/);
    });
});
