import { z } from 'zod';
import type { MbtiType } from '../schemas/common.ts';
import { MBTI_TYPES } from '../schemas/common.ts';
import type {
    ScoringRule, TestQuestion,
} from '../schemas/firestore/test.schema.ts';

export type AnswerInput = {
    questionId: string;
    value: string | number;
};

export type AnswerIssue = {
    questionId: string;
    reason: 'missing' | 'unknown' | 'duplicate' | 'invalid-option';
};

/**
 * Check a submission against the question set: every question answered exactly
 * once, with one of its option values, and nothing else.
 */
export function findAnswerIssues(
    questions: readonly TestQuestion[],
    answers: readonly AnswerInput[],
): AnswerIssue[] {
    const issues: AnswerIssue[] = [];
    const byId = new Map(questions.map((q) => [q.questionId, q]));
    const seen = new Set<string>();

    for (const answer of answers) {
        const question = byId.get(answer.questionId);

        if (!question) {
            issues.push({
                questionId: answer.questionId, reason: 'unknown',
            });
            continue;
        }

        if (seen.has(answer.questionId)) {
            issues.push({
                questionId: answer.questionId, reason: 'duplicate',
            });
            continue;
        }

        seen.add(answer.questionId);

        if (!question.options.some((option) => option.value === answer.value)) {
            issues.push({
                questionId: answer.questionId, reason: 'invalid-option',
            });
        }
    }

    for (const question of questions) {
        if (!seen.has(question.questionId) && !issues.some((i) => i.questionId === question.questionId)) {
            issues.push({
                questionId: question.questionId, reason: 'missing',
            });
        }
    }

    return issues;
}

const resultSchema = z.enum(MBTI_TYPES);

/**
 * Compute the 16-type result. Callers must have run findAnswerIssues first.
 * Deterministic: the same answers always give the same type.
 */
export function scorePersonality(
    questions: readonly TestQuestion[],
    answers: readonly AnswerInput[],
    rule: ScoringRule,
): MbtiType {
    const valueById = new Map(answers.map((a) => [a.questionId, Number(a.value)]));
    const totals = new Map<string, number>(rule.dimensions.map((d) => [d.id, 0]));

    for (const question of questions) {
        const value = valueById.get(question.questionId);

        if (value === undefined) {
            throw new Error(`missing answer for ${question.questionId}`);
        }

        const centered = value - rule.neutralValue;
        const contribution = question.direction === 'first' ? centered : -centered;

        totals.set(question.dimension, (totals.get(question.dimension) ?? 0) + contribution);
    }

    const letters = rule.dimensions.map((dimension) => {
        const total = totals.get(dimension.id) ?? 0;

        if (total > 0) return dimension.first;
        if (total < 0) return dimension.second;

        return dimension.tieBreak;
    });

    return resultSchema.parse(letters.join(''));
}
