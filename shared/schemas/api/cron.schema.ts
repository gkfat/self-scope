import { z } from 'zod';

export const dataExpiryResultSchema = z.object({
    deletedAttempts: z.number().int().nonnegative(),
    deletedSummaries: z.number().int().nonnegative(),
    deletedReports: z.number().int().nonnegative(),
    deletedHumanDesigns: z.number().int().nonnegative(),
    clearedMbti: z.number().int().nonnegative(),
    /** Steps that hit an error; they are retried by the next run (counts only, never content). */
    failed: z.array(z.string()),
});

export type DataExpiryResult = z.infer<typeof dataExpiryResultSchema>;
