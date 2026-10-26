import type {
    Firestore, Transaction,
} from 'firebase-admin/firestore';
import { getAdminFirestore } from '../utils/firebaseAdmin';

export class GuestSessionRepository {
    protected db: Firestore;

    constructor() {
        this.db = getAdminFirestore();
    }

    sessionRef(sessionId: string) {
        return this.db.collection('guestSessions').doc(sessionId);
    }

    userRef(uid: string) {
        return this.db.collection('users').doc(uid);
    }

    testAttemptRef(uid: string, attemptId: string) {
        return this.userRef(uid).collection('testAttempts').doc(attemptId);
    }

    humanDesignRef(uid: string) {
        return this.userRef(uid).collection('humanDesign').doc('main');
    }

    runTransaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T> {
        return this.db.runTransaction(fn);
    }
}
