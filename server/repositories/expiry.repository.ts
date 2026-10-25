import type { Firestore } from 'firebase-admin/firestore';
import { getAdminFirestore } from '../utils/firebaseAdmin';

/**
 * Collection-group access for the data expiry job.
 * Payments are deliberately not reachable from here (RULE-015).
 */
export class ExpiryRepository {
    protected db: Firestore;

    constructor() {
        this.db = getAdminFirestore();
    }

    expiredIn(collectionGroup: string, now: number, limit: number) {
        return this.db.collectionGroup(collectionGroup).where('expiresAt', '<=', now).limit(limit);
    }

    usersWithExpiredMbti(now: number, limit: number) {
        return this.db.collection('users').where('mbtiExpiresAt', '<=', now).limit(limit);
    }

    batch() {
        return this.db.batch();
    }
}
