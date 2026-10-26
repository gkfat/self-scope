import { z } from 'zod';
import {
    fixedContentBodySchema, fixedContentTypeSchema,
} from '../firestore/fixedContent.schema.ts';
import {
    bloodTypeSchema, isRealDate, isoDateSchema, zodiacSchema,
} from '../common.ts';

/** What the user sees: the stored body plus identity and version. */
export const fixedResultResponseSchema = fixedContentBodySchema.extend({
    contentType: fixedContentTypeSchema,
    key: z.string(),
    contentVersion: z.string(),
});

/**
 * The sign can be asked for by birth date or directly by name; a page that shows one sign's analysis
 * needs the name only, so no birth date has to appear in a link.
 */
export const zodiacResultQuerySchema = z.union([z.object({ birthDate: isoDateSchema.refine(isRealDate, 'birthDate is not a real calendar date') }), z.object({ sign: zodiacSchema })]);

export const bloodTypeParamSchema = bloodTypeSchema;

export type FixedResultResponse = z.infer<typeof fixedResultResponseSchema>;
