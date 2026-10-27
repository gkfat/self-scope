import type {
    DocumentReference, Transaction,
} from 'firebase-admin/firestore';
import type { FixedContentService } from './fixedContent.service';
import type { FixedResultResponse } from '../../shared/schemas/api/fixedResult.schema';
import type { FixedContentType } from '../../shared/utils/fixedContentKeys';
import type {
    DrawOrientation, DrawnSymbol,
} from '../../shared/utils/dailyDraw';
import {
    addMonths, taipeiDateKey,
} from '../../shared/utils/time';

/** What is stored for one draw, whatever it is a draw of. */
export type DailyDrawRecord = {
    symbolIndex: number;
    orientation: DrawOrientation;
    drawnAt: number;
    expiresAt: number;
    drawVersion: string;
};

/** What differs between the daily draws; the engine holds everything they share. */
export type DailyDrawConfig = {
    contentType: FixedContentType;
    drawVersion: string;
    retentionMonths: number;
    pick: (uid: string, dateKey: string) => DrawnSymbol;
    /** Key of the written content of a symbol in the fixed contents */
    contentKey: (symbolIndex: number, orientation: DrawOrientation) => string;
    /** The stored document of a record, and the record of a stored document (which is untrusted input) */
    toDocument: (record: DailyDrawRecord) => Record<string, unknown>;
    fromDocument: (raw: Record<string, unknown>) => DailyDrawRecord;
};

/** Where the records live: `users/{uid}/<collection>/{date}`. */
export type DailyDrawStore = {
    ref: (uid: string, dateKey: string) => DocumentReference;
    runTransaction: <T>(fn: (tx: Transaction) => Promise<T>) => Promise<T>;
};

export type DailyDrawResult = {
    date: string;
    record: DailyDrawRecord;
    content: FixedResultResponse;
};

/**
 * The part of a daily draw that does not depend on what is drawn: one record per account and Taipei date, created
 * in a transaction only if it does not exist yet, after the written content has been found to be deliverable.
 */
export class DailyDrawEngine {
    constructor(
        private readonly config: DailyDrawConfig,
        private readonly store: DailyDrawStore,
        private readonly content: FixedContentService,
        private readonly clock: () => number,
    ) {}

    /** The Taipei date the server's clock is on now. */
    today(): string {
        return taipeiDateKey(new Date(this.clock()));
    }

    /** Today's record and its content, or null when nothing has been drawn today. Never writes. */
    async getToday(uid: string): Promise<DailyDrawResult | null> {
        const date = this.today();
        const record = await this.find(uid, date);

        return record ? this.result(date, record) : null;
    }

    /**
     * Draw today's symbol. The first call of a Taipei day creates the record; any later call returns it unchanged,
     * so a retry or two concurrent requests end with the same one. The content is read before anything is stored:
     * a symbol without published content is a 404 that uses up nothing. Returns whether a record was created.
     */
    async draw(uid: string): Promise<DailyDrawResult & { created: boolean }> {
        const now = this.clock();
        const date = taipeiDateKey(new Date(now));
        const existing = await this.find(uid, date);

        if (existing) return {
            ...(await this.result(date, existing)), created: false, 
        };

        const picked = this.config.pick(uid, date);
        const content = await this.content.getPublished(this.config.contentType, this.config.contentKey(picked.symbolIndex, picked.orientation));
        const candidate: DailyDrawRecord = {
            ...picked,
            drawnAt: now,
            expiresAt: addMonths(now, this.config.retentionMonths),
            drawVersion: this.config.drawVersion,
        };

        const stored = await this.store.runTransaction(async (tx) => {
            const ref = this.store.ref(uid, date);
            const snap = await tx.get(ref);

            // Another request got here first: its record stands.
            if (snap.exists) return {
                record: this.config.fromDocument(snap.data() as Record<string, unknown>), created: false, 
            };

            tx.set(ref, this.config.toDocument(candidate));

            return {
                record: candidate, created: true, 
            };
        });

        const same = stored.record.symbolIndex === candidate.symbolIndex && stored.record.orientation === candidate.orientation;

        return {
            date,
            record: stored.record,
            content: same ? content : await this.contentOf(stored.record),
            created: stored.created,
        };
    }

    private async find(uid: string, date: string): Promise<DailyDrawRecord | null> {
        const snap = await this.store.ref(uid, date).get();

        return snap.exists ? this.config.fromDocument(snap.data() as Record<string, unknown>) : null;
    }

    private contentOf(record: DailyDrawRecord): Promise<FixedResultResponse> {
        return this.content.getPublished(this.config.contentType, this.config.contentKey(record.symbolIndex, record.orientation));
    }

    private async result(date: string, record: DailyDrawRecord): Promise<DailyDrawResult> {
        return {
            date, record, content: await this.contentOf(record),
        };
    }
}
