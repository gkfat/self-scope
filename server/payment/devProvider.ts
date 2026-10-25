import {
    createHmac, timingSafeEqual,
} from 'node:crypto';
import { z } from 'zod';
import type {
    CheckoutRequest, CheckoutSession, PaymentProvider, VerifiedWebhookEvent,
} from './provider';
import { AuthError } from '../../shared/types/errors';

const eventSchema = z.object({
    eventId: z.string().min(1),
    type: z.enum(['PAYMENT_SUCCEEDED', 'PAYMENT_FAILED']),
    paymentId: z.string().nullable().default(null),
    userId: z.string().nullable().default(null),
    providerSessionId: z.string().nullable().default(null),
});

export const DEV_SIGNATURE_HEADER = 'x-dev-signature';

export function signDevPayload(rawBody: string, secret: string): string {
    return createHmac('sha256', secret).update(rawBody).digest('hex');
}

/**
 * Local-only stand-in for a payment service, so the whole purchase flow can be
 * exercised before a real provider is chosen. It signs webhooks with an HMAC
 * of the raw body. The factory refuses to build it in production.
 */
export class DevPaymentProvider implements PaymentProvider {
    constructor(private readonly secret: string) {}

    async createCheckout(request: CheckoutRequest): Promise<CheckoutSession> {
        return {
            providerSessionId: `dev_${request.paymentId}`,
            checkoutUrl: `/purchase?devPayment=${request.paymentId}`,
        };
    }

    verifyWebhook(rawBody: string, headers: Record<string, string | undefined>): VerifiedWebhookEvent {
        const received = headers[DEV_SIGNATURE_HEADER];

        if (!received) {
            throw new AuthError('Missing webhook signature');
        }

        const expected = Buffer.from(signDevPayload(rawBody, this.secret));
        const actual = Buffer.from(received);

        if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
            throw new AuthError('Invalid webhook signature');
        }

        const parsed = eventSchema.safeParse(JSON.parse(rawBody));

        if (!parsed.success) {
            throw new AuthError('Malformed webhook event');
        }

        return parsed.data;
    }
}
