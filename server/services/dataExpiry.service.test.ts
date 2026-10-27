import {
    beforeEach, describe, expect, it, vi,
} from 'vitest';
import { FakeFirestore } from '../test-utils/fakeFirestore';
import { DataExpiryService } from './dataExpiry.service';
import { ExpiryRepository } from '../repositories/expiry.repository';

const holder = vi.hoisted(() => ({ db: undefined as unknown }));

vi.mock('../utils/firebaseAdmin', () => ({ getAdminFirestore: () => holder.db }));

const NOW = Date.UTC(2026, 6, 1);
const PAST = NOW - 1000;
const FUTURE = NOW + 1000;

describe('DataExpiryService', () => {
    let db: FakeFirestore;
    let service: DataExpiryService;

    beforeEach(async () => {
        db = new FakeFirestore();
        holder.db = db;
        service = new DataExpiryService({ clock: () => NOW });

        await db.doc('users/u1').set({
            email: 'a@example.com', mbti: 'INTJ', mbtiExpiresAt: PAST, updatedAt: 0,
        });
        await db.doc('users/u2').set({
            email: 'b@example.com', mbti: 'ENFP', mbtiExpiresAt: FUTURE, updatedAt: 0,
        });

        await db.doc('users/u1/testAttempts/old').set({ expiresAt: PAST });
        await db.doc('users/u1/testAttempts/new').set({ expiresAt: FUTURE });
        await db.doc('users/u2/testAttempts/old').set({ expiresAt: PAST });
        await db.doc('users/u1/summaries/old').set({ expiresAt: PAST });
        await db.doc('users/u1/summaries/new').set({ expiresAt: FUTURE });
        await db.doc('users/u1/detailedReports/old').set({ expiresAt: PAST });
        await db.doc('users/u1/detailedReports/new').set({ expiresAt: FUTURE });
        await db.doc('users/u1/humanDesign/main').set({ expiresAt: PAST });
        await db.doc('users/u2/humanDesign/main').set({ expiresAt: FUTURE });
        await db.doc('users/u1/tarotDraws/2026-03-01').set({ expiresAt: PAST });
        await db.doc('users/u1/tarotDraws/2026-06-30').set({ expiresAt: FUTURE });
        await db.doc('users/u2/tarotDraws/2026-03-01').set({ expiresAt: PAST });

        await db.doc('users/u1/payments/p1').set({ status: 'COMPLETED' });
        await db.doc('users/u1/pointBatches/b1').set({
            remaining: 3, expiresAt: PAST,
        });
    });

    it('deletes expired records and keeps unexpired ones', async () => {
        const result = await service.run();

        expect(result).toEqual({
            deletedAttempts: 2,
            deletedSummaries: 1,
            deletedReports: 1,
            deletedHumanDesigns: 1,
            deletedTarotDraws: 2,
            clearedMbti: 1,
            failed: [],
        });

        const paths = db.paths();
        expect(paths).not.toContain('users/u1/testAttempts/old');
        expect(paths).not.toContain('users/u2/testAttempts/old');
        expect(paths).toContain('users/u1/testAttempts/new');
        expect(paths).toContain('users/u1/summaries/new');
        expect(paths).toContain('users/u1/detailedReports/new');
        expect(paths).toContain('users/u2/humanDesign/main');
        expect(paths).not.toContain('users/u1/tarotDraws/2026-03-01');
        expect(paths).not.toContain('users/u2/tarotDraws/2026-03-01');
        expect(paths).toContain('users/u1/tarotDraws/2026-06-30');
    });

    it('clears an expired mbti but leaves a current one alone', async () => {
        await service.run();

        expect((await db.doc('users/u1').get()).data()).toMatchObject({
            mbti: null, mbtiExpiresAt: null, email: 'a@example.com',
        });
        expect((await db.doc('users/u2').get()).data()?.mbti).toBe('ENFP');
    });

    it('never deletes payments, and does not treat point batches as expiring data', async () => {
        await service.run();

        expect(db.paths()).toContain('users/u1/payments/p1');
        expect(db.paths()).toContain('users/u1/pointBatches/b1');
    });

    it('does nothing the second time', async () => {
        await service.run();
        const second = await service.run();

        expect(second).toMatchObject({
            deletedAttempts: 0,
            deletedSummaries: 0,
            deletedReports: 0,
            deletedHumanDesigns: 0,
            deletedTarotDraws: 0,
            clearedMbti: 0,
        });
    });

    it('keeps going and reports the step when one step fails', async () => {
        const repository = new ExpiryRepository();
        const original = repository.expiredIn.bind(repository);

        repository.expiredIn = (group, now, limit) => {
            if (group === 'summaries') throw new Error('index missing');
            return original(group, now, limit);
        };

        const result = await new DataExpiryService({
            repository, clock: () => NOW,
        }).run();

        expect(result.failed).toEqual(['summaries']);
        expect(result.deletedAttempts).toBe(2);
        expect(result.deletedReports).toBe(1);
        expect(db.paths()).toContain('users/u1/summaries/old');

        // The next run retries the failed step.
        const retry = await service.run();
        expect(retry.deletedSummaries).toBe(1);
    });

    it('works through more documents than one batch', async () => {
        for (let i = 0; i < 450; i += 1) {
            await db.doc(`users/u3/testAttempts/a${i}`).set({ expiresAt: PAST });
        }

        const result = await service.run();

        expect(result.deletedAttempts).toBe(452);
        expect(db.paths().filter((p) => p.includes('/testAttempts/') && p.includes('old'))).toEqual([]);
    });
});
