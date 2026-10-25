import type {
    Firestore, Transaction,
} from 'firebase-admin/firestore';
import { getAdminFirestore } from '../utils/firebaseAdmin';

/**
 * users/{uid}/pointBatches and users/{uid}/pointTransactions.
 * The balance is never stored: it is derived from unexpired batches.
 */
export class PointRepository {
    protected db: Firestore;

    constructor() {
        this.db = getAdminFirestore();
    }

    private userRef(uid: string) {
        return this.db.collection('users').doc(uid);
    }

    batchesRef(uid: string) {
        return this.userRef(uid).collection('pointBatches');
    }

    batchRef(uid: string, batchId: string) {
        return this.batchesRef(uid).doc(batchId);
    }

    transactionsRef(uid: string) {
        return this.userRef(uid).collection('pointTransactions');
    }

    transactionRef(uid: string, transactionId: string) {
        return this.transactionsRef(uid).doc(transactionId);
    }

    runTransaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T> {
        return this.db.runTransaction(fn);
    }
}
