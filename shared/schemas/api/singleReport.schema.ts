import { z } from 'zod';
import { SINGLE_REPORT_SYSTEMS } from '../../report/systems';
import { reportSnapshotDetailSchema } from './reportSnapshot.schema';
import { idempotencyKeySchema } from './detailedReport.schema';
import { SNAPSHOT_AI_JOB_STATUSES } from '../firestore/reportSnapshot.schema';

export const singleReportRequestSchema = z.object({ system: z.enum(SINGLE_REPORT_SYSTEMS) });

/**
 * A report as it is handed back. A member's is kept (it has an id and an expiry); a guest's is not (no id, no expiry,
 * `persisted` false): it is made for the moment and gone when the page is.
 */
export const singleReportResponseSchema = reportSnapshotDetailSchema.extend({
    id: z.string().nullable(),
    expiresAt: z.number().int().nullable(),
    persisted: z.boolean(),
});

/** Ask for the AI analysis of one of the member's reports (1 point; the Idempotency-Key header is the job id) */
export const singleAnalysisRequestSchema = z.object({ snapshotId: z.string().min(1).max(128) });

export const singleAnalysisAcceptedSchema = z.object({
    status: z.enum(SNAPSHOT_AI_JOB_STATUSES),
    pointsDeducted: z.number().int().nonnegative(),
});

export { idempotencyKeySchema };

export type SingleAnalysisAccepted = z.infer<typeof singleAnalysisAcceptedSchema>;
export type SingleReportResponse = z.infer<typeof singleReportResponseSchema>;
export type SingleReportRequest = z.infer<typeof singleReportRequestSchema>;
