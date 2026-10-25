import type { Money } from '../../shared/schemas/firestore/payment.schema';

/**
 * What the app needs from a payment service. A concrete provider (not chosen
 * yet) implements this; nothing above this file knows which one it is.
 */
export type CheckoutRequest = {
    paymentId: string;
    userId: string;
    packageId: string;
    points: number;
    amount: Money;
};

export type CheckoutSession = {
    providerSessionId: string;
    checkoutUrl: string;
};

/**
 * A webhook the provider signed. paymentId and userId come from the metadata
 * we attached when the checkout was created.
 */
export type VerifiedWebhookEvent = {
    eventId: string;
    type: 'PAYMENT_SUCCEEDED' | 'PAYMENT_FAILED';
    paymentId: string | null;
    userId: string | null;
    providerSessionId: string | null;
};

export type PaymentProvider = {
    createCheckout(request: CheckoutRequest): Promise<CheckoutSession>;
    /**
     * Verify the signature over the raw request body and parse the event.
     * MUST throw AuthError when the signature is missing or wrong (NFR-004).
     */
    verifyWebhook(rawBody: string, headers: Record<string, string | undefined>): VerifiedWebhookEvent;
};
