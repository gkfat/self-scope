import { BaseService } from './base.service';
import { ExpiryRepository } from '../repositories/expiry.repository';
import type { DataExpiryResult } from '../../shared/schemas/api/cron.schema';
import { errorMessage } from '../../shared/types/errors';

const BATCH_SIZE = 400;
/** Bound one run so it cannot outlive the function; leftovers go in the next run. */
const MAX_BATCHES_PER_STEP = 25;

type DataExpiryServiceOptions = {
    repository?: ExpiryRepository;
    clock?: () => number;
};

/** Collection groups whose documents carry an `expiresAt` and are deleted when it passes. */
const EXPIRING_GROUPS = [
    {
        group: 'testAttempts', key: 'deletedAttempts',
    },
    {
        group: 'summaries', key: 'deletedSummaries',
    },
    {
        group: 'detailedReports', key: 'deletedReports',
    },
    {
        group: 'humanDesign', key: 'deletedHumanDesigns',
    },
    {
        group: 'tarotDraws', key: 'deletedTarotDraws',
    },
    {
        group: 'kinUnlocks', key: 'deletedKinUnlocks',
    },
] as const;

export class DataExpiryService extends BaseService {
    protected serviceName = 'data-expiry';

    private readonly repository: ExpiryRepository;
    private readonly clock: () => number;

    constructor(options: DataExpiryServiceOptions = {}) {
        super();
        this.repository = options.repository ?? new ExpiryRepository();
        this.clock = options.clock ?? Date.now;
    }

    /**
     * Delete what has passed its retention (RULE-014, RULE-030) and clear expired MBTI values.
     * Each step is independent: one failing does not stop the others, and the failure
     * is reported so the next run can retry it. Payment records are never touched.
     */
    async run(): Promise<DataExpiryResult> {
        const now = this.clock();
        const result: DataExpiryResult = {
            deletedAttempts: 0,
            deletedSummaries: 0,
            deletedReports: 0,
            deletedHumanDesigns: 0,
            deletedTarotDraws: 0,
            deletedKinUnlocks: 0,
            clearedMbti: 0,
            failed: [],
        };

        for (const {
            group, key, 
        } of EXPIRING_GROUPS) {
            await this.step(group, result, async () => {
                result[key] = await this.deleteExpired(group, now);
            });
        }

        await this.step('mbti', result, async () => {
            result.clearedMbti = await this.clearExpiredMbti(now);
        });

        // Counts only: no ids, answers or report content in the log (NFR-006).
        this.logInfo('data expiry finished', {
            action: 'run',
            data: { ...result },
        });

        return result;
    }

    private async step(name: string, result: DataExpiryResult, work: () => Promise<void>): Promise<void> {
        try {
            await work();
        } catch (error) {
            result.failed.push(name);
            this.logError(`data expiry step failed: ${name}`, {
                action: 'run',
                data: { reason: errorMessage(error) },
            });
        }
    }

    private async deleteExpired(group: string, now: number): Promise<number> {
        let deleted = 0;

        for (let i = 0; i < MAX_BATCHES_PER_STEP; i += 1) {
            const snap = await this.repository.expiredIn(group, now, BATCH_SIZE).get();

            if (snap.empty) break;

            const batch = this.repository.batch();

            for (const doc of snap.docs) batch.delete(doc.ref);

            await batch.commit();
            deleted += snap.size;

            if (snap.size < BATCH_SIZE) break;
        }

        return deleted;
    }

    private async clearExpiredMbti(now: number): Promise<number> {
        let cleared = 0;

        for (let i = 0; i < MAX_BATCHES_PER_STEP; i += 1) {
            const snap = await this.repository.usersWithExpiredMbti(now, BATCH_SIZE).get();

            if (snap.empty) break;

            const batch = this.repository.batch();

            for (const doc of snap.docs) {
                batch.update(doc.ref, {
                    mbti: null,
                    mbtiExpiresAt: null,
                    updatedAt: now,
                });
            }

            await batch.commit();
            cleared += snap.size;

            if (snap.size < BATCH_SIZE) break;
        }

        return cleared;
    }
}
