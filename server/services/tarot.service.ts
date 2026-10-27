import { BaseService } from './base.service';
import {
    DailyDrawEngine, type DailyDrawRecord,
} from './dailyDraw.engine';
import { FixedContentService } from './fixedContent.service';
import { TarotRepository } from '../repositories/tarot.repository';
import { toMillis } from '../utils/firestoreTime';
import {
    TAROT_CARDS, TAROT_RETENTION_MONTHS, tarotContentKey,
} from '../../shared/constants/tarot';
import type { DailyTarotResponse } from '../../shared/schemas/api/tarot.schema';
import type { FixedResultResponse } from '../../shared/schemas/api/fixedResult.schema';
import { tarotDrawDocSchema } from '../../shared/schemas/firestore/tarot.schema';
import {
    TAROT_DRAW_VERSION, drawDailyCard,
} from '../../shared/utils/tarot';

type TarotServiceOptions = {
    repository?: TarotRepository;
    content?: FixedContentService;
    clock?: () => number;
};

export class TarotService extends BaseService {
    protected serviceName = 'tarot';

    private readonly engine: DailyDrawEngine;

    constructor(options: TarotServiceOptions = {}) {
        super();
        this.engine = new DailyDrawEngine(
            {
                contentType: 'TAROT',
                drawVersion: TAROT_DRAW_VERSION,
                retentionMonths: TAROT_RETENTION_MONTHS,
                pick: (uid, dateKey) => {
                    const {
                        cardIndex, orientation, 
                    } = drawDailyCard(uid, dateKey);

                    return {
                        symbolIndex: cardIndex, orientation,
                    };
                },
                contentKey: tarotContentKey,
                // The stored document keeps the field names it has always had
                toDocument: (record) => ({
                    cardIndex: record.symbolIndex,
                    orientation: record.orientation,
                    drawnAt: record.drawnAt,
                    expiresAt: record.expiresAt,
                    drawVersion: record.drawVersion,
                }),
                fromDocument: (raw) => {
                    const doc = tarotDrawDocSchema.parse({
                        ...raw,
                        drawnAt: toMillis(raw.drawnAt),
                        expiresAt: toMillis(raw.expiresAt),
                    });

                    return {
                        symbolIndex: doc.cardIndex,
                        orientation: doc.orientation,
                        drawnAt: doc.drawnAt,
                        expiresAt: doc.expiresAt,
                        drawVersion: doc.drawVersion,
                    };
                },
            },
            options.repository ?? new TarotRepository(),
            options.content ?? new FixedContentService(),
            options.clock ?? Date.now,
        );
    }

    /** Today's draw if there is one. Never writes. */
    async getToday(uid: string): Promise<DailyTarotResponse> {
        const today = await this.engine.getToday(uid);

        if (!today) {
            return {
                date: this.engine.today(), drawn: false,
            };
        }

        return this.toResponse(today.date, today.record, today.content);
    }

    /** Draw today's card; the first call of a Taipei day creates the record and any later one returns it. */
    async draw(uid: string): Promise<DailyTarotResponse> {
        const result = await this.engine.draw(uid);

        if (result.created) {
            this.logInfo('tarot drawn', {
                action: 'draw',
                userId: uid,
            });
        }

        return this.toResponse(result.date, result.record, result.content);
    }

    private toResponse(date: string, record: DailyDrawRecord, content: FixedResultResponse): DailyTarotResponse {
        const card = TAROT_CARDS[record.symbolIndex];

        if (!card) throw new RangeError(`Unknown tarot card index ${record.symbolIndex}`);

        return {
            date,
            drawn: true,
            card: {
                index: card.index,
                roman: card.roman,
                name: card.name,
                englishName: card.englishName,
                orientation: record.orientation,
                illustration: card.illustration,
            },
            content,
        };
    }
}
