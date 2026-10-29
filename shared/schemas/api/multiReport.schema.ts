import { z } from 'zod';
import { MULTI_REPORT_SYSTEMS } from '../../report/systems';
import { SNAPSHOT_AI_JOB_STATUSES } from '../firestore/reportSnapshot.schema';

/** Which lasting systems to put together: at least two, none twice (the Idempotency-Key header is the job id). */
export const multiReportRequestSchema = z.object({
    systems: z.array(z.enum(MULTI_REPORT_SYSTEMS)).min(2).max(MULTI_REPORT_SYSTEMS.length)
        .refine((systems) => new Set(systems).size === systems.length, 'a system is chosen once'),
});

export const multiReportAcceptedSchema = z.object({
    /** The report, to be read (and polled while it is being made) through the report snapshots */
    snapshotId: z.string(),
    status: z.enum(SNAPSHOT_AI_JOB_STATUSES),
    pointsDeducted: z.number().int().nonnegative(),
});

export type MultiReportRequest = z.infer<typeof multiReportRequestSchema>;
export type MultiReportAccepted = z.infer<typeof multiReportAcceptedSchema>;
