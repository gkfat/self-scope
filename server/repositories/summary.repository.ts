import type {
    Firestore, Transaction,
} from 'firebase-admin/firestore';
import { getAdminFirestore } from '../utils/firebaseAdmin';

/**
 * users/{uid}/summaries/{combinationKey}
 */
export class SummaryRepository {
    protected db: Firestore;

    constructor() {
        this.db = getAdminFirestore();
    }

    summariesRef(uid: string) {
        return this.db.collection('users').doc(uid).collection('summaries');
    }

    summaryRef(uid: string, summaryId: string) {
        return this.summariesRef(uid).doc(summaryId);
    }

    runTransaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T> {
        return this.db.runTransaction(fn);
    }
}
