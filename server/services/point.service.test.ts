import {
    beforeEach, describe, expect, it, vi,
} from 'vitest';
import { FakeFirestore } from '../test-utils/fakeFirestore';
import { PointService } from './point.service';
import { InsufficientPointsError } from '../../shared/types/errors';
import { DAY_MS } from '../../shared/utils/time';

const holder = vi.hoisted(() => ({ db: undefined as unknown }));

vi.mock('../utils/firebaseAdmin', () => ({ getAdminFirestore: () => holder.db }));

const NOW = Date.UTC(2026, 0, 15, 12);

type BatchSeed = {
    id: string;
    source?: 'WELCOME' | 'PURCHASE';
    remaining: number;
    expiresAt: number | null;
    createdAt?: number;
};

async function seedBatch(db: FakeFirestore, uid: string, batch: BatchSeed) {
    await db.doc(`users/${uid}/pointBatches/${batch.id}`).set({
        source: batch.source ?? 'PURCHASE',
        sourceRef: null,
        granted: batch.remaining,
        remaining: batch.remaining,
        expiresAt: batch.expiresAt,
        createdAt: batch.createdAt ?? NOW - DAY_MS,
    });
}

async function remainingOf(db: FakeFirestore, uid: string, id: string) {
    return (await db.doc(`users/${uid}/pointBatches/${id}`).get()).data()?.remaining;
}

const deduct = (service: PointService, transactionId: string, amount = 1, uid = 'u1') => service.deduct({
    uid,
    amount,
    reason: 'SINGLE_AI_ANALYSIS',
    transactionId,
    reference: null,
});

