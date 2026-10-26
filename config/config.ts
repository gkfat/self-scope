import {
    DEFAULT_AI_PRICE_INPUT_PER_MTOK,
    DEFAULT_AI_PRICE_OUTPUT_PER_MTOK,
    DEFAULT_OPENAI_MODEL,
} from '../shared/constants/ai';

/**
 * Server-only configuration
 * Contains sensitive data that should NEVER be exposed to client
 */
type ServerConfig = {
    /**
     * Server-only Firebase project id.
     * Prefer setting this explicitly to avoid accidentally using a wrong Firebase project.
     */
    firebaseProjectId?: string;

    /** When set, firebase-admin / firestore client should connect to emulator. */
    firestoreEmulatorHost?: string;

    /** Shared secret that Vercel Cron sends as a Bearer token. */
    cronSecret?: string;

    /** HMAC key for the welcome-grant ledger. */
    welcomeGrantHmacKey?: string;

    /** Which payment provider to use ('dev' is only honoured outside production). */
    paymentProvider?: string;

    /** Shared secret of the development payment provider's webhook signature. */
    paymentDevWebhookSecret?: string;

    /** OpenAI API key (server-only). */
    openaiApiKey?: string;

    /** OpenAI model id used for detailed reports. */
    openaiModel: string;

    /** USD per million tokens, used only to estimate cost in usage records. */
    aiPriceInputPerMtok: number;
    aiPriceOutputPerMtok: number;

    nodeEnv: string;
};

/**
 * Public configuration - Safe to expose to client bundle
 *
 * Note: Firebase client config (apiKey, authDomain, etc.) is designed to be public.
 * Real security is enforced by:
 * - Server-side token verification (Firebase Admin SDK)
 * - Firestore Security Rules (deny all client access)
 * - Firebase Console: Authorized domains
 */
type PublicConfig = {
    /** Firebase Project ID */
    firebaseProjectId?: string;

    /** Firebase Client SDK Configuration */
    firebase: {
        apiKey: string;
        authDomain: string;
        projectId: string;
        storageBucket: string;
        messagingSenderId: string;
        appId: string;
    };
};

/**
 * Get server-only configuration
 * @throws Error if called on client side
 */
export function getServerConfig(): ServerConfig {
    if (import.meta.client) {
        throw new Error('getServerConfig() must not be called on client.');
    }

    const runtimeConfig = useRuntimeConfig();

    return {
        firebaseProjectId: runtimeConfig.firebaseProjectId || undefined,
        firestoreEmulatorHost: runtimeConfig.firestoreEmulatorHost || undefined,
        cronSecret: runtimeConfig.cronSecret || undefined,
        welcomeGrantHmacKey: runtimeConfig.welcomeGrantHmacKey || undefined,
        paymentProvider: runtimeConfig.paymentProvider || undefined,
        paymentDevWebhookSecret: runtimeConfig.paymentDevWebhookSecret || undefined,
        openaiApiKey: runtimeConfig.openaiApiKey || undefined,
        openaiModel: runtimeConfig.openaiModel || DEFAULT_OPENAI_MODEL,
        aiPriceInputPerMtok: Number(runtimeConfig.aiPriceInputPerMtok) || DEFAULT_AI_PRICE_INPUT_PER_MTOK,
        aiPriceOutputPerMtok: Number(runtimeConfig.aiPriceOutputPerMtok) || DEFAULT_AI_PRICE_OUTPUT_PER_MTOK,
        nodeEnv: process.env.NODE_ENV || 'development',
    };
}

/**
 * Get a required server secret or fail loudly.
 * Never fall back to a default: a missing secret must be an explicit error.
 */
export function requireServerSecret(name: 'cronSecret' | 'welcomeGrantHmacKey' | 'paymentDevWebhookSecret' | 'openaiApiKey'): string {
    const value = getServerConfig()[name];

    if (!value) {
        throw new Error(`Missing required server config: ${name}`);
    }

    return value;
}

/**
 * Get public configuration (safe for client use)
 * Can be called from both server and client
 */
export function getPublicConfig(): PublicConfig {
    const runtimeConfig = useRuntimeConfig();

    return {
        firebaseProjectId: runtimeConfig.public.firebaseProjectId || undefined,
        firebase: {
            apiKey: runtimeConfig.public.firebaseApiKey || '',
            authDomain: runtimeConfig.public.firebaseAuthDomain || '',
            projectId: runtimeConfig.public.firebaseProjectId || '',
            storageBucket: runtimeConfig.public.firebaseStorageBucket || '',
            messagingSenderId: runtimeConfig.public.firebaseMessagingSenderId || '',
            appId: runtimeConfig.public.firebaseAppId || '',
        },
    };
}
