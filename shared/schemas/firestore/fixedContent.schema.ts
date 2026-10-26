import { z } from 'zod';
import { FIXED_CONTENT_TYPES } from '../../utils/fixedContentKeys.ts';

export const fixedContentTypeSchema = z.enum(FIXED_CONTENT_TYPES);

export const FIXED_CONTENT_STATUSES = [
    'DRAFT',
    'REVIEWED',
    'PUBLISHED',
] as const;

export const fixedContentStatusSchema = z.enum(FIXED_CONTENT_STATUSES);

/**
 * The deeper layers of an analysis. Every part is optional so that shorter content (and content written
 * before these existed) stays valid; the page shows only what a piece of content has.
 */

/** What may sit behind the behaviour: the need, where safety comes from, the worry, the inner tension. */
export const coreNeedsSchema = z.object({
    pursuit: z.string().min(1),
    securitySource: z.string().min(1),
    deepWorry: z.string().min(1),
    innerConflict: z.string().min(1),
});

/** The same trait in everyday situations. */
export const situationsSchema = z.object({
    underStress: z.string().min(1),
    inConflict: z.string().min(1),
    inUncertainty: z.string().min(1),
    inNewEnvironment: z.string().min(1),
});

/** A strength and how it can turn against its owner when used too much. */
export const overuseSchema = z.object({
    strength: z.string().min(1),
    whenOverused: z.string().min(1),
});

/** Something to try this week, not only something to read. */
export const growthPracticeSchema = z.object({
    habitToObserve: z.string().min(1),
    behaviorToTry: z.string().min(1),
    reflectionQuestion: z.string().min(1),
    weeklyPractice: z.string().min(1),
});

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
    /** Layer 2: why the person may act this way, and how it shows in daily situations */
    coreNeeds: coreNeedsSchema.nullable().default(null),
    situations: situationsSchema.nullable().default(null),
    relationshipBlindSpots: z.array(z.string().min(1)).default([]),
    /** Bullet points for the three life areas; older content only has the single strings above */
    relationshipPoints: z.array(z.string().min(1)).default([]),
    lovePoints: z.array(z.string().min(1)).default([]),
    workPoints: z.array(z.string().min(1)).default([]),
    overuse: z.array(overuseSchema).default([]),
    /** Layer 3: growth the reader can act on */
    growthPractice: growthPracticeSchema.nullable().default(null),
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
