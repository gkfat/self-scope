import {
    beforeEach, describe, expect, it, vi,
} from 'vitest';
import { FakeFirestore } from '../test-utils/fakeFirestore';
import { DeletionService } from './deletion.service';
import { ExternalServiceError } from '../../shared/types/errors';

const holder = vi.hoisted(() => ({ db: undefined as unknown }));

vi.mock('../utils/firebaseAdmin', () => ({ getAdminFirestore: () => holder.db }));

async function seed(db: FakeFirestore) {
    await db.doc('users/u1').set({
        email: 'a@example.com', mbti: 'INTJ', mbtiExpiresAt: 1, gender: 'MALE', updatedAt: 0,
    });
    await db.doc('users/u1/testAttempts/a1').set({ result: 'INTJ' });
    await db.doc('users/u1/humanDesign/main').set({ x: 1 });
    await db.doc('users/u1/tarotDraws/2026-10-27').set({ cardIndex: 3 });
    await db.doc('users/u1/tarotDraws/2026-10-28').set({ cardIndex: 5 });
    await db.doc('users/u1/kinUnlocks/2026-10-27').set({ kin: { kinNumber: 1 } });
    await db.doc('users/u1/kinUnlocks/2026-10-28').set({ kin: { kinNumber: 2 } });
    await db.doc('users/u1/runeDraws/2026-10-27').set({ symbolIndex: 3 });
    await db.doc('users/u1/runeDraws/2026-10-28').set({ symbolIndex: 5 });
    await db.doc('users/u1/reportSnapshots/s1').set({ position: 'a' });
    await db.doc('users/u1/reportSnapshots/s2').set({ position: 'b' });
    await db.doc('users/u1/pointAccount/main').set({ x: 1 });
    await db.doc('users/u1/pointBatches/b1').set({ remaining: 3 });
    await db.doc('users/u1/payments/p1').set({ x: 1 });
    await db.doc('users/u2').set({ email: 'b@example.com' });
    await db.doc('users/u2/testAttempts/a9').set({ result: 'ENFP' });
    await db.doc('users/u2/tarotDraws/2026-10-27').set({ cardIndex: 9 });
    await db.doc('users/u2/kinUnlocks/2026-10-27').set({ kin: { kinNumber: 3 } });
    await db.doc('users/u2/runeDraws/2026-10-27').set({ symbolIndex: 9 });
    await db.doc('users/u2/reportSnapshots/s9').set({ position: 'c' });
    await db.doc('welcomeGrants/hash1').set({ googleUidHash: 'hash1' });
    await db.doc('aiUsageRecords/r1').set({
        userId: 'u1', estimatedCost: 1,
    });
    await db.doc('aiUsageRecords/r2').set({
        userId: 'u2', estimatedCost: 2,
    });
}

describe('DeletionService.deleteData', () => {
    let db: FakeFirestore;
    let service: DeletionService;

    beforeEach(async () => {
        db = new FakeFirestore();
        holder.db = db;
        await seed(db);
        service = new DeletionService({ deleteAuthUser: async () => undefined });
    });

    it('deletes only the named scope', async () => {
        await service.deleteData('u1', ['REPORTS']);

        expect(db.paths().filter((p) => p.startsWith('users/u1/reportSnapshots'))).toEqual([]);
        expect(db.paths()).toContain('users/u1/testAttempts/a1');
        expect(db.paths()).toContain('users/u1/payments/p1');
    });

    it('deletes the report snapshots together with the reports, and keeps those of other users', async () => {
        await service.deleteData('u1', ['REPORTS']);

        expect(db.paths().filter((p) => p.includes('/reportSnapshots/'))).toEqual(['users/u2/reportSnapshots/s9']);
    });

    it('leaves the report snapshots alone when other data is deleted', async () => {
        await service.deleteData('u1', ['RESULTS']);

        expect(db.paths()).toContain('users/u1/reportSnapshots/s1');
        expect(db.paths()).toContain('users/u1/reportSnapshots/s2');
    });

    it('clears the stored mbti together with test results', async () => {
        await service.deleteData('u1', ['RESULTS']);

        expect(db.paths()).not.toContain('users/u1/testAttempts/a1');
        expect((await db.doc('users/u1').get()).data()?.mbti).toBeNull();
    });

    it('never touches points or payments', async () => {
        await service.deleteData('u1', [
            'RESULTS',
            'REPORTS',
            'HUMAN_DESIGN',
        ]);

        expect(db.paths()).toContain('users/u1/pointBatches/b1');
        expect(db.paths()).toContain('users/u1/payments/p1');
        expect(db.paths()).toContain('users/u1');
    });

    it('does not touch other users', async () => {
        await service.deleteData('u1', ['RESULTS']);

        expect(db.paths()).toContain('users/u2/testAttempts/a9');
    });
});

