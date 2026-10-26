import type {
    Firestore, Transaction,
} from 'firebase-admin/firestore';
import { getAdminFirestore } from '../utils/firebaseAdmin';

/**
 * users/{uid}/detailedReports/{reportId}, the saved human design (read-only here)
 * and aiUsageRecords.
 */
export class DetailedReportRepository {
    protected db: Firestore;

    constructor() {
        this.db = getAdminFirestore();
    }

    reportsRef(uid: string) {
        return this.db.collection('users').doc(uid).collection('detailedReports');
    }

    reportRef(uid: string, reportId: string) {
        return this.reportsRef(uid).doc(reportId);
    }

    usageRef() {
        return this.db.collection('aiUsageRecords').doc();
    }

    runTransaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T> {
        return this.db.runTransaction(fn);
    }
}
