import { z } from 'zod';
import {
    evidenceKindSchema, reportStatusSchema,
} from '../firestore/detailedReport.schema';
import { summaryCombinationSchema } from '../firestore/summary.schema';

export const createReportRequestSchema = z.object({
    /** Use the blood type in the analysis when it is known. Defaults to true. */
    includeBloodType: z.boolean().default(true),
    /** Include the saved human-design chart. Defaults to false. */
    includeHumanDesign: z.boolean().default(false),
});

/** The Idempotency-Key header doubles as the report id, so it must be a safe path segment. */
export const idempotencyKeySchema = z.string().regex(/^[A-Za-z0-9_-]{8,64}$/);

export const reportAcceptedSchema = z.object({
    reportId: z.string(),
    status: reportStatusSchema,
    /** 5 when this call charged, 0 when the same Idempotency-Key was already accepted. */
    pointsDeducted: z.number().int().nonnegative(),
});

export const reportSectionItemSchema = z.object({
    key: z.string(),
    title: z.string(),
    content: z.string(),
    evidence: z.string(),
    evidenceKind: evidenceKindSchema,
});

export const reportItemSchema = z.object({
    reportId: z.string(),
    status: reportStatusSchema,
    combinationKey: summaryCombinationSchema.extend({ humanDesignType: z.string().nullable() }),
    sections: z.array(reportSectionItemSchema),
    disclaimer: z.string().nullable(),
    modelName: z.string().nullable(),
    promptVersion: z.string().nullable(),
    supersedesReportId: z.string().nullable(),
    failureReason: z.string().nullable(),
    createdAt: z.number().int(),
    completedAt: z.number().int().nullable(),
    expiresAt: z.number().int().nullable(),
});

export type CreateReportRequest = z.infer<typeof createReportRequestSchema>;
export type ReportAccepted = z.infer<typeof reportAcceptedSchema>;
export type ReportItem = z.infer<typeof reportItemSchema>;
