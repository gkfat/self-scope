import { z } from 'zod';

export const PERSONALITY_DIMENSIONS = [
    'EI',
    'SN',
    'TF',
    'JP',
] as const;

export const dimensionSchema = z.enum(PERSONALITY_DIMENSIONS);

export const questionOptionSchema = z.object({
    value: z.number().int(),
    label: z.string().min(1),
});

/** One statement. Agreeing pushes the score toward the `first` or `second` letter of its dimension. */
export const testQuestionSchema = z.object({
    questionId: z.string().min(1),
    text: z.string().min(1),
    options: z.array(questionOptionSchema).min(2),
    dimension: dimensionSchema,
    direction: z.enum(['first', 'second']),
});

const letterSchema = z.string().length(1);

/**
 * Likert scoring: each answer is centered on `neutralValue` and added to the
 * first letter (or subtracted, for `second` questions). A positive total picks
 * the first letter, a negative one the second; an exact tie uses `tieBreak`.
 */
export const scoringRuleSchema = z.object({
    type: z.literal('likert-dichotomies'),
    neutralValue: z.number(),
    dimensions: z.array(z.object({
        id: dimensionSchema,
        first: letterSchema,
        second: letterSchema,
        tieBreak: letterSchema,
    })).length(4),
});

/** tests/{testId} */
export const testDocSchema = z.object({
    title: z.string().min(1),
    currentVersion: z.string().min(1),
    active: z.boolean(),
    updatedAt: z.number().int().nonnegative(),
});

/** tests/{testId}/versions/{version}. Immutable once published (RULE-027). */
export const testVersionDocSchema = z.object({
    questions: z.array(testQuestionSchema).min(1),
    scoringRule: scoringRuleSchema,
    publishedAt: z.number().int().nonnegative(),
});

/** Import file for a test definition (content/tests/*.json). */
export const testDefinitionFileSchema = z.object({
    testId: z.string().min(1),
    title: z.string().min(1),
    version: z.string().min(1),
    questions: z.array(testQuestionSchema).min(1),
    scoringRule: scoringRuleSchema,
}).superRefine((value, ctx) => {
    const ids = value.questions.map((q) => q.questionId);

    if (new Set(ids).size !== ids.length) {
        ctx.addIssue({
            code: 'custom', path: ['questions'], message: 'questionId must be unique',
        });
    }

    for (const dimension of PERSONALITY_DIMENSIONS) {
        if (!value.questions.some((q) => q.dimension === dimension)) {
            ctx.addIssue({
                code: 'custom', path: ['questions'], message: `no question for dimension ${dimension}`,
            });
        }
    }
});

export type TestQuestion = z.infer<typeof testQuestionSchema>;
export type ScoringRule = z.infer<typeof scoringRuleSchema>;
export type TestDoc = z.infer<typeof testDocSchema>;
export type TestVersionDoc = z.infer<typeof testVersionDocSchema>;
export type TestDefinitionFile = z.infer<typeof testDefinitionFileSchema>;
