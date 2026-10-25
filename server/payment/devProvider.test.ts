import {
    describe, expect, it,
} from 'vitest';
import {
    DEV_SIGNATURE_HEADER, DevPaymentProvider, signDevPayload,
} from './devProvider';
import { AuthError } from '../../shared/types/errors';

const SECRET = 'dev-secret';
const body = JSON.stringify({
    eventId: 'evt1',
    type: 'PAYMENT_SUCCEEDED',
    paymentId: 'p1',
    userId: 'u1',
    providerSessionId: 'dev_p1',
});

describe('DevPaymentProvider.verifyWebhook', () => {
    const provider = new DevPaymentProvider(SECRET);

    it('accepts a correctly signed event', () => {
        const event = provider.verifyWebhook(body, { [DEV_SIGNATURE_HEADER]: signDevPayload(body, SECRET) });

        expect(event).toEqual({
            eventId: 'evt1',
            type: 'PAYMENT_SUCCEEDED',
            paymentId: 'p1',
            userId: 'u1',
            providerSessionId: 'dev_p1',
        });
    });

    it('rejects a missing signature', () => {
        expect(() => provider.verifyWebhook(body, {})).toThrow(AuthError);
    });

    it('rejects a signature made with another secret', () => {
        expect(() => provider.verifyWebhook(body, { [DEV_SIGNATURE_HEADER]: signDevPayload(body, 'other') })).toThrow(AuthError);
    });

    it('rejects a body that was changed after signing', () => {
        const signature = signDevPayload(body, SECRET);
        const tampered = body.replace('u1', 'u2');

        expect(() => provider.verifyWebhook(tampered, { [DEV_SIGNATURE_HEADER]: signature })).toThrow(AuthError);
    });

    it('rejects a signed but malformed event', () => {
        const malformed = JSON.stringify({ eventId: '' });

        expect(() => provider.verifyWebhook(malformed, { [DEV_SIGNATURE_HEADER]: signDevPayload(malformed, SECRET) })).toThrow(AuthError);
    });
});
