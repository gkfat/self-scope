import { z } from 'zod';
import { analysisBasisSchema } from '../analysisBasis.schema';
import {
    SNAPSHOT_KINDS, snapshotAiJobSchema, snapshotAiSchema, snapshotBlockSchema, snapshotSystemSchema, snapshotVersionsSchema,
} from '../firestore/reportSnapshot.schema';

/** One row of the member's list of reports. */
export const reportSnapshotItemSchema = z.object({
    id: z.string(),
    kind: z.enum(SNAPSHOT_KINDS),
    systems: z.array(snapshotSystemSchema),
    position: z.string(),
    /** Where the member stands in each system of the report ("太陽天蠍座", "O 型"…), in the order of the systems */
    parts: z.array(z.object({
        system: snapshotSystemSchema,
        position: z.string(),
    })),
    /** How the AI reading is going: running, done, failed (the points are given back), or null when none was asked for */
    aiStatus: snapshotAiJobSchema.shape.status.nullable(),
    /** Whether the AI analysis has been made for this report (it is kept apart from the report itself) */
    aiAugmented: z.boolean(),
    generatedAt: z.number().int(),
    expiresAt: z.number().int(),
});

/** A whole report, exactly as it was when it was made. */
export const reportSnapshotDetailSchema = reportSnapshotItemSchema.extend({
    blocks: z.array(snapshotBlockSchema),
    versions: snapshotVersionsSchema,
    basis: z.array(analysisBasisSchema),
    /** The AI analysis, beside the report and never in place of it; null until it has been asked for */
    ai: snapshotAiSchema.nullable(),
    /** The latest request for the AI analysis (running, done or failed and refunded); null when none was made */
    aiJob: snapshotAiJobSchema.nullable(),
});

export type ReportSnapshotItem = z.infer<typeof reportSnapshotItemSchema>;
export type ReportSnapshotDetail = z.infer<typeof reportSnapshotDetailSchema>;
