import type {
    Firestore, Transaction,
} from 'firebase-admin/firestore';
import { getAdminFirestore } from '../utils/firebaseAdmin';

/**
 * rateLimits/{key}_{windowStart}: fixed-window counters.
 * `expiresAt` (Date) is a Firestore TTL field so old windows clean themselves up.
 */
export class RateLimitRepository {
    protected db: Firestore;

    constructor() {
        this.db = getAdminFirestore();
    }

    ref(id: string) {
        return this.db.collection('rateLimits').doc(id);
    }

    runTransaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T> {
        return this.db.runTransaction(fn);
    }
}
