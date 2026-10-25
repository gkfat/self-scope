import { z } from 'zod';
import { FIXED_CONTENT_TYPES } from '../../utils/fixedContentKeys.ts';

export const fixedContentTypeSchema = z.enum(FIXED_CONTENT_TYPES);

export const FIXED_CONTENT_STATUSES = [
    'DRAFT',
    'REVIEWED',
    'PUBLISHED',
] as const;

export const fixedContentStatusSchema = z.enum(FIXED_CONTENT_STATUSES);

/** Content body: shared by single results and summaries (plan 5.2). */
export const fixedContentBodySchema = z.object({
    title: z.string().min(1),
    summary: z.string().min(1),
    strengths: z.array(z.string().min(1)).default([]),
    blindSpots: z.array(z.string().min(1)).default([]),
    loveStyle: z.string().default(''),
    workStyle: z.string().default(''),
    communicationStyle: z.string().default(''),
    growthAdvice: z.string().default(''),
    /** Every result must carry the entertainment / self-exploration disclaimer (RULE-023). */
    disclaimer: z.string().min(1),
});

/** fixedContents/{contentType}_{key} */
export const fixedContentDocSchema = z.object({
    contentType: fixedContentTypeSchema,
    key: z.string().min(1),
    body: fixedContentBodySchema,
    /** Monotonic integer as a string; bumped by the import script when content changes. */
    contentVersion: z.string().min(1),
    status: fixedContentStatusSchema,
    updatedAt: z.number().int().nonnegative(),
    publishedAt: z.number().int().nonnegative().nullable(),
});

export type FixedContentBody = z.infer<typeof fixedContentBodySchema>;
export type FixedContentStatus = z.infer<typeof fixedContentStatusSchema>;
export type FixedContentDoc = z.infer<typeof fixedContentDocSchema>;
