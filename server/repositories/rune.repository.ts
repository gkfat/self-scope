import type {
    Firestore, Transaction,
} from 'firebase-admin/firestore';
import { getAdminFirestore } from '../utils/firebaseAdmin';

export class RuneRepository {
    protected db: Firestore;

    constructor() {
        this.db = getAdminFirestore();
    }

    /** users/{uid}/runeDraws/{YYYY-MM-DD}: the Taipei date is the document id, so a day can hold only one. */
    ref(uid: string, dateKey: string) {
        return this.db.collection('users').doc(uid).collection('runeDraws').doc(dateKey);
    }

    runTransaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T> {
        return this.db.runTransaction(fn);
    }
}
