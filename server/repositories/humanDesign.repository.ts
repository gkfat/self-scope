import type { Firestore } from 'firebase-admin/firestore';
import { getAdminFirestore } from '../utils/firebaseAdmin';

export class HumanDesignRepository {
    protected db: Firestore;

    constructor() {
        this.db = getAdminFirestore();
    }

    /** users/{uid}/humanDesign/main: one chart per member, replaced on recalculation. */
    ref(uid: string) {
        return this.db.collection('users').doc(uid).collection('humanDesign').doc('main');
    }
}
