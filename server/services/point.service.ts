import type { Transaction } from 'firebase-admin/firestore';
import { BaseService } from './base.service';
import { PointRepository } from '../repositories/point.repository';
import {
    pointBatchDocSchema, pointTransactionDocSchema,
    type PointBatchDoc, type PointTransactionDoc,
} from '../../shared/schemas/firestore/points.schema';
import type {
    PointBalance, PointTransactionList,
} from '../../shared/schemas/api/points.schema';
import {
    BusinessLogicError, InsufficientPointsError,
} from '../../shared/types/errors';

type PointServiceOptions = {
    repository?: PointRepository;
    clock?: () => number;
};

export type DeductReason = 'SUMMARY' | 'DETAILED_REPORT' | 'REGENERATE' | 'SINGLE_AI_ANALYSIS' | 'DOWNLOAD';

export type DeductParams = {
    uid: string;
    amount: number;
    reason: DeductReason;
    /** Deterministic id of this operation; it is the idempotency key. */
    transactionId: string;
    reference: string | null;
};

export type GrantParams = {
    uid: string;
    amount: number;
    source: 'PURCHASE';
    sourceRef: string;
    batchId: string;
    transactionId: string;
    /** null: never expires */
    expiresAt: number | null;
};

export type RefundParams = {
    uid: string;
    /** The DEDUCT transaction being reversed. */
    deductTransactionId: string;
    refundTransactionId: string;
    reference: string | null;
};

/**
 * A planned change. All reads happen while planning; `apply()` only queues
 * writes, so callers can read their own documents, plan, and then write —
 * the order Firestore transactions require.
 */
export type PointPlan = {
    /** True when this operation already happened; apply() is then a no-op. */
    alreadyDone: boolean;
    apply: () => void;
};

type LoadedBatch = {
    id: string;
    doc: PointBatchDoc;
};

function isUsable(batch: PointBatchDoc, now: number): boolean {
    return batch.remaining > 0 && (batch.expiresAt === null || batch.expiresAt > now);
}

/**
 * Spend order: soonest expiry first, batches that never expire last (FR-042).
 */
function bySpendOrder(a: LoadedBatch, b: LoadedBatch): number {
    const ax = a.doc.expiresAt ?? Number.POSITIVE_INFINITY;
    const bx = b.doc.expiresAt ?? Number.POSITIVE_INFINITY;

    if (ax !== bx) return ax < bx ? -1 : 1;
    if (a.doc.createdAt !== b.doc.createdAt) return a.doc.createdAt - b.doc.createdAt;

    return a.id.localeCompare(b.id);
}

export class PointService extends BaseService {
    protected serviceName = 'points';

    private readonly repository: PointRepository;
    private readonly clock: () => number;

    constructor(options: PointServiceOptions = {}) {
        super();
        this.repository = options.repository ?? new PointRepository();
        this.clock = options.clock ?? Date.now;
    }

    /**
     * Available balance and the usable batches in spend order.
     */
    async getBalance(uid: string): Promise<PointBalance> {
        const snap = await this.repository.batchesRef(uid).where('remaining', '>', 0).get();
        const now = this.clock();

        const batches = snap.docs
            .map((doc) => ({
                id: doc.id,
                doc: pointBatchDocSchema.parse(doc.data()),
            }))
            .filter((batch) => isUsable(batch.doc, now))
            .sort(bySpendOrder);

        return {
            availableBalance: batches.reduce((sum, batch) => sum + batch.doc.remaining, 0),
            batches: batches.map(({
                id, doc, 
            }) => ({
                batchId: id,
                source: doc.source,
                granted: doc.granted,
                remaining: doc.remaining,
                expiresAt: doc.expiresAt,
            })),
        };
    }

    /**
     * Newest first. The cursor is the createdAt of the last item of the previous page.
     */
    async listTransactions(uid: string, limit: number, cursor?: string): Promise<PointTransactionList> {
        let query = this.repository.transactionsRef(uid).orderBy('createdAt', 'desc');

        if (cursor !== undefined) {
            query = query.where('createdAt', '<', Number(cursor));
        }

        const snap = await query.limit(limit + 1).get();
        const rows = snap.docs.map((doc) => ({
            id: doc.id,
            doc: pointTransactionDocSchema.parse(doc.data()),
        }));
        const page = rows.slice(0, limit);
        const last = page[page.length - 1];

        return {
            items: page.map(({
                id, doc, 
            }) => ({
                transactionId: id,
                type: doc.type,
                amount: doc.amount,
                reason: doc.reason,
                reference: doc.reference,
                createdAt: doc.createdAt,
            })),
            nextCursor: rows.length > limit && last ? String(last.doc.createdAt) : null,
        };
    }

