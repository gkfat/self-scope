/**
 * Base repository with common Firestore operations.
 * Timestamps are stored as epoch milliseconds (number).
 */

import type {
    Firestore, DocumentData, QuerySnapshot,
} from 'firebase-admin/firestore';
import { getAdminFirestore } from '../utils/firebaseAdmin';
import {
    DatabaseError, NotFoundError, errorMessage,
} from '../../shared/types/errors';

export abstract class BaseRepository<T extends DocumentData> {
    protected db: Firestore;
    protected abstract collectionName: string;

    constructor() {
        this.db = getAdminFirestore();
    }

    protected get collection() {
        return this.db.collection(this.collectionName);
    }

    /**
     * Get document by ID
     */
    async getById(id: string): Promise<T | null> {
        try {
            const doc = await this.collection.doc(id).get();

            if (!doc.exists) {
                return null;
            }

            return {
                id: doc.id,
                ...doc.data(),
            } as unknown as T;
        } catch (error) {
            throw new DatabaseError(`Failed to get document: ${errorMessage(error)}`);
        }
    }

    /**
     * Get document by ID or throw error
     */
    async getByIdOrThrow(id: string, resourceName?: string): Promise<T> {
        const doc = await this.getById(id);

        if (!doc) {
            throw new NotFoundError(resourceName || this.collectionName);
        }

        return doc;
    }

    /**
     * Create new document (overwrites if the ID already exists)
     */
    async create(id: string, data: Partial<T>): Promise<T> {
        try {
            const timestamp = Date.now();
            const docData: DocumentData = {
                ...data,
                createdAt: timestamp,
                updatedAt: timestamp,
            };

            await this.collection.doc(id).set(docData);

            return {
                id,
                ...docData,
            } as unknown as T;
        } catch (error) {
            throw new DatabaseError(`Failed to create document: ${errorMessage(error)}`);
        }
    }

    /**
     * Update document
     */
    async update(id: string, data: Partial<T>): Promise<T> {
        try {
            const updateData: DocumentData = {
                ...data,
                updatedAt: Date.now(),
            };

            await this.collection.doc(id).update(updateData);
        } catch (error) {
            throw new DatabaseError(`Failed to update document: ${errorMessage(error)}`);
        }

        return this.getByIdOrThrow(id);
    }

    /**
     * Delete document
     */
    async delete(id: string): Promise<void> {
        try {
            await this.collection.doc(id).delete();
        } catch (error) {
            throw new DatabaseError(`Failed to delete document: ${errorMessage(error)}`);
        }
    }

    /**
     * Check if document exists
     */
    async exists(id: string): Promise<boolean> {
        try {
            const doc = await this.collection.doc(id).get();

            return doc.exists;
        } catch (error) {
            throw new DatabaseError(`Failed to check document existence: ${errorMessage(error)}`);
        }
    }

    /**
     * Convert QuerySnapshot to array of documents
     */
    protected snapshotToArray(snapshot: QuerySnapshot<DocumentData>): T[] {
        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as unknown as T[];
    }

    /**
     * Get document reference for a specific ID.
     * Useful for transactions and batch operations.
     */
    protected getDocumentRef(id: string) {
        return this.collection.doc(id);
    }

    /**
     * Create batch write with document reference helper
     */
    public createBatchWrite() {
        return {
            batch: this.db.batch(),
            getDocRef: (id: string) => this.collection.doc(id),
        };
    }
}
