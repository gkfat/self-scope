import { z } from 'zod';
import { summaryCombinationSchema } from '../firestore/summary.schema';
import { fixedResultResponseSchema } from './fixedResult.schema';

export const summaryRequestSchema = z.object({
    /** Use the blood type in the combination when it is known. Defaults to true. */
    includeBloodType: z.boolean().default(true),
});

export const summaryItemSchema = z.object({
    summaryId: z.string(),
    combinationKey: summaryCombinationSchema,
    content: fixedResultResponseSchema,
    obtainedAt: z.number().int(),
    expiresAt: z.number().int(),
});

export const summaryObtainedSchema = summaryItemSchema.extend({
    /** 1 the first time a combination is obtained, 0 when it was already owned. */
    pointsDeducted: z.number().int().nonnegative(),
});

export type SummaryRequest = z.infer<typeof summaryRequestSchema>;
export type SummaryItem = z.infer<typeof summaryItemSchema>;
export type SummaryObtained = z.infer<typeof summaryObtainedSchema>;
