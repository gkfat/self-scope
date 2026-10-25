import { z } from 'zod';
import {
    epochMsSchema, mbtiTypeSchema,
} from '../common';

export const answerSchema = z.object({
    questionId: z.string().min(1),
    value: z.union([z.string(), z.number()]),
    /** Only recorded when the user was told and agreed (FR-024). */
    responseTimeMs: z.number().int().nonnegative().nullable(),
});

/** The part of a finished test that is shared by guest sessions and saved attempts. */
export const testResultSchema = z.object({
    testId: z.string().min(1),
    testVersion: z.string().min(1),
    answers: z.array(answerSchema),
    result: mbtiTypeSchema,
    completedAt: epochMsSchema,
});

/** users/{uid}/testAttempts/{attemptId} */
export const testAttemptDocSchema = testResultSchema.extend({
    /** completedAt + 3 months (RULE-014) */
    expiresAt: epochMsSchema,
});

export type Answer = z.infer<typeof answerSchema>;
export type TestResult = z.infer<typeof testResultSchema>;
export type TestAttemptDoc = z.infer<typeof testAttemptDocSchema>;
