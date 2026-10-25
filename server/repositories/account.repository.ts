import type {
    Firestore, Transaction,
} from 'firebase-admin/firestore';
import { getAdminFirestore } from '../utils/firebaseAdmin';

/**
 * Document references and transaction access for account registration.
 * Business decisions stay in AccountService; this class only knows paths.
 */
export class AccountRepository {
    protected db: Firestore;

    constructor() {
        this.db = getAdminFirestore();
    }

    userRef(uid: string) {
        return this.db.collection('users').doc(uid);
    }

    pointAccountRef(uid: string) {
        return this.userRef(uid).collection('pointAccount').doc('main');
    }

    pointBatchRef(uid: string, batchId: string) {
        return this.userRef(uid).collection('pointBatches').doc(batchId);
    }

    pointTransactionRef(uid: string, transactionId: string) {
        return this.userRef(uid).collection('pointTransactions').doc(transactionId);
    }

    welcomeGrantRef(googleUidHash: string) {
        return this.db.collection('welcomeGrants').doc(googleUidHash);
    }

    runTransaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T> {
        return this.db.runTransaction(fn);
    }
}
