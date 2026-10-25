import type {
    CollectionReference, DocumentReference, Firestore, Query,
} from 'firebase-admin/firestore';
import { getAdminFirestore } from '../utils/firebaseAdmin';

/**
 * Firestore access for deleting a user's data.
 */
export class DeletionRepository {
    protected db: Firestore;

    constructor() {
        this.db = getAdminFirestore();
    }

    userRef(uid: string) {
        return this.db.collection('users').doc(uid);
    }

    subcollectionRef(uid: string, name: string) {
        return this.userRef(uid).collection(name);
    }

    aiUsageForUser(uid: string): Query {
        return this.db.collection('aiUsageRecords').where('userId', '==', uid);
    }

    recursiveDelete(ref: DocumentReference | CollectionReference) {
        return this.db.recursiveDelete(ref);
    }

    batch() {
        return this.db.batch();
    }
}
