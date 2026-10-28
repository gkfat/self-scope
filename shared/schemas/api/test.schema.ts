import { z } from 'zod';
import { mbtiTypeSchema } from '../common';
import { fixedResultResponseSchema } from './fixedResult.schema';

export const testSummarySchema = z.object({
    testId: z.string(),
    title: z.string(),
    version: z.string(),
    questionCount: z.number().int().positive(),
});

/** Questions as the client sees them: no dimension, direction or scoring data. */
export const publicQuestionSchema = z.object({
    questionId: z.string(),
    text: z.string(),
    options: z.array(z.object({
        value: z.number().int(),
        label: z.string(),
    })),
});

export const publicTestSchema = z.object({
    testId: z.string(),
    title: z.string(),
    version: z.string(),
    questions: z.array(publicQuestionSchema),
});

export const submissionRequestSchema = z.object({
    testVersion: z.string().min(1),
    answers: z.array(z.object({
        questionId: z.string().min(1),
        value: z.union([z.string(), z.number()]),
        responseTimeMs: z.number().int().nonnegative().optional(),
    })).min(1),
    /** The user was told that answer times are recorded and agreed (FR-024). */
    responseTimeConsent: z.boolean().optional(),
});

/** How clear-cut one dimension of the result is; `score` is positive toward the dimension's first letter. */
export const dimensionScoreSchema = z.object({
    score: z.number(),
    maxScore: z.number().nonnegative(),
    leaning: z.string().length(1),
});

/** Per-dimension scores keyed by dimension id (EI, SN, TF, JP). */
export const dimensionScoresSchema = z.record(z.string(), dimensionScoreSchema);

export const submissionResponseSchema = z.object({
    /** null when nothing was saved (guest, or saving failed) */
    attemptId: z.string().nullable(),
    testVersion: z.string(),
    result: mbtiTypeSchema,
    dimensions: dimensionScoresSchema,
    content: fixedResultResponseSchema,
    /** Guests are only held for a day on the server; this is true only for a saved attempt. */
    persisted: z.boolean(),
    /** The result is valid but could not be stored; the client may retry. */
    saveFailed: z.boolean(),
    expiresAt: z.number().int().nullable(),
});

export const testAttemptItemSchema = z.object({
    attemptId: z.string(),
    testId: z.string(),
    testVersion: z.string(),
    result: mbtiTypeSchema,
    dimensions: dimensionScoresSchema,
    completedAt: z.number().int(),
    expiresAt: z.number().int(),
});

export type TestSummary = z.infer<typeof testSummarySchema>;
export type PublicTest = z.infer<typeof publicTestSchema>;
export type SubmissionRequest = z.infer<typeof submissionRequestSchema>;
export type SubmissionResponse = z.infer<typeof submissionResponseSchema>;
export type TestAttemptItem = z.infer<typeof testAttemptItemSchema>;
