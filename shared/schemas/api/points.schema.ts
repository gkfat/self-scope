import { z } from 'zod';
import { POINT_TRANSACTION_REASONS } from '../firestore/points.schema';

export const pointBatchItemSchema = z.object({
    batchId: z.string(),
    source: z.enum([
        'WELCOME',
        'PURCHASE',
        'REFUND',
    ]),
    granted: z.number().int(),
    remaining: z.number().int(),
    /** null: never expires */
    expiresAt: z.number().int().nullable(),
});

export const pointBalanceSchema = z.object({
    /** Sum of the remaining points of batches that have not expired. */
    availableBalance: z.number().int().nonnegative(),
    /** Usable batches in the order they will be spent. */
    batches: z.array(pointBatchItemSchema),
});

export const pointTransactionItemSchema = z.object({
    transactionId: z.string(),
    type: z.enum([
        'GRANT',
        'PURCHASE',
        'DEDUCT',
        'REFUND',
    ]),
    amount: z.number().int().positive(),
    reason: z.enum(POINT_TRANSACTION_REASONS),
    reference: z.string().nullable(),
    createdAt: z.number().int(),
});

export const pointTransactionListSchema = z.object({
    items: z.array(pointTransactionItemSchema),
    nextCursor: z.string().nullable(),
});

export const pointTransactionQuerySchema = z.object({
    cursor: z.string().regex(/^\d+$/).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PointBalance = z.infer<typeof pointBalanceSchema>;
export type PointTransactionList = z.infer<typeof pointTransactionListSchema>;
