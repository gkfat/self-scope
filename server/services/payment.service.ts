import { randomUUID } from 'node:crypto';
import { BaseService } from './base.service';
import { PointService } from './point.service';
import { PaymentRepository } from '../repositories/payment.repository';
import type {
    PaymentProvider, VerifiedWebhookEvent,
} from '../payment/provider';
import { getPaymentProvider } from '../payment';
import {
    paymentDocSchema, pointPackageDocSchema,
    type PaymentDoc,
} from '../../shared/schemas/firestore/payment.schema';
import type {
    CheckoutSessionResponse, CreatePaymentRequest, PaymentItem, PointPackageItem,
} from '../../shared/schemas/api/payment.schema';
import {
    DIGITAL_CONTENT_TERMS_VERSION, NO_REFUND_NOTICE,
} from '../../shared/constants/terms';
import {
    ExternalServiceError, NotFoundError, ValidationError, errorMessage,
} from '../../shared/types/errors';

const PAYMENT_LIST_LIMIT = 50;

type PaymentServiceOptions = {
    repository?: PaymentRepository;
    points?: PointService;
    /** Resolved lazily so listing packages works without a provider configured. */
    getProvider?: () => PaymentProvider;
    clock?: () => number;
    newId?: () => string;
};

export type WebhookOutcome = 'applied' | 'duplicate' | 'unmatched' | 'ignored';

export class PaymentService extends BaseService {
    protected serviceName = 'payment';

    private readonly repository: PaymentRepository;
    private readonly points: PointService;
    private readonly getProvider: () => PaymentProvider;
    private readonly clock: () => number;
    private readonly newId: () => string;

    constructor(options: PaymentServiceOptions = {}) {
        super();
        this.repository = options.repository ?? new PaymentRepository();
        this.points = options.points ?? new PointService({ clock: options.clock });
        this.getProvider = options.getProvider ?? getPaymentProvider;
        this.clock = options.clock ?? Date.now;
        this.newId = options.newId ?? randomUUID;
    }

    async listPackages(): Promise<PointPackageItem[]> {
        const snap = await this.repository.packagesRef().where('active', '==', true).get();

        return snap.docs
            .map((doc) => ({
                packageId: doc.id,
                doc: pointPackageDocSchema.parse(doc.data()),
            }))
            .sort((a, b) => a.doc.points - b.doc.points)
            .map(({
                packageId, doc, 
            }) => ({
                packageId,
                points: doc.points,
                price: doc.price,
                validityDays: doc.validityDays,
            }));
    }

    /**
     * Start a purchase. The buyer must have agreed to immediate delivery and no
     * refund, to the current wording of the terms; that agreement is stored with
     * the payment (RULE-012).
     */
    async createPayment(uid: string, request: CreatePaymentRequest): Promise<CheckoutSessionResponse> {
        if (request.termsVersion !== DIGITAL_CONTENT_TERMS_VERSION) {
            throw new ValidationError('The purchase terms have changed; reload the page and agree again', { currentTermsVersion: DIGITAL_CONTENT_TERMS_VERSION });
        }

        const pointPackage = await this.repository.packageRef(request.packageId).get();

        if (!pointPackage.exists) {
            throw new NotFoundError('Point package');
        }

        const pack = pointPackageDocSchema.parse(pointPackage.data());

        if (!pack.active) {
            throw new NotFoundError('Point package');
        }

        const provider = this.getProvider();
        const now = this.clock();
        const paymentId = this.newId();
        const ref = this.repository.paymentRef(uid, paymentId);

        const payment: PaymentDoc = {
            packageId: request.packageId,
            pointsPurchased: pack.points,
            amount: pack.price,
            status: 'PENDING',
            providerSessionId: null,
            processedEventIds: [],
            consentRecordedAt: now,
            consentTermsVersion: request.termsVersion,
            createdAt: now,
            updatedAt: now,
        };

        await ref.set(payment);

        try {
            const session = await provider.createCheckout({
                paymentId,
                userId: uid,
                packageId: request.packageId,
                points: pack.points,
                amount: pack.price,
            });

            await ref.update({
                providerSessionId: session.providerSessionId,
                updatedAt: this.clock(),
            });

            return {
                paymentId,
                checkoutUrl: session.checkoutUrl,
                noRefundNotice: NO_REFUND_NOTICE,
            };
        } catch (error) {
            this.logError('failed to create checkout', {
                action: 'createPayment',
                userId: uid,
                data: { paymentId },
                error,
            });
            await ref.update({
                status: 'FAILED', updatedAt: this.clock(),
            });

            throw new ExternalServiceError('payment', errorMessage(error));
        }
    }

