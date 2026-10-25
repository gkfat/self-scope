import type {
    Firestore, Transaction,
} from 'firebase-admin/firestore';
import { getAdminFirestore } from '../utils/firebaseAdmin';

/**
 * pointPackages (config), users/{uid}/payments and unmatchedPaymentEvents.
 */
export class PaymentRepository {
    protected db: Firestore;

    constructor() {
        this.db = getAdminFirestore();
    }

    packagesRef() {
        return this.db.collection('pointPackages');
    }

    packageRef(packageId: string) {
        return this.packagesRef().doc(packageId);
    }

    paymentsRef(uid: string) {
        return this.db.collection('users').doc(uid).collection('payments');
    }

    paymentRef(uid: string, paymentId: string) {
        return this.paymentsRef(uid).doc(paymentId);
    }

    unmatchedEventRef(eventId: string) {
        return this.db.collection('unmatchedPaymentEvents').doc(eventId);
    }

    runTransaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T> {
        return this.db.runTransaction(fn);
    }
}
