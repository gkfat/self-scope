import {
    describe, expect, it,
} from 'vitest';
import definition from '../../content/tests/personality16-v1.json';
import { testDefinitionFileSchema } from '../schemas/firestore/test.schema';
import {
    findAnswerIssues, scoreDimensions, scorePersonality, type AnswerInput,
} from './personalityScoring';

const {
    questions, scoringRule, 
} = testDefinitionFileSchema.parse(definition);

/** Answer every question the same way relative to its direction. */
function answersLeaning(toward: 'first' | 'second'): AnswerInput[] {
    return questions.map((q) => ({
        questionId: q.questionId,
        value: q.direction === toward ? 5 : 1,
    }));
}

describe('question bank', () => {
    it('has 32 unique questions, 8 per dimension, balanced between both directions', () => {
        expect(questions).toHaveLength(32);
        expect(new Set(questions.map((q) => q.questionId)).size).toBe(32);

        for (const dimension of [
            'EI',
            'SN',
            'TF',
            'JP',
        ]) {
            const inDimension = questions.filter((q) => q.dimension === dimension);

            expect(inDimension).toHaveLength(8);
            expect(inDimension.filter((q) => q.direction === 'first')).toHaveLength(4);
        }
    });

    it('offers the same five-point scale on every question', () => {
        for (const question of questions) {
            expect(question.options.map((o) => o.value)).toEqual([
                1,
                2,
                3,
                4,
                5,
            ]);
        }
    });
});

describe('findAnswerIssues', () => {
    const complete = answersLeaning('first');

    it('accepts a complete, valid submission', () => {
        expect(findAnswerIssues(questions, complete)).toEqual([]);
    });

    it('reports missing questions', () => {
        const issues = findAnswerIssues(questions, complete.slice(1));

        expect(issues).toEqual([
            {
                questionId: 'q01', reason: 'missing',
            },
        ]);
    });

    it('reports unknown questions, duplicates and values outside the options', () => {
        const issues = findAnswerIssues(questions, [
            ...complete,
            {
                questionId: 'nope', value: 3,
            },
            {
                questionId: 'q01', value: 3,
            },
        ]);

        expect(issues).toContainEqual({
            questionId: 'nope', reason: 'unknown',
        });
        expect(issues).toContainEqual({
            questionId: 'q01', reason: 'duplicate',
        });

        const invalid = findAnswerIssues(questions, complete.map((a, i) => (i === 0
            ? {
                ...a, value: 9,
            }
            : a)));

        expect(invalid).toEqual([
            {
                questionId: 'q01', reason: 'invalid-option',
            },
        ]);
    });
});

describe('scorePersonality', () => {
    it('picks the first letter of every dimension when answers lean that way', () => {
        expect(scorePersonality(questions, answersLeaning('first'), scoringRule)).toBe('ESTJ');
    });

    it('picks the second letter of every dimension when answers lean the other way', () => {
        expect(scorePersonality(questions, answersLeaning('second'), scoringRule)).toBe('INFP');
    });

    it('scores each dimension independently', () => {
        const answers = answersLeaning('first').map((a, i) => {
            const question = questions[i];

            // Flip only the T/F dimension.
            return question?.dimension === 'TF'
                ? {
                    ...a, value: 6 - Number(a.value),
                }
                : a;
        });

        expect(scorePersonality(questions, answers, scoringRule)).toBe('ESFJ');
    });

    it('uses the tie-break letters when a dimension is exactly balanced', () => {
        const neutral = questions.map((q) => ({
            questionId: q.questionId, value: 3,
        }));

        expect(scorePersonality(questions, neutral, scoringRule)).toBe('INFP');
    });

    it('is deterministic and does not depend on answer order', () => {
        const answers = answersLeaning('first');
        const shuffled = [...answers].reverse();

        expect(scorePersonality(questions, shuffled, scoringRule))
            .toBe(scorePersonality(questions, answers, scoringRule));
    });

    it('accepts numeric strings as values', () => {
        const answers = answersLeaning('first').map((a) => ({
            ...a, value: String(a.value),
        }));

        expect(scorePersonality(questions, answers, scoringRule)).toBe('ESTJ');
    });

    it('rejects a missing answer instead of guessing', () => {
        expect(() => scorePersonality(questions, answersLeaning('first').slice(1), scoringRule)).toThrow('missing answer');
    });
});

describe('scoreDimensions', () => {
    it('reports the strength and side of every dimension', () => {
        const dimensions = scoreDimensions(questions, answersLeaning('first'), scoringRule);

        expect(dimensions).toEqual({
            EI: {
                score: 16, maxScore: 16, leaning: 'E',
            },
            SN: {
                score: 16, maxScore: 16, leaning: 'S',
            },
            TF: {
                score: 16, maxScore: 16, leaning: 'T',
            },
            JP: {
                score: 16, maxScore: 16, leaning: 'J',
            },
        });
    });

    it('uses negative scores and the second letter for the other lean', () => {
        const dimensions = scoreDimensions(questions, answersLeaning('second'), scoringRule);

        expect(dimensions.EI).toEqual({
            score: -16, maxScore: 16, leaning: 'I',
        });
    });

    it('shows a balanced dimension as zero with the tie-break letter', () => {
        const neutral = questions.map((q) => ({
            questionId: q.questionId, value: 3,
        }));

        expect(scoreDimensions(questions, neutral, scoringRule).TF).toEqual({
            score: 0, maxScore: 16, leaning: 'F',
        });
    });

    it('agrees with scorePersonality on the letters', () => {
        const answers = answersLeaning('first').map((a, i) => (i % 3 === 0
            ? {
                ...a, value: 3,
            }
            : a));
        const letters = Object.values(scoreDimensions(questions, answers, scoringRule)).map((d) => d.leaning).join('');

        expect(letters).toBe(scorePersonality(questions, answers, scoringRule));
    });
});
