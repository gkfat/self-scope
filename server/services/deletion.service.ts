import { getAuth } from 'firebase-admin/auth';
import { BaseService } from './base.service';
import { DeletionRepository } from '../repositories/deletion.repository';
import { getFirebaseAdminApp } from '../utils/firebaseAdmin';
import {
    ExternalServiceError, errorMessage,
} from '../../shared/types/errors';
import type {
    DeleteDataScope, DeleteResult,
} from '../../shared/schemas/api/account.schema';

const BATCH_LIMIT = 400;

/** Sub-collections removed by each data scope. */
const SCOPE_COLLECTIONS: Record<DeleteDataScope, readonly string[]> = {
    RESULTS: ['testAttempts'],
    SUMMARIES: ['summaries'],
    // A report kept as a snapshot is a report: deleting the member's reports deletes it too
    REPORTS: ['detailedReports', 'reportSnapshots'],
    HUMAN_DESIGN: ['humanDesign'],
};

type DeletionServiceOptions = {
    repository?: DeletionRepository;
    deleteAuthUser?: (uid: string) => Promise<void>;
};

export class DeletionService extends BaseService {
    protected serviceName = 'deletion';

    private readonly repository: DeletionRepository;
    private readonly deleteAuthUser: (uid: string) => Promise<void>;

    constructor(options: DeletionServiceOptions = {}) {
        super();
        this.repository = options.repository ?? new DeletionRepository();
        this.deleteAuthUser = options.deleteAuthUser
            ?? (async (uid) => getAuth(getFirebaseAdminApp()).deleteUser(uid));
    }

    /**
     * Delete the named data only. Points, payments and the account stay untouched.
     * The RESULTS scope also clears the stored MBTI, which is a test result.
     */
    async deleteData(uid: string, scopes: readonly DeleteDataScope[]): Promise<DeleteResult> {
        const unique = [...new Set(scopes)];
        const repo = this.repository;

        for (const scope of unique) {
            for (const name of SCOPE_COLLECTIONS[scope]) {
                await repo.recursiveDelete(repo.subcollectionRef(uid, name));
            }
        }

        if (unique.includes('RESULTS')) {
            await repo.userRef(uid).update({
                mbti: null,
                mbtiExpiresAt: null,
                updatedAt: Date.now(),
            });
        }

        this.logInfo('data deleted', {
            action: 'deleteData',
            userId: uid,
            data: { scopes: unique },
        });

        return { deleted: unique };
    }

    /**
     * Delete the account and every record of it (RULE-024):
     * - AI usage records are kept for cost accounting but lose their userId
     * - the welcome-grant ledger is kept (it only holds a keyed hash)
     * - the Firebase Auth user is removed last, so a failure can simply be retried
     */
    async deleteAccount(uid: string): Promise<DeleteResult> {
        const repo = this.repository;

        await this.detachAiUsage(uid);
        await repo.recursiveDelete(repo.userRef(uid));

        try {
            await this.deleteAuthUser(uid);
        } catch (error) {
            this.logError('failed to delete auth user', {
                action: 'deleteAccount',
                userId: uid,
                error,
            });

            throw new ExternalServiceError('firebase-auth', errorMessage(error));
        }

        this.logInfo('account deleted', {
            action: 'deleteAccount',
            userId: uid,
        });

        return { deleted: ['ACCOUNT'] };
    }

    private async detachAiUsage(uid: string): Promise<void> {
        const repo = this.repository;
        const snapshot = await repo.aiUsageForUser(uid).get();

        for (let i = 0; i < snapshot.docs.length; i += BATCH_LIMIT) {
            const batch = repo.batch();

            for (const doc of snapshot.docs.slice(i, i + BATCH_LIMIT)) {
                batch.update(doc.ref, { userId: null });
            }

            await batch.commit();
        }
    }
}
