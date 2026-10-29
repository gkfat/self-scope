import { z } from 'zod';
import { epochMsSchema } from '../common';

/** aiUsageRecords/{id}: cost bookkeeping that survives account deletion without the user id. */
export const aiUsageRecordSchema = z.object({
    userId: z.string().nullable(),
    /** The report (snapshot) the model was asked about */
    reportId: z.string(),
    modelName: z.string(),
    inputTokens: z.number().int().nonnegative(),
    outputTokens: z.number().int().nonnegative(),
    estimatedCost: z.number().nonnegative(),
    createdAt: epochMsSchema,
});

export type AiUsageRecord = z.infer<typeof aiUsageRecordSchema>;
