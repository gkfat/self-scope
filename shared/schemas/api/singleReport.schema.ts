import { z } from 'zod';
import { SINGLE_REPORT_SYSTEMS } from '../../report/systems';
import { reportSnapshotDetailSchema } from './reportSnapshot.schema';

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

export type SingleReportResponse = z.infer<typeof singleReportResponseSchema>;
export type SingleReportRequest = z.infer<typeof singleReportRequestSchema>;
