import type { Firestore } from 'firebase-admin/firestore';
import { getAdminFirestore } from '../utils/firebaseAdmin';

/** users/{uid}/reportSnapshots/{snapshotId}: always under the member's own user document, so nobody else's id resolves. */
export class ReportSnapshotRepository {
    protected db: Firestore;

    constructor() {
        this.db = getAdminFirestore();
    }

    snapshotsRef(uid: string) {
        return this.db.collection('users').doc(uid).collection('reportSnapshots');
    }

    snapshotRef(uid: string, snapshotId: string) {
        return this.snapshotsRef(uid).doc(snapshotId);
    }

    batch() {
        return this.db.batch();
    }
}
