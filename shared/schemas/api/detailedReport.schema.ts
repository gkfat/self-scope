import { z } from 'zod';
import {
    evidenceKindSchema, reportCombinationSchema, reportDimensionSchema, reportStatusSchema,
} from '../firestore/detailedReport.schema';

export const MIN_REPORT_DIMENSIONS = 2;

export const createReportRequestSchema = z.object({
    /** The dimensions to combine: at least two, each at most once, and the human design, the BaZi chart or the Maya Kin among them. */
    dimensions: z.array(reportDimensionSchema)
        .min(MIN_REPORT_DIMENSIONS)
        .refine((items) => new Set(items).size === items.length, 'dimensions must not repeat')
        .refine((items) => items.includes('HUMAN_DESIGN') || items.includes('BAZI') || items.includes('MAYA_KIN'), 'a generated analysis includes the human design, the BaZi chart or the Maya Kin'),
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
    combinationKey: reportCombinationSchema,
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
