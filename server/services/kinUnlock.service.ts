import { BaseService } from './base.service';
import { FixedContentService } from './fixedContent.service';
import { KinUnlockRepository } from '../repositories/kinUnlock.repository';
import { toMillis } from '../utils/firestoreTime';
import { KIN_UNLOCK_RETENTION_MONTHS } from '../../shared/constants/mayaKin';
import type { FixedResultResponse } from '../../shared/schemas/api/fixedResult.schema';
import type { KinTodayResponse } from '../../shared/schemas/api/mayaKin.schema';
import {
    kinUnlockDocSchema, type KinUnlockDoc,
} from '../../shared/schemas/firestore/kinUnlock.schema';
import { kinOf } from '../../shared/utils/mayaKin';
import {
    addMonths, taipeiDateKey,
} from '../../shared/utils/time';

type KinUnlockServiceOptions = {
    repository?: KinUnlockRepository;
    content?: FixedContentService;
    clock?: () => number;
};

export class KinUnlockService extends BaseService {
    protected serviceName = 'kin-unlock';

    private readonly repository: KinUnlockRepository;
    private readonly content: FixedContentService;
    private readonly clock: () => number;

    constructor(options: KinUnlockServiceOptions = {}) {
        super();
        this.repository = options.repository ?? new KinUnlockRepository();
        this.content = options.content ?? new FixedContentService();
        this.clock = options.clock ?? Date.now;
    }

    /**
     * Today's Kin if the member has unlocked it. Never writes, and a locked day gives away nothing but the
     * date (the Kin follows from the date, but the server does not hand it out).
     */
    async getToday(uid: string): Promise<KinTodayResponse> {
        const date = taipeiDateKey(new Date(this.clock()));
        const unlock = await this.readUnlock(uid, date);

        if (!unlock) {
            return {
                date, unlocked: false,
            };
        }

        return this.toResponse(date, unlock, await this.contentOf(unlock));
    }

    /**
     * Unlock today's Kin. The first call of a Taipei day creates the record; any later call returns it
     * unchanged, so a retry or two concurrent requests end the same way. Free. The written content is read
     * before anything is stored: a Kin without published content is a 404 that uses up nothing.
     */
    async unlock(uid: string): Promise<KinTodayResponse> {
        const now = this.clock();
        const date = taipeiDateKey(new Date(now));
        const existing = await this.readUnlock(uid, date);

        if (existing) {
            return this.toResponse(date, existing, await this.contentOf(existing));
        }

        const kin = kinOf(date);
        const content = await this.content.getPublished('KIN_TODAY', String(kin.kinNumber));
        const candidate: KinUnlockDoc = {
            kin,
            unlockedAt: now,
            expiresAt: addMonths(now, KIN_UNLOCK_RETENTION_MONTHS),
        };

        const stored = await this.repository.runTransaction(async (tx) => {
            const ref = this.repository.ref(uid, date);
            const snap = await tx.get(ref);

            // Another request got here first: its record stands.
            if (snap.exists) return this.parseUnlock(snap.data());

            tx.set(ref, candidate);

            return candidate;
        });

        this.logInfo('kin unlocked', {
            action: 'unlock',
            userId: uid,
        });

        const sameKin = stored.kin.kinNumber === candidate.kin.kinNumber;

        return this.toResponse(date, stored, sameKin ? content : await this.contentOf(stored));
    }

    private async readUnlock(uid: string, date: string): Promise<KinUnlockDoc | null> {
        const snap = await this.repository.ref(uid, date).get();

        return snap.exists ? this.parseUnlock(snap.data()) : null;
    }

    /** Stored documents are untrusted input to this service. */
    private parseUnlock(raw: unknown): KinUnlockDoc {
        const data = raw as Record<string, unknown>;

        return kinUnlockDocSchema.parse({
            ...data,
            unlockedAt: toMillis(data.unlockedAt),
            expiresAt: toMillis(data.expiresAt),
        });
    }

    private contentOf(unlock: KinUnlockDoc): Promise<FixedResultResponse> {
        return this.content.getPublished('KIN_TODAY', String(unlock.kin.kinNumber));
    }

    private toResponse(date: string, unlock: KinUnlockDoc, content: FixedResultResponse): KinTodayResponse {
        return {
            date, unlocked: true, kin: unlock.kin, content,
        };
    }
}
