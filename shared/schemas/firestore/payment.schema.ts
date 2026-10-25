import { z } from 'zod';
import { epochMsSchema } from '../common.ts';

export const moneySchema = z.object({
    amount: z.number().positive(),
    currency: z.string().length(3),
});

export const PAYMENT_STATUSES = [
    'PENDING',
    'COMPLETED',
    'FAILED',
] as const;

export const paymentStatusSchema = z.enum(PAYMENT_STATUSES);

/** pointPackages/{packageId}: prices are data so they change without a deploy. */
export const pointPackageDocSchema = z.object({
    points: z.number().int().positive(),
    price: moneySchema,
    /** Purchased points never expire, so this is null today. */
    validityDays: z.number().int().positive().nullable(),
    active: z.boolean(),
});

/** users/{uid}/payments/{paymentId}; kept for the life of the account (RULE-015). */
export const paymentDocSchema = z.object({
    packageId: z.string(),
    pointsPurchased: z.number().int().positive(),
    amount: moneySchema,
    status: paymentStatusSchema,
    providerSessionId: z.string().nullable(),
    /** Provider event ids already applied: makes the webhook idempotent (RULE-011). */
    processedEventIds: z.array(z.string()),
    /** When the buyer agreed to immediate delivery and no refund, and to which wording. */
    consentRecordedAt: epochMsSchema,
    consentTermsVersion: z.string().min(1),
    createdAt: epochMsSchema,
    updatedAt: epochMsSchema,
});

/** unmatchedPaymentEvents/{eventId}: provider events we could not tie to a payment, for ops follow-up. */
export const unmatchedPaymentEventSchema = z.object({
    type: z.enum(['PAYMENT_SUCCEEDED', 'PAYMENT_FAILED']),
    providerSessionId: z.string().nullable(),
    receivedAt: epochMsSchema,
});

export type Money = z.infer<typeof moneySchema>;
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
export type PointPackageDoc = z.infer<typeof pointPackageDocSchema>;
export type PaymentDoc = z.infer<typeof paymentDocSchema>;
