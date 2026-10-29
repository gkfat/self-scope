import type { ReportSnapshotContent } from '../schemas/firestore/reportSnapshot.schema';

/** How long a report is kept, in months (the same as an AI report). */
export const SNAPSHOT_RETENTION_MONTHS = 6;

/** The most reports one member keeps; making another removes the oldest. */
export const MAX_SNAPSHOTS_PER_USER = 20;

/**
 * What makes two reports the same report: the report itself, without the times and without the AI analysis (which is
 * kept beside the report and does not make it another one). A time-sensitive sentence carries the date it was
 * made for, which moves every day; it is left out so that asking again on another day does not store the same report
 * twice. Anything that really changed (a sentence, a version, an input) makes it a different report.
 */
export function reportFingerprint(content: ReportSnapshotContent): string {
    return JSON.stringify({
        kind: content.kind,
        systems: content.systems,
        position: content.position,
        versions: content.versions,
        basis: content.basis,
        blocks: content.blocks.map((block) => ({
            ...block,
            segments: block.segments.map(({
                asOf: _asOf, ...segment
            }) => segment),
        })),
    });
}
