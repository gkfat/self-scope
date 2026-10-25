export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    devtools: { enabled: false },
    modules: ['@nuxt/eslint'],

    app: {
        head: {
            charset: 'utf-8',
            viewport: 'width=device-width, initial-scale=1',
            htmlAttrs: { lang: 'zh-TW' },
            link: [
                {
                    rel: 'preconnect', href: 'https://fonts.googleapis.com',
                },
                {
                    rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '',
                },
                {
                    rel: 'stylesheet',
                    href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap',
                },
            ],
        },
    },

    // SPA mode for Vercel deployment
    ssr: false,

    css: [
        'vuetify/lib/styles/main.sass',
        '@mdi/font/css/materialdesignicons.min.css',
    ],

    build: { transpile: ['vuetify'] },

    // Vercel deployment preset
    nitro: { preset: 'vercel' },

    /**
     * Env handling:
     * - Private runtimeConfig keys are server-only
     * - runtimeConfig.public keys are exposed to client bundle
     *
     * Nuxt automatically loads `.env`.
     */
    runtimeConfig: {
        // Server-only configuration
        firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
        firestoreEmulatorHost: process.env.FIRESTORE_EMULATOR_HOST,
        // Shared secret Vercel Cron sends as `Authorization: Bearer $CRON_SECRET`
        cronSecret: process.env.CRON_SECRET,
        // HMAC key for the welcome-grant ledger (Google uid is never stored raw)
        welcomeGrantHmacKey: process.env.WELCOME_GRANT_HMAC_KEY,
        // Payment provider id; 'dev' (local only) until a real provider is chosen
        paymentProvider: process.env.PAYMENT_PROVIDER,
        paymentDevWebhookSecret: process.env.PAYMENT_DEV_WEBHOOK_SECRET,

        // Public configuration (exposed to client)
        public: {
            firebaseApiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY || '',
            firebaseAuthDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
            firebaseProjectId:
                process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID ||
                process.env.FIREBASE_PROJECT_ID ||
                '',
            firebaseStorageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
            firebaseMessagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
            firebaseAppId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID || '',
        },
    },
});
