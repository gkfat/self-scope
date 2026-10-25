import {
    initializeApp, type FirebaseApp,
} from 'firebase/app';
import {
    getAuth, type Auth,
} from 'firebase/auth';
import { getPublicConfig } from '../../config/config';

/**
 * Firebase Client SDK (Auth only). Firestore is never accessed from the client.
 */
export default defineNuxtPlugin(() => {
    const { firebase: firebaseConfig } = getPublicConfig();

    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        console.error('[Firebase] Missing NUXT_PUBLIC_FIREBASE_API_KEY or NUXT_PUBLIC_FIREBASE_PROJECT_ID.');
        throw new Error('Firebase Client init failed');
    }

    let app: FirebaseApp;
    let auth: Auth;

    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        auth.languageCode = 'zh-TW';
    } catch (error) {
        console.error('[Firebase] Initialization failed:', error);
        throw new Error('Firebase Client init failed', { cause: error });
    }

    return {
        provide: {
            firebaseApp: app,
            firebaseAuth: auth,
        },
    };
});
