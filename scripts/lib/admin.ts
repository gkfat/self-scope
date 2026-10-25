import {
    applicationDefault, cert, getApps, initializeApp,
} from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import { loadServiceAccount } from '../../server/utils/serviceAccount.ts';

/**
 * Firestore for command-line scripts (outside Nitro, so no runtime config).
 * Credentials come from the same place as the app: FIREBASE_SERVICE_ACCOUNT_KEY,
 * FIREBASE_SERVICE_ACCOUNT_FILE or ./service_account.json; otherwise application
 * default credentials. The project id defaults to the key's own project.
 * FIRESTORE_EMULATOR_HOST is honoured by the SDK.
 */
export function getScriptFirestore(): Firestore {
    const existing = getApps()[0];

    if (existing) return getFirestore(existing);

    const serviceAccount = loadServiceAccount();
    const projectId = process.env.FIREBASE_PROJECT_ID ?? serviceAccount?.project_id;

    if (!projectId) {
        throw new Error('No Firebase project: add service_account.json or set FIREBASE_PROJECT_ID');
    }

    return getFirestore(initializeApp({
        projectId,
        credential: serviceAccount ? cert(serviceAccount) : applicationDefault(),
    }));
}
