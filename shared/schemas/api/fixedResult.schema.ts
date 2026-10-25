import { z } from 'zod';
import {
    fixedContentBodySchema, fixedContentTypeSchema,
} from '../firestore/fixedContent.schema.ts';
import {
    bloodTypeSchema, isRealDate, isoDateSchema,
} from '../common.ts';

/** What the user sees: the stored body plus identity and version. */
export const fixedResultResponseSchema = fixedContentBodySchema.extend({
    contentType: fixedContentTypeSchema,
    key: z.string(),
    contentVersion: z.string(),
});

export const zodiacResultQuerySchema = z.object({ birthDate: isoDateSchema.refine(isRealDate, 'birthDate is not a real calendar date') });

export const bloodTypeParamSchema = bloodTypeSchema;

export type FixedResultResponse = z.infer<typeof fixedResultResponseSchema>;