    /**
     * Plan spending points inside an existing transaction.
     * Throws InsufficientPointsError when the usable points do not cover `amount`.
     * The same transactionId is only ever charged once (RULE-007, RULE-025).
     */
    async planDeduction(tx: Transaction, params: DeductParams): Promise<PointPlan> {
        const repo = this.repository;
        const now = this.clock();
        const transactionRef = repo.transactionRef(params.uid, params.transactionId);

        if ((await tx.get(transactionRef)).exists) {
            return {
                alreadyDone: true, apply: () => undefined,
            };
        }

        const snap = await tx.get(repo.batchesRef(params.uid).where('remaining', '>', 0));
        const usable = snap.docs
            .map((doc) => ({
                id: doc.id,
                doc: pointBatchDocSchema.parse(doc.data()),
            }))
            .filter((batch) => isUsable(batch.doc, now))
            .sort(bySpendOrder);

        const available = usable.reduce((sum, batch) => sum + batch.doc.remaining, 0);

        if (available < params.amount) {
            throw new InsufficientPointsError('Not enough points', {
                required: params.amount, available,
            });
        }

        const allocations: PointTransactionDoc['batchAllocations'] = [];
        let left = params.amount;

        for (const batch of usable) {
            if (left === 0) break;

            const take = Math.min(left, batch.doc.remaining);

            allocations.push({
                batchId: batch.id, amount: take,
            });
            left -= take;
        }

        return {
            alreadyDone: false,
            apply: () => {
                for (const {
                    batchId, amount, 
                } of allocations) {
                    const batch = usable.find((b) => b.id === batchId) as LoadedBatch;

                    tx.update(repo.batchRef(params.uid, batchId), { remaining: batch.doc.remaining - amount });
                }

                const record: PointTransactionDoc = {
                    type: 'DEDUCT',
                    amount: params.amount,
                    reason: params.reason,
                    batchAllocations: allocations,
                    reference: params.reference,
                    createdAt: now,
                };

                tx.set(transactionRef, record);
            },
        };
    }

    /**
     * Plan giving points back after a failed operation (FR-019, RULE-010).
     * Points return to the batches they came from; if such a batch has expired in the
     * meantime they go into a fresh non-expiring REFUND batch so nothing is lost.
     * Returns null when there is nothing to refund.
     */
    async planRefund(tx: Transaction, params: RefundParams): Promise<PointPlan | null> {
        const repo = this.repository;
        const now = this.clock();
        const refundRef = repo.transactionRef(params.uid, params.refundTransactionId);
        const deductSnap = await tx.get(repo.transactionRef(params.uid, params.deductTransactionId));

        if (!deductSnap.exists) {
            return null;
        }

        if ((await tx.get(refundRef)).exists) {
            return {
                alreadyDone: true, apply: () => undefined,
            };
        }

        const deduct = pointTransactionDocSchema.parse(deductSnap.data());

        if (deduct.type !== 'DEDUCT') {
            throw new BusinessLogicError('Only a DEDUCT transaction can be refunded');
        }

        const batches: LoadedBatch[] = [];

        for (const allocation of deduct.batchAllocations) {
            const snap = await tx.get(repo.batchRef(params.uid, allocation.batchId));

            if (snap.exists) {
                batches.push({
                    id: allocation.batchId,
                    doc: pointBatchDocSchema.parse(snap.data()),
                });
            }
        }

        return {
            alreadyDone: false,
            apply: () => {
                const refundAllocations: PointTransactionDoc['batchAllocations'] = [];
                let orphaned = 0;

                for (const allocation of deduct.batchAllocations) {
                    const batch = batches.find((b) => b.id === allocation.batchId);

                    if (batch && (batch.doc.expiresAt === null || batch.doc.expiresAt > now)) {
                        tx.update(repo.batchRef(params.uid, batch.id), { remaining: batch.doc.remaining + allocation.amount });
                        refundAllocations.push(allocation);
                    } else {
                        orphaned += allocation.amount;
                    }
                }

                if (orphaned > 0) {
                    const refundBatchId = `refund_${params.refundTransactionId}`;
                    const refundBatch: PointBatchDoc = {
                        source: 'REFUND',
                        sourceRef: params.deductTransactionId,
                        granted: orphaned,
                        remaining: orphaned,
                        expiresAt: null,
                        createdAt: now,
                    };

                    tx.set(repo.batchRef(params.uid, refundBatchId), refundBatch);
                    refundAllocations.push({
                        batchId: refundBatchId, amount: orphaned,
                    });
                }

                const record: PointTransactionDoc = {
                    type: 'REFUND',
                    amount: deduct.amount,
                    reason: deduct.reason,
                    batchAllocations: refundAllocations,
                    reference: params.reference,
                    createdAt: now,
                };

                tx.set(refundRef, record);
            },
        };
    }

    /**
     * Plan crediting purchased points (used by the payment webhook).
     */
    async planGrant(tx: Transaction, params: GrantParams): Promise<PointPlan> {
        const repo = this.repository;
        const now = this.clock();
        const transactionRef = repo.transactionRef(params.uid, params.transactionId);

        if ((await tx.get(transactionRef)).exists) {
            return {
                alreadyDone: true, apply: () => undefined,
            };
        }

        return {
            alreadyDone: false,
            apply: () => {
                const batch: PointBatchDoc = {
                    source: params.source,
                    sourceRef: params.sourceRef,
                    granted: params.amount,
                    remaining: params.amount,
                    expiresAt: params.expiresAt,
                    createdAt: now,
                };
                const record: PointTransactionDoc = {
                    type: 'PURCHASE',
                    amount: params.amount,
                    reason: 'PURCHASE',
                    batchAllocations: [
                        {
                            batchId: params.batchId, amount: params.amount,
                        },
                    ],
                    reference: params.sourceRef,
                    createdAt: now,
                };

                tx.set(repo.batchRef(params.uid, params.batchId), batch);
                tx.set(transactionRef, record);
            },
        };
    }

    /**
     * Spend points in a transaction of their own (for flows with nothing else to write).
     * Returns false when this operation had already been charged.
     */
    async deduct(params: DeductParams): Promise<{ charged: boolean }> {
        return this.repository.runTransaction(async (tx) => {
            const plan = await this.planDeduction(tx, params);

            plan.apply();

            return { charged: !plan.alreadyDone };
        });
    }

    async refund(params: RefundParams): Promise<{ refunded: boolean }> {
        return this.repository.runTransaction(async (tx) => {
            const plan = await this.planRefund(tx, params);

            if (!plan) return { refunded: false };

            plan.apply();

            return { refunded: !plan.alreadyDone };
        });
    }
}
