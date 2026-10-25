import { DevPaymentProvider } from './devProvider';
import type { PaymentProvider } from './provider';
import {
    getServerConfig, requireServerSecret,
} from '../../config/config';
import { ExternalServiceError } from '../../shared/types/errors';

/**
 * The configured payment provider. Fails loudly when none is configured instead
 * of pretending a payment worked. Add real providers here once one is chosen.
 */
export function getPaymentProvider(): PaymentProvider {
    const {
        paymentProvider, nodeEnv, 
    } = getServerConfig();

    if (paymentProvider === 'dev') {
        if (nodeEnv === 'production') {
            throw new ExternalServiceError('payment', 'the dev payment provider is not allowed in production');
        }

        return new DevPaymentProvider(requireServerSecret('paymentDevWebhookSecret'));
    }

    throw new ExternalServiceError('payment', 'no payment provider is configured');
}
