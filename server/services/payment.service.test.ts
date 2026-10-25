import {
    beforeEach, describe, expect, it, vi,
} from 'vitest';
import { FakeFirestore } from '../test-utils/fakeFirestore';
import { PaymentService } from './payment.service';
import { PointService } from './point.service';
import type {
    CheckoutRequest, PaymentProvider, VerifiedWebhookEvent,
} from '../payment/provider';
import { DIGITAL_CONTENT_TERMS_VERSION } from '../../shared/constants/terms';
import {
    ExternalServiceError, NotFoundError, ValidationError,
} from '../../shared/types/errors';

const holder = vi.hoisted(() => ({ db: undefined as unknown }));

vi.mock('../utils/firebaseAdmin', () => ({ getAdminFirestore: () => holder.db }));

const NOW = Date.UTC(2026, 0, 15, 12);

class FakeProvider implements PaymentProvider {
    requests: CheckoutRequest[] = [];
    fail = false;

    async createCheckout(request: CheckoutRequest) {
        if (this.fail) throw new Error('provider down');
        this.requests.push(request);

        return {
            providerSessionId: `sess_${request.paymentId}`,
            checkoutUrl: `https://pay.example/${request.paymentId}`,
        };
    }

    verifyWebhook(): VerifiedWebhookEvent {
        throw new Error('not used in these tests');
    }
}

const request = (overrides = {}) => ({
    packageId: 'small',
    acceptDigitalContentTerms: true as const,
    termsVersion: DIGITAL_CONTENT_TERMS_VERSION,
    ...overrides,
});

const event = (overrides: Partial<VerifiedWebhookEvent> = {}): VerifiedWebhookEvent => ({
    eventId: 'evt1',
    type: 'PAYMENT_SUCCEEDED',
    paymentId: 'pay1',
    userId: 'u1',
    providerSessionId: 'sess_pay1',
    ...overrides,
});

