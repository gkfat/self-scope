import { z } from 'zod';
import { epochMsSchema } from '../common';

/** users/{uid}/pointAccount/main */
export const pointAccountDocSchema = z.object({
    userId: z.string(),
    /** Set when the welcome grant was given (RULE-009); null when it was withheld (RULE-031). */
    welcomeGrantedAt: epochMsSchema.nullable(),
    createdAt: epochMsSchema,
});

/** users/{uid}/pointBatches/{batchId} */
export const pointBatchDocSchema = z.object({
    // REFUND: points returned after a failed generation whose original batch has since expired.
    source: z.enum([
        'WELCOME',
        'PURCHASE',
        'REFUND',
    ]),
    /** Purchase batches point to their paymentId. */
    sourceRef: z.string().nullable(),
    granted: z.number().int().positive(),
    remaining: z.number().int().nonnegative(),
    /** null means the batch never expires (purchased points). */
    expiresAt: epochMsSchema.nullable(),
    createdAt: epochMsSchema,
});

export const POINT_TRANSACTION_REASONS = [
    'WELCOME',
    'SINGLE_AI_ANALYSIS',
    'MULTI_REPORT',
    'PURCHASE',
] as const;

/** users/{uid}/pointTransactions/{transactionId} (deterministic id = idempotency key) */
export const pointTransactionDocSchema = z.object({
    type: z.enum([
        'GRANT',
        'PURCHASE',
        'DEDUCT',
        'REFUND',
    ]),
    amount: z.number().int().positive(),
    reason: z.enum(POINT_TRANSACTION_REASONS),
    batchAllocations: z.array(z.object({
        batchId: z.string(),
        amount: z.number().int().positive(),
    })),
    reference: z.string().nullable(),
    createdAt: epochMsSchema,
});

export type PointAccountDoc = z.infer<typeof pointAccountDocSchema>;
export type PointBatchDoc = z.infer<typeof pointBatchDocSchema>;
export type PointTransactionDoc = z.infer<typeof pointTransactionDocSchema>;