describe('PointService', () => {
    let db: FakeFirestore;
    let service: PointService;

    beforeEach(() => {
        db = new FakeFirestore();
        holder.db = db;
        service = new PointService({ clock: () => NOW });
    });

    describe('getBalance', () => {
        it('sums unexpired batches in spend order and ignores empty or expired ones', async () => {
            await seedBatch(db, 'u1', {
                id: 'forever', remaining: 10, expiresAt: null,
            });
            await seedBatch(db, 'u1', {
                id: 'soon', remaining: 2, expiresAt: NOW + DAY_MS,
            });
            await seedBatch(db, 'u1', {
                id: 'later', remaining: 3, expiresAt: NOW + 5 * DAY_MS,
            });
            await seedBatch(db, 'u1', {
                id: 'expired', remaining: 99, expiresAt: NOW - 1,
            });
            await seedBatch(db, 'u1', {
                id: 'empty', remaining: 0, expiresAt: null,
            });
            await seedBatch(db, 'u2', {
                id: 'other', remaining: 50, expiresAt: null,
            });

            const balance = await service.getBalance('u1');

            expect(balance.availableBalance).toBe(15);
            expect(balance.batches.map((b) => b.batchId)).toEqual([
                'soon',
                'later',
                'forever',
            ]);
        });

        it('is zero for a user with no batches', async () => {
            expect(await service.getBalance('u1')).toEqual({
                availableBalance: 0, batches: [],
            });
        });
    });

    describe('deduct', () => {
        it('spends soonest-expiring points first and never-expiring points last', async () => {
            await seedBatch(db, 'u1', {
                id: 'forever', remaining: 10, expiresAt: null,
            });
            await seedBatch(db, 'u1', {
                id: 'welcome', source: 'WELCOME', remaining: 2, expiresAt: NOW + DAY_MS,
            });

            await deduct(service, 'op1', 3);

            expect(await remainingOf(db, 'u1', 'welcome')).toBe(0);
            expect(await remainingOf(db, 'u1', 'forever')).toBe(9);

            const record = (await db.doc('users/u1/pointTransactions/op1').get()).data();
            expect(record).toMatchObject({
                type: 'DEDUCT',
                amount: 3,
                batchAllocations: [
                    {
                        batchId: 'welcome', amount: 2,
                    }, {
                        batchId: 'forever', amount: 1,
                    },
                ],
            });
        });

        it('rejects when the usable points do not cover the amount and changes nothing', async () => {
            await seedBatch(db, 'u1', {
                id: 'a', remaining: 2, expiresAt: null,
            });
            await seedBatch(db, 'u1', {
                id: 'expired', remaining: 10, expiresAt: NOW - 1,
            });

            await expect(deduct(service, 'op1', 5)).rejects.toBeInstanceOf(InsufficientPointsError);

            expect(await remainingOf(db, 'u1', 'a')).toBe(2);
            expect(db.paths().filter((p) => p.includes('/pointTransactions/'))).toEqual([]);
        });

        it('reports the shortfall in the error details', async () => {
            await seedBatch(db, 'u1', {
                id: 'a', remaining: 2, expiresAt: null,
            });

            await expect(deduct(service, 'op1', 5)).rejects.toMatchObject({
                statusCode: 402,
                details: {
                    required: 5, available: 2,
                },
            });
        });

        it('charges an operation only once when repeated', async () => {
            await seedBatch(db, 'u1', {
                id: 'a', remaining: 5, expiresAt: null,
            });

            expect(await deduct(service, 'op1')).toEqual({ charged: true });
            expect(await deduct(service, 'op1')).toEqual({ charged: false });
            expect(await remainingOf(db, 'u1', 'a')).toBe(4);
        });

        it('charges once when the same operation is submitted concurrently', async () => {
            await seedBatch(db, 'u1', {
                id: 'a', remaining: 5, expiresAt: null,
            });

            const results = await Promise.all([
                deduct(service, 'op1'),
                deduct(service, 'op1'),
                deduct(service, 'op1'),
                deduct(service, 'op1'),
            ]);

            expect(results.filter((r) => r.charged)).toHaveLength(1);
            expect(await remainingOf(db, 'u1', 'a')).toBe(4);
        });

        it('never overspends under concurrent distinct operations', async () => {
            await seedBatch(db, 'u1', {
                id: 'a', remaining: 3, expiresAt: null,
            });

            const results = await Promise.allSettled(
                Array.from({ length: 8 }, (_, i) => deduct(service, `op${i}`)),
            );

            expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(3);
            expect(results.filter((r) => r.status === 'rejected')).toHaveLength(5);
            expect(await remainingOf(db, 'u1', 'a')).toBe(0);
        });

        it('does not touch another user', async () => {
            await seedBatch(db, 'u1', {
                id: 'a', remaining: 5, expiresAt: null,
            });
            await seedBatch(db, 'u2', {
                id: 'a', remaining: 5, expiresAt: null,
            });

            await deduct(service, 'op1', 2, 'u1');

            expect(await remainingOf(db, 'u2', 'a')).toBe(5);
        });
    });

    describe('refund', () => {
        const refund = (transactionId = 'op1') => service.refund({
            uid: 'u1',
            deductTransactionId: transactionId,
            refundTransactionId: `refund_${transactionId}`,
            reference: null,
        });

        it('returns the points to the batches they came from', async () => {
            await seedBatch(db, 'u1', {
                id: 'a', remaining: 5, expiresAt: null,
            });
            await deduct(service, 'op1', 3);

            expect(await refund()).toEqual({ refunded: true });
            expect(await remainingOf(db, 'u1', 'a')).toBe(5);
            expect((await db.doc('users/u1/pointTransactions/refund_op1').get()).data()).toMatchObject({
                type: 'REFUND', amount: 3,
            });
        });

        it('refunds only once, even when requested concurrently', async () => {
            await seedBatch(db, 'u1', {
                id: 'a', remaining: 5, expiresAt: null,
            });
            await deduct(service, 'op1', 3);

            const results = await Promise.all([
                refund(),
                refund(),
                refund(),
            ]);

            expect(results.filter((r) => r.refunded)).toHaveLength(1);
            expect(await remainingOf(db, 'u1', 'a')).toBe(5);
        });

        it('has nothing to refund for an operation that never charged', async () => {
            expect(await refund('never')).toEqual({ refunded: false });
        });

        it('puts points into a new non-expiring batch when their original batch has expired', async () => {
            await seedBatch(db, 'u1', {
                id: 'welcome', source: 'WELCOME', remaining: 1, expiresAt: NOW + 1000,
            });
            await deduct(service, 'op1', 1);

            // The refund happens after the welcome batch expired.
            const late = new PointService({ clock: () => NOW + 2000 });
            await late.refund({
                uid: 'u1',
                deductTransactionId: 'op1',
                refundTransactionId: 'refund_op1',
                reference: null,
            });

            expect(await remainingOf(db, 'u1', 'welcome')).toBe(0);

            const balance = await late.getBalance('u1');
            expect(balance.availableBalance).toBe(1);
            expect(balance.batches[0]).toMatchObject({
                source: 'REFUND', expiresAt: null,
            });
        });
    });

    describe('planGrant', () => {
        const grant = (transactionId: string) => service['repository'].runTransaction(async (tx) => {
            const plan = await service.planGrant(tx, {
                uid: 'u1',
                amount: 10,
                source: 'PURCHASE',
                sourceRef: 'pay1',
                batchId: 'purchase_pay1',
                transactionId,
                expiresAt: null,
            });

            plan.apply();

            return plan.alreadyDone;
        });

        it('creates a non-expiring purchase batch and a PURCHASE transaction', async () => {
            await grant('purchase_pay1');

            expect((await service.getBalance('u1')).availableBalance).toBe(10);
            expect((await db.doc('users/u1/pointTransactions/purchase_pay1').get()).data()).toMatchObject({
                type: 'PURCHASE', amount: 10, reference: 'pay1',
            });
        });

        it('credits only once for the same transaction id', async () => {
            expect(await grant('purchase_pay1')).toBe(false);
            expect(await grant('purchase_pay1')).toBe(true);

            expect((await service.getBalance('u1')).availableBalance).toBe(10);
        });
    });

    describe('listTransactions', () => {
        beforeEach(async () => {
            for (let i = 1; i <= 5; i += 1) {
                await db.doc(`users/u1/pointTransactions/t${i}`).set({
                    type: 'DEDUCT',
                    amount: 1,
                    reason: 'SINGLE_AI_ANALYSIS',
                    batchAllocations: [],
                    reference: null,
                    createdAt: NOW + i * 1000,
                });
            }
        });

        it('returns newest first with a cursor for the next page', async () => {
            const first = await service.listTransactions('u1', 2);

            expect(first.items.map((i) => i.transactionId)).toEqual(['t5', 't4']);
            expect(first.nextCursor).not.toBeNull();

            const second = await service.listTransactions('u1', 2, first.nextCursor as string);
            expect(second.items.map((i) => i.transactionId)).toEqual(['t3', 't2']);

            const third = await service.listTransactions('u1', 2, second.nextCursor as string);
            expect(third.items.map((i) => i.transactionId)).toEqual(['t1']);
            expect(third.nextCursor).toBeNull();
        });

        it('returns an empty list when there are no transactions', async () => {
            expect(await service.listTransactions('nobody', 20)).toEqual({
                items: [], nextCursor: null,
            });
        });
    });
});
