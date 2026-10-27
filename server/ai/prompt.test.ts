import {
    describe, expect, it,
} from 'vitest';
import {
    PROMPT_VERSION, buildSystemPrompt, buildUserPrompt,
} from './prompt';
import {
    REPORT_SECTIONS, type AnalysisInput,
} from '../../shared/schemas/firestore/detailedReport.schema';

const input: AnalysisInput = {
    inputVersion: 'abc123',
    bazi: null,
    profile: {
        zodiac: 'aries', bloodType: 'O', mbti: 'INTJ', numerology: null,
    },
    test: {
        testVersion: '1',
        dimensions: {
            EI: {
                score: -6, maxScore: 16, leaning: 'I',
            },
        },
    },
    humanDesign: null,
};

describe('prompts', () => {
    it('is versioned so a stored report says which wording produced it', () => {
        expect(PROMPT_VERSION).toMatch(/^detailed-report-v\d+$/);
    });

    it('names all eight sections by their exact keys', () => {
        const system = buildSystemPrompt();

        for (const section of REPORT_SECTIONS) {
            expect(system).toContain(`key="${section.key}"`);
        }
    });

    it('tells the model to separate observed facts from inference, hedge, and never diagnose', () => {
        const system = buildSystemPrompt();

        expect(system).toContain('OBSERVED');
        expect(system).toContain('INFERRED');
        expect(system).toContain('不確定的語氣');
        expect(system).toContain('不要做診斷');
    });

    it('gives the model only the facts, not the internal hash', () => {
        const user = buildUserPrompt(input);

        expect(user).toContain('"zodiac": "aries"');
        expect(user).toContain('"mbti": "INTJ"');
        expect(user).toContain('"leaning": "I"');
        expect(user).not.toContain('abc123');
        expect(user).not.toContain('inputVersion');
    });
});