describe('DeletionService.deleteAccount', () => {
    let db: FakeFirestore;

    beforeEach(async () => {
        db = new FakeFirestore();
        holder.db = db;
        await seed(db);
    });

    it('removes every record of the user, including payments and points', async () => {
        const deleteAuthUser = vi.fn(async () => undefined);
        await new DeletionService({ deleteAuthUser }).deleteAccount('u1');

        expect(db.paths().filter((p) => p.startsWith('users/u1'))).toEqual([]);
        expect(deleteAuthUser).toHaveBeenCalledWith('u1');
    });

    it('removes every tarot draw of the user and keeps those of other users', async () => {
        await new DeletionService({ deleteAuthUser: async () => undefined }).deleteAccount('u1');

        expect(db.paths().filter((p) => p.includes('/tarotDraws/'))).toEqual(['users/u2/tarotDraws/2026-10-27']);
    });

    it('removes every Kin unlock of the user and keeps those of other users', async () => {
        await new DeletionService({ deleteAuthUser: async () => undefined }).deleteAccount('u1');

        expect(db.paths().filter((p) => p.includes('/kinUnlocks/'))).toEqual(['users/u2/kinUnlocks/2026-10-27']);
    });

    it('removes every rune draw of the user and keeps those of other users', async () => {
        await new DeletionService({ deleteAuthUser: async () => undefined }).deleteAccount('u1');

        expect(db.paths().filter((p) => p.includes('/runeDraws/'))).toEqual(['users/u2/runeDraws/2026-10-27']);
    });

    it('removes every report snapshot of the user and keeps those of other users', async () => {
        await new DeletionService({ deleteAuthUser: async () => undefined }).deleteAccount('u1');

        expect(db.paths().filter((p) => p.includes('/reportSnapshots/'))).toEqual(['users/u2/reportSnapshots/s9']);
    });

    it('removes the gender together with the profile', async () => {
        await new DeletionService({ deleteAuthUser: async () => undefined }).deleteAccount('u1');

        expect((await db.doc('users/u1').get()).exists).toBe(false);
    });

    it('keeps the welcome-grant ledger and other users', async () => {
        await new DeletionService({ deleteAuthUser: async () => undefined }).deleteAccount('u1');

        expect(db.paths()).toContain('welcomeGrants/hash1');
        expect(db.paths()).toContain('users/u2');
        expect(db.paths()).toContain('users/u2/testAttempts/a9');
    });

    it('keeps AI usage for cost accounting but clears the userId', async () => {
        await new DeletionService({ deleteAuthUser: async () => undefined }).deleteAccount('u1');

        expect((await db.doc('aiUsageRecords/r1').get()).data()).toEqual({
            userId: null, estimatedCost: 1,
        });
        expect((await db.doc('aiUsageRecords/r2').get()).data()?.userId).toBe('u2');
    });

    it('reports an auth-user failure and can be retried', async () => {
        const failing = new DeletionService({
            deleteAuthUser: async () => {
                throw new Error('boom');
            },
        });

        await expect(failing.deleteAccount('u1')).rejects.toBeInstanceOf(ExternalServiceError);
        // Data is already gone, so a retry only has to remove the auth user.
        expect(db.paths().filter((p) => p.startsWith('users/u1'))).toEqual([]);

        const retry = vi.fn(async () => undefined);
        await new DeletionService({ deleteAuthUser: retry }).deleteAccount('u1');
        expect(retry).toHaveBeenCalledWith('u1');
    });
});
