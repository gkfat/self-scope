import { BaseService } from './base.service';
import { ReportSnapshotRepository } from '../repositories/reportSnapshot.repository';
import {
    reportSnapshotContentSchema, reportSnapshotDocSchema, type ReportSnapshotContent, type ReportSnapshotDoc,
} from '../../shared/schemas/firestore/reportSnapshot.schema';
import type {
    ReportSnapshotDetail, ReportSnapshotItem,
} from '../../shared/schemas/api/reportSnapshot.schema';
import {
    MAX_SNAPSHOTS_PER_USER, SNAPSHOT_RETENTION_MONTHS,
} from '../../shared/utils/reportSnapshot';
import { addMonths } from '../../shared/utils/time';
import {
    NotFoundError, ValidationError,
} from '../../shared/types/errors';

type ReportSnapshotServiceOptions = {
    repository?: ReportSnapshotRepository;
    clock?: () => number;
};

export class ReportSnapshotService extends BaseService {
    protected serviceName = 'report-snapshot';

    private readonly repository: ReportSnapshotRepository;
    private readonly clock: () => number;

    constructor(options: ReportSnapshotServiceOptions = {}) {
        super();
        this.repository = options.repository ?? new ReportSnapshotRepository();
        this.clock = options.clock ?? Date.now;
    }

    /**
     * Keep a report as it was made, in full. A report that does not pass the schema (a sentence without a kind or a
     * source, a time-sensitive one without its date) is not stored at all. When the member is at the limit, the
     * oldest report goes in the same write that stores the new one.
     */
    async save(uid: string, content: ReportSnapshotContent): Promise<{ id: string; expiresAt: number }> {
        const parsed = reportSnapshotContentSchema.safeParse(content);

        if (!parsed.success) {
            throw new ValidationError('Invalid report snapshot', { issues: parsed.error.issues });
        }

        const now = this.clock();
        const doc: ReportSnapshotDoc = {
            ...parsed.data, generatedAt: now, expiresAt: addMonths(now, SNAPSHOT_RETENTION_MONTHS),
        };
        const repo = this.repository;
        const existing = await repo.snapshotsRef(uid).orderBy('generatedAt', 'asc').get();
        const overflow = existing.size + 1 - MAX_SNAPSHOTS_PER_USER;
        const ref = repo.snapshotsRef(uid).doc();
        const batch = repo.batch();

        for (const old of existing.docs.slice(0, Math.max(0, overflow))) batch.delete(old.ref);

        batch.set(ref, doc);
        await batch.commit();

        // Counts and ids only: never the text of a report (NFR-006)
        this.logInfo('report snapshot saved', {
            action: 'save',
            userId: uid,
            data: {
                snapshotId: ref.id, kind: doc.kind, blocks: doc.blocks.length, removedOldest: Math.max(0, overflow),
            },
        });

        return {
            id: ref.id, expiresAt: doc.expiresAt,
        };
    }

    /** One report of the member, or not found: someone else's id, a missing one and an expired one look the same. */
    async get(uid: string, snapshotId: string): Promise<ReportSnapshotDetail> {
        const snap = await this.repository.snapshotRef(uid, snapshotId).get();

        if (!snap.exists) {
            throw new NotFoundError('Report snapshot');
        }

        const doc = reportSnapshotDocSchema.parse(snap.data());

        if (doc.expiresAt <= this.clock()) {
            throw new NotFoundError('Report snapshot');
        }

        return {
            ...this.toItem(snapshotId, doc), blocks: doc.blocks, versions: doc.versions, basis: doc.basis,
        };
    }

    /** The member's reports that have not expired, newest first. */
    async list(uid: string): Promise<ReportSnapshotItem[]> {
        const now = this.clock();
        const snap = await this.repository.snapshotsRef(uid)
            .orderBy('generatedAt', 'desc')
            .limit(MAX_SNAPSHOTS_PER_USER)
            .get();

        return snap.docs
            .map((doc) => ({
                id: doc.id, doc: reportSnapshotDocSchema.parse(doc.data()),
            }))
            .filter(({ doc }) => doc.expiresAt > now)
            .map(({
                id, doc,
            }) => this.toItem(id, doc));
    }

    private toItem(id: string, doc: ReportSnapshotDoc): ReportSnapshotItem {
        return {
            id,
            kind: doc.kind,
            systems: doc.systems,
            position: doc.position,
            aiAugmented: doc.aiAugmented,
            generatedAt: doc.generatedAt,
            expiresAt: doc.expiresAt,
        };
    }
}
