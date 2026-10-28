import { z } from 'zod';
import { analysisBasisSchema } from '../analysisBasis.schema';
import {
    SNAPSHOT_KINDS, snapshotBlockSchema, snapshotSystemSchema, snapshotVersionsSchema,
} from '../firestore/reportSnapshot.schema';

/** One row of the member's list of reports. */
export const reportSnapshotItemSchema = z.object({
    id: z.string(),
    kind: z.enum(SNAPSHOT_KINDS),
    systems: z.array(snapshotSystemSchema),
    position: z.string(),
    aiAugmented: z.boolean(),
    generatedAt: z.number().int(),
    expiresAt: z.number().int(),
});

/** A whole report, exactly as it was when it was made. */
export const reportSnapshotDetailSchema = reportSnapshotItemSchema.extend({
    blocks: z.array(snapshotBlockSchema),
    versions: snapshotVersionsSchema,
    basis: z.array(analysisBasisSchema),
});

export type ReportSnapshotItem = z.infer<typeof reportSnapshotItemSchema>;
export type ReportSnapshotDetail = z.infer<typeof reportSnapshotDetailSchema>;
