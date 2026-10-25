import { z } from 'zod';
import {
    moneySchema, paymentStatusSchema,
} from '../firestore/payment.schema';

export const pointPackageItemSchema = z.object({
    packageId: z.string(),
    points: z.number().int(),
    price: moneySchema,
    validityDays: z.number().int().nullable(),
});

export const createPaymentRequestSchema = z.object({
    packageId: z.string().min(1),
    /** Must be exactly true: the buyer agreed to immediate delivery and no refund. */
    acceptDigitalContentTerms: z.literal(true),
    termsVersion: z.string().min(1),
});

export const checkoutSessionSchema = z.object({
    paymentId: z.string(),
    checkoutUrl: z.string(),
    noRefundNotice: z.string(),
});

export const paymentItemSchema = z.object({
    paymentId: z.string(),
    pointsPurchased: z.number().int(),
    amount: moneySchema,
    status: paymentStatusSchema,
    createdAt: z.number().int(),
});

export const webhookAckSchema = z.object({ received: z.literal(true) });

export type PointPackageItem = z.infer<typeof pointPackageItemSchema>;
export type CreatePaymentRequest = z.infer<typeof createPaymentRequestSchema>;
export type CheckoutSessionResponse = z.infer<typeof checkoutSessionSchema>;
export type PaymentItem = z.infer<typeof paymentItemSchema>;
