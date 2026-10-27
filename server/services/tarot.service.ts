import { BaseService } from './base.service';
import { FixedContentService } from './fixedContent.service';
import { TarotRepository } from '../repositories/tarot.repository';
import { toMillis } from '../utils/firestoreTime';
import {
    TAROT_CARDS, TAROT_RETENTION_MONTHS, tarotContentKey,
} from '../../shared/constants/tarot';
import type { DailyTarotResponse } from '../../shared/schemas/api/tarot.schema';
import type { FixedResultResponse } from '../../shared/schemas/api/fixedResult.schema';
import {
    tarotDrawDocSchema, type TarotDrawDoc,
} from '../../shared/schemas/firestore/tarot.schema';
import {
    TAROT_DRAW_VERSION, drawDailyCard, taipeiDateKey,
} from '../../shared/utils/tarot';
import { addMonths } from '../../shared/utils/time';

type TarotServiceOptions = {
    repository?: TarotRepository;
    content?: FixedContentService;
    clock?: () => number;
};

export class TarotService extends BaseService {
    protected serviceName = 'tarot';

    private readonly repository: TarotRepository;
    private readonly content: FixedContentService;
    private readonly clock: () => number;

    constructor(options: TarotServiceOptions = {}) {
        super();
        this.repository = options.repository ?? new TarotRepository();
        this.content = options.content ?? new FixedContentService();
        this.clock = options.clock ?? Date.now;
    }

    /** Today's draw if there is one. Never writes. */
    async getToday(uid: string): Promise<DailyTarotResponse> {
        const date = taipeiDateKey(new Date(this.clock()));
        const draw = await this.readDraw(uid, date);

        if (!draw) {
            return {
                date, drawn: false,
            };
        }

        return this.toResponse(date, draw, await this.contentOf(draw));
    }

    /**
     * Draw today's card. The first call of a Taipei day creates the record; any later call returns it
     * unchanged, so a retry or two concurrent requests end with the same card. The written content is
     * read before anything is stored: a card without published content is a 404 that uses up nothing.
     */
    async draw(uid: string): Promise<DailyTarotResponse> {
        const now = this.clock();
        const date = taipeiDateKey(new Date(now));
        const existing = await this.readDraw(uid, date);

        if (existing) {
            return this.toResponse(date, existing, await this.contentOf(existing));
        }

        const picked = drawDailyCard(uid, date);
        const content = await this.content.getPublished('TAROT', tarotContentKey(picked.cardIndex, picked.orientation));
        const candidate: TarotDrawDoc = {
            ...picked,
            drawnAt: now,
            expiresAt: addMonths(now, TAROT_RETENTION_MONTHS),
            drawVersion: TAROT_DRAW_VERSION,
        };

        const stored = await this.repository.runTransaction(async (tx) => {
            const ref = this.repository.ref(uid, date);
            const snap = await tx.get(ref);

            // Another request got here first: its record stands.
            if (snap.exists) return this.parseDraw(snap.data());

            tx.set(ref, candidate);

            return candidate;
        });

        this.logInfo('tarot drawn', {
            action: 'draw',
            userId: uid,
        });

        const sameCard = stored.cardIndex === candidate.cardIndex && stored.orientation === candidate.orientation;

        return this.toResponse(date, stored, sameCard ? content : await this.contentOf(stored));
    }

    private async readDraw(uid: string, date: string): Promise<TarotDrawDoc | null> {
        const snap = await this.repository.ref(uid, date).get();

        return snap.exists ? this.parseDraw(snap.data()) : null;
    }

    /** Stored documents are untrusted input to this service. */
    private parseDraw(raw: unknown): TarotDrawDoc {
        const data = raw as Record<string, unknown>;

        return tarotDrawDocSchema.parse({
            ...data,
            drawnAt: toMillis(data.drawnAt),
            expiresAt: toMillis(data.expiresAt),
        });
    }

    private contentOf(draw: TarotDrawDoc): Promise<FixedResultResponse> {
        return this.content.getPublished('TAROT', tarotContentKey(draw.cardIndex, draw.orientation));
    }

    private toResponse(date: string, draw: TarotDrawDoc, content: FixedResultResponse): DailyTarotResponse {
        const card = TAROT_CARDS[draw.cardIndex];

        if (!card) throw new RangeError(`Unknown tarot card index ${draw.cardIndex}`);

        return {
            date,
            drawn: true,
            card: {
                index: card.index,
                roman: card.roman,
                name: card.name,
                englishName: card.englishName,
                orientation: draw.orientation,
                illustration: card.illustration,
            },
            content,
        };
    }
}