describe('PaymentService', () => {
    let db: FakeFirestore;
    let provider: FakeProvider;
    let service: PaymentService;
    let ids: string[];

    beforeEach(async () => {
        db = new FakeFirestore();
        holder.db = db;
        provider = new FakeProvider();
        ids = [
            'pay1',
            'pay2',
            'pay3',
        ];
        service = new PaymentService({
            getProvider: () => provider,
            points: new PointService({ clock: () => NOW }),
            clock: () => NOW,
            newId: () => ids.shift() as string,
        });

        await db.doc('pointPackages/small').set({
            points: 10, price: {
                amount: 100, currency: 'TWD', 
            }, validityDays: null, active: true,
        });
        await db.doc('pointPackages/big').set({
            points: 50, price: {
                amount: 400, currency: 'TWD', 
            }, validityDays: null, active: true,
        });
        await db.doc('pointPackages/old').set({
            points: 5, price: {
                amount: 60, currency: 'TWD', 
            }, validityDays: null, active: false,
        });
    });

    describe('listPackages', () => {
        it('lists only active packages, smallest first', async () => {
            expect((await service.listPackages()).map((p) => p.packageId)).toEqual(['small', 'big']);
        });
    });

    describe('createPayment', () => {
        it('stores a pending payment with the buyer\'s consent and returns the checkout', async () => {
            const session = await service.createPayment('u1', request());

            expect(session).toMatchObject({
                paymentId: 'pay1', checkoutUrl: 'https://pay.example/pay1',
            });
            expect(session.noRefundNotice).toContain('不退款');

            expect((await db.doc('users/u1/payments/pay1').get()).data()).toMatchObject({
                packageId: 'small',
                pointsPurchased: 10,
                status: 'PENDING',
                providerSessionId: 'sess_pay1',
                consentRecordedAt: NOW,
                consentTermsVersion: DIGITAL_CONTENT_TERMS_VERSION,
            });
            expect(provider.requests[0]).toMatchObject({
                paymentId: 'pay1', userId: 'u1', points: 10,
            });
        });

        it('rejects terms of an older version without creating anything', async () => {
            await expect(service.createPayment('u1', request({ termsVersion: 'old' }))).rejects.toBeInstanceOf(ValidationError);

            expect(db.paths().filter((p) => p.includes('/payments/'))).toEqual([]);
            expect(provider.requests).toEqual([]);
        });

        it('rejects an unknown or inactive package', async () => {
            await expect(service.createPayment('u1', request({ packageId: 'nope' }))).rejects.toBeInstanceOf(NotFoundError);
            await expect(service.createPayment('u1', request({ packageId: 'old' }))).rejects.toBeInstanceOf(NotFoundError);
        });

        it('marks the payment failed when the provider cannot start a checkout', async () => {
            provider.fail = true;

            await expect(service.createPayment('u1', request())).rejects.toBeInstanceOf(ExternalServiceError);

            expect((await db.doc('users/u1/payments/pay1').get()).data()?.status).toBe('FAILED');
        });
    });

    describe('handleWebhookEvent', () => {
        beforeEach(async () => {
            await service.createPayment('u1', request());
        });

        const balance = async () => new PointService({ clock: () => NOW }).getBalance('u1');
        const payment = async () => (await db.doc('users/u1/payments/pay1').get()).data();

        it('credits the purchased points once and completes the payment', async () => {
            expect(await service.handleWebhookEvent(event())).toBe('applied');

            expect((await balance()).availableBalance).toBe(10);
            expect(await payment()).toMatchObject({
                status: 'COMPLETED', processedEventIds: ['evt1'],
            });
            expect((await balance()).batches[0]).toMatchObject({
                source: 'PURCHASE', expiresAt: null,
            });
        });

        it('ignores a repeated event', async () => {
            await service.handleWebhookEvent(event());

            expect(await service.handleWebhookEvent(event())).toBe('duplicate');
            expect((await balance()).availableBalance).toBe(10);
        });

        it('does not credit twice when the provider sends a different event for the same payment', async () => {
            await service.handleWebhookEvent(event());
            await service.handleWebhookEvent(event({ eventId: 'evt2' }));

            expect((await balance()).availableBalance).toBe(10);
            expect((await payment())?.processedEventIds).toEqual(['evt1', 'evt2']);
        });

        it('credits once when the same event arrives concurrently', async () => {
            const outcomes = await Promise.all([
                service.handleWebhookEvent(event()),
                service.handleWebhookEvent(event()),
                service.handleWebhookEvent(event()),
            ]);

            expect(outcomes.filter((o) => o === 'applied')).toHaveLength(1);
            expect((await balance()).availableBalance).toBe(10);
        });

        it('marks a pending payment failed without touching points', async () => {
            expect(await service.handleWebhookEvent(event({ type: 'PAYMENT_FAILED' }))).toBe('applied');

            expect((await payment())?.status).toBe('FAILED');
            expect((await balance()).availableBalance).toBe(0);
        });

        it('lets a later success complete a payment that had failed', async () => {
            await service.handleWebhookEvent(event({
                eventId: 'evt1', type: 'PAYMENT_FAILED',
            }));
            await service.handleWebhookEvent(event({ eventId: 'evt2' }));

            expect((await payment())?.status).toBe('COMPLETED');
            expect((await balance()).availableBalance).toBe(10);
        });

        it('never turns a completed payment into a failed one', async () => {
            await service.handleWebhookEvent(event());
            await service.handleWebhookEvent(event({
                eventId: 'evt9', type: 'PAYMENT_FAILED',
            }));

            expect((await payment())?.status).toBe('COMPLETED');
            expect((await balance()).availableBalance).toBe(10);
        });

        it('records an event that has no user or payment instead of losing it', async () => {
            const outcome = await service.handleWebhookEvent(event({
                eventId: 'evtX', userId: null, paymentId: null,
            }));

            expect(outcome).toBe('unmatched');
            expect((await db.doc('unmatchedPaymentEvents/evtX').get()).data()).toMatchObject({
                type: 'PAYMENT_SUCCEEDED', providerSessionId: 'sess_pay1',
            });
        });

        it('records an event for a payment that does not exist', async () => {
            const outcome = await service.handleWebhookEvent(event({
                eventId: 'evtY', paymentId: 'ghost',
            }));

            expect(outcome).toBe('unmatched');
            expect((await db.doc('unmatchedPaymentEvents/evtY').get()).exists).toBe(true);
            expect((await balance()).availableBalance).toBe(0);
        });
    });

    describe('listPayments', () => {
        it('returns only the member\'s own payments, newest first', async () => {
            await service.createPayment('u1', request());
            await service.createPayment('u2', request());

            const payments = await service.listPayments('u1');

            expect(payments.map((p) => p.paymentId)).toEqual(['pay1']);
            expect(payments[0]).toMatchObject({
                status: 'PENDING', pointsPurchased: 10,
            });
        });
    });
});
