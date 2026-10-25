import type {
    Firestore, Transaction,
} from 'firebase-admin/firestore';
import { getAdminFirestore } from '../utils/firebaseAdmin';
import {
    testDocSchema, testVersionDocSchema,
    type TestDoc, type TestVersionDoc,
} from '../../shared/schemas/firestore/test.schema';

/**
 * tests/{testId} and tests/{testId}/versions/{version} (read-only for the app),
 * plus the signed-in user's saved attempts.
 */
export class TestRepository {
    protected db: Firestore;

    constructor() {
        this.db = getAdminFirestore();
    }

    async getTest(testId: string): Promise<TestDoc | null> {
        const snap = await this.db.collection('tests').doc(testId).get();

        return snap.exists ? testDocSchema.parse(snap.data()) : null;
    }

    async listActiveTests(): Promise<Array<{ testId: string; test: TestDoc }>> {
        const snap = await this.db.collection('tests').where('active', '==', true).get();

        return snap.docs.map((doc) => ({
            testId: doc.id,
            test: testDocSchema.parse(doc.data()),
        }));
    }

    async getVersion(testId: string, version: string): Promise<TestVersionDoc | null> {
        const snap = await this.db.collection('tests').doc(testId).collection('versions').doc(version).get();

        return snap.exists ? testVersionDocSchema.parse(snap.data()) : null;
    }

    userRef(uid: string) {
        return this.db.collection('users').doc(uid);
    }

    attemptsRef(uid: string) {
        return this.userRef(uid).collection('testAttempts');
    }

    runTransaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T> {
        return this.db.runTransaction(fn);
    }
}
