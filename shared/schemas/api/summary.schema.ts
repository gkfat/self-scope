import { z } from 'zod';
import { summaryCombinationSchema } from '../firestore/summary.schema';
import { fixedResultResponseSchema } from './fixedResult.schema';

/** Written-content analyses combine zodiac, blood type, MBTI and life path number: two or three of them, without the human design. */
export const SUMMARY_DIMENSIONS = [
    'ZODIAC',
    'BLOOD',
    'MBTI',
    'NUMEROLOGY',
] as const;

export const summaryRequestSchema = z.object({
    dimensions: z.array(z.enum(SUMMARY_DIMENSIONS))
        .min(2)
        .refine((items) => new Set(items).size === items.length, 'dimensions must not repeat'),
});

export const summaryItemSchema = z.object({
    summaryId: z.string(),
    combinationKey: summaryCombinationSchema,
    content: fixedResultResponseSchema,
    obtainedAt: z.number().int(),
    expiresAt: z.number().int(),
});

export const summaryObtainedSchema = summaryItemSchema.extend({
    /** The price the first time a combination is obtained, 0 when it was already owned. */
    pointsDeducted: z.number().int().nonnegative(),
});

export type SummaryRequest = z.infer<typeof summaryRequestSchema>;
export type SummaryItem = z.infer<typeof summaryItemSchema>;
export type SummaryObtained = z.infer<typeof summaryObtainedSchema>;
