import OpenAI from 'openai';
import { OpenAiReportProvider } from './openaiProvider';
import { getServerConfig } from '../../config/config';
import { REPORT_MAX_OUTPUT_TOKENS } from '../../shared/constants/ai';
import { ExternalServiceError } from '../../shared/types/errors';

/**
 * The configured AI provider. Fails with a clear error (and the service refunds) when no key is set,
 * instead of producing a made-up report.
 */
export function getAiProvider(): OpenAiReportProvider {
    const {
        openaiApiKey, openaiModel,
    } = getServerConfig();

    if (!openaiApiKey) {
        throw new ExternalServiceError('ai', 'no AI provider is configured');
    }

    return new OpenAiReportProvider({
        // The SDK retries transient failures itself; the service bounds the total time.
        client: new OpenAI({
            apiKey: openaiApiKey, maxRetries: 1,
        }),
        model: openaiModel,
        maxOutputTokens: REPORT_MAX_OUTPUT_TOKENS,
    });
}
