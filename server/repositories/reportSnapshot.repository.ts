import type {
    Firestore, Transaction,
} from 'firebase-admin/firestore';
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

    runTransaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T> {
        return this.db.runTransaction(fn);
    }

    /** aiUsageRecords/{id}: cost bookkeeping that outlives the report */
    usageRef() {
        return this.db.collection('aiUsageRecords').doc();
    }
}