    async listPayments(uid: string): Promise<PaymentItem[]> {
        const snap = await this.repository.paymentsRef(uid)
            .orderBy('createdAt', 'desc')
            .limit(PAYMENT_LIST_LIMIT)
            .get();

        return snap.docs.map((doc) => {
            const payment = paymentDocSchema.parse(doc.data());

            return {
                paymentId: doc.id,
                pointsPurchased: payment.pointsPurchased,
                amount: payment.amount,
                status: payment.status,
                createdAt: payment.createdAt,
            };
        });
    }

    /**
     * Apply a signature-verified provider event (the caller has already verified it).
     * - success: credit the points once, whatever the event id (the credit has its own deterministic id)
     * - failure: mark a pending payment failed, never touching points
     * - repeated event id: no effect
     * - cannot be tied to a payment: recorded for follow-up, never lost (FR-012)
     */
    async handleWebhookEvent(event: VerifiedWebhookEvent): Promise<WebhookOutcome> {
        if (!event.userId || !event.paymentId) {
            await this.recordUnmatched(event);
            return 'unmatched';
        }

        const {
            userId: uid, paymentId, 
        } = event;
        const repo = this.repository;
        const now = this.clock();

        const outcome = await repo.runTransaction(async (tx): Promise<WebhookOutcome | 'missing'> => {
            const ref = repo.paymentRef(uid, paymentId);
            const snap = await tx.get(ref);

            if (!snap.exists) {
                return 'missing';
            }

            const payment = paymentDocSchema.parse(snap.data());

            if (payment.processedEventIds.includes(event.eventId)) {
                return 'duplicate';
            }

            const processedEventIds = [...payment.processedEventIds, event.eventId];

            if (event.type === 'PAYMENT_FAILED') {
                // A failure never undoes a payment that already completed.
                tx.update(ref, {
                    status: payment.status === 'COMPLETED' ? 'COMPLETED' : 'FAILED',
                    processedEventIds,
                    updatedAt: now,
                });
                return payment.status === 'COMPLETED' ? 'ignored' : 'applied';
            }

            const plan = await this.points.planGrant(tx, {
                uid,
                amount: payment.pointsPurchased,
                source: 'PURCHASE',
                sourceRef: paymentId,
                batchId: `purchase_${paymentId}`,
                transactionId: `purchase_${paymentId}`,
                expiresAt: null,
            });

            plan.apply();
            tx.update(ref, {
                status: 'COMPLETED',
                processedEventIds,
                updatedAt: now,
            });

            return plan.alreadyDone ? 'ignored' : 'applied';
        });

        if (outcome === 'missing') {
            await this.recordUnmatched(event);
            return 'unmatched';
        }

        this.logInfo('payment event handled', {
            action: 'handleWebhookEvent',
            userId: uid,
            data: {
                outcome, type: event.type, paymentId,
            },
        });

        return outcome;
    }

    private async recordUnmatched(event: VerifiedWebhookEvent): Promise<void> {
        await this.repository.unmatchedEventRef(event.eventId).set({
            type: event.type,
            providerSessionId: event.providerSessionId,
            receivedAt: this.clock(),
        });

        // Needs a human: the provider took (or failed) a payment we cannot attribute.
        this.logError('payment event could not be matched', {
            action: 'handleWebhookEvent',
            data: {
                eventId: event.eventId, type: event.type,
            },
        });
    }
}
