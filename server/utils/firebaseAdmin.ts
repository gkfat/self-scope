import {
    getApps, initializeApp, applicationDefault, cert, type App,
} from 'firebase-admin/app';
import {
    getFirestore, type Firestore,
} from 'firebase-admin/firestore';

import { getServerConfig } from '../../config/config';
import {
    loadServiceAccount, type ServiceAccount,
} from './serviceAccount';

function getProjectId(serviceAccount: ServiceAccount | null): string | undefined {
    return getServerConfig().firebaseProjectId
        || serviceAccount?.project_id
        || process.env.GCLOUD_PROJECT
        || process.env.GOOGLE_CLOUD_PROJECT
        || undefined;
}

let app: App | null = null;
let db: Firestore | null = null;

export function getFirebaseAdminApp(): App {
    if (app) return app;

    const existing = getApps()[0];

    if (existing) {
        app = existing;
        return app;
    }

    // Service account from env or the local key file; otherwise Google application default credentials.
    const serviceAccount = loadServiceAccount();
    const projectId = getProjectId(serviceAccount);

    app = initializeApp({
        credential: serviceAccount ? cert(serviceAccount) : applicationDefault(),
        ...(projectId ? { projectId } : {}),
    });

    return app;
}

export function getAdminFirestore(): Firestore {
    if (db) return db;

    db = getFirestore(getFirebaseAdminApp());

    return db;
}
