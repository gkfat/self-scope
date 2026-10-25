import {
    defineEventHandler, getHeaders, readRawBody,
} from 'h3';
import { webhookAckSchema } from '../../../shared/schemas/api/payment.schema';
import { getPaymentProvider } from '../../payment';
import { PaymentService } from '../../services/payment.service';
import { toH3Error } from '../../utils/errorHandler';
import { logEvent } from '../../utils/logger';
import { AuthError } from '../../../shared/types/errors';

/**
 * Payment provider webhook. Not covered by Firebase auth: the provider's
 * signature over the raw body is the credential (NFR-004).
 */
export default defineEventHandler(async (event) => {
    try {
        const rawBody = await readRawBody(event, 'utf8') ?? '';
        const verified = (() => {
            try {
                return getPaymentProvider().verifyWebhook(rawBody, getHeaders(event));
            } catch (error) {
                if (error instanceof AuthError) {
                    // Never log the body: it may carry payer data.
                    logEvent({
                        severity: 'WARNING',
                        message: 'rejected payment webhook',
                        module: 'payment',
                        action: 'webhook',
                        data: { reason: error.message },
                    });
                }

                throw error;
            }
        })();

        await new PaymentService().handleWebhookEvent(verified);

        return webhookAckSchema.parse({ received: true });
    } catch (error) {
        throw toH3Error(error);
    }
});
