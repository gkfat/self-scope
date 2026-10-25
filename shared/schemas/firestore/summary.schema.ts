import { z } from 'zod';
import {
    epochMsSchema, mbtiTypeSchema, zodiacSchema,
} from '../common';

export const summaryCombinationSchema = z.object({
    zodiac: zodiacSchema,
    mbti: mbtiTypeSchema,
    /** null when blood type was unknown or left out */
    bloodType: z.enum([
        'A',
        'B',
        'O',
        'AB',
    ]).nullable(),
});

/** users/{uid}/summaries/{combinationKey}: one per member and combination (RULE-005). */
export const summaryDocSchema = z.object({
    combinationKey: summaryCombinationSchema,
    /** id of the fixedContents document this summary was served from */
    contentRef: z.string(),
    /** content version at the time it was obtained */
    contentVersion: z.string(),
    obtainedAt: epochMsSchema,
    /** obtainedAt + 3 months (RULE-014) */
    expiresAt: epochMsSchema,
});

export type SummaryCombination = z.infer<typeof summaryCombinationSchema>;
export type SummaryDoc = z.infer<typeof summaryDocSchema>;
