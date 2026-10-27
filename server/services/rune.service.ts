import { BaseService } from './base.service';
import {
    DailyDrawEngine, type DailyDrawRecord,
} from './dailyDraw.engine';
import { FixedContentService } from './fixedContent.service';
import { RuneRepository } from '../repositories/rune.repository';
import { toMillis } from '../utils/firestoreTime';
import {
    RUNES, RUNE_RETENTION_MONTHS, runeContentKey,
} from '../../shared/constants/runes';
import type { DailyRuneResponse } from '../../shared/schemas/api/rune.schema';
import type { FixedResultResponse } from '../../shared/schemas/api/fixedResult.schema';
import { runeDrawDocSchema } from '../../shared/schemas/firestore/runeDraw.schema';
import {
    RUNE_DRAW_VERSION, drawDailyRune,
} from '../../shared/utils/rune';

type RuneServiceOptions = {
    repository?: RuneRepository;
    content?: FixedContentService;
    clock?: () => number;
};

export class RuneService extends BaseService {
    protected serviceName = 'rune';

    private readonly engine: DailyDrawEngine;

    constructor(options: RuneServiceOptions = {}) {
        super();
        this.engine = new DailyDrawEngine(
            {
                contentType: 'RUNE',
                drawVersion: RUNE_DRAW_VERSION,
                retentionMonths: RUNE_RETENTION_MONTHS,
                pick: (uid, dateKey) => {
                    const {
                        runeIndex, orientation, 
                    } = drawDailyRune(uid, dateKey);

                    return {
                        symbolIndex: runeIndex, orientation,
                    };
                },
                contentKey: runeContentKey,
                toDocument: (record) => ({
                    symbolIndex: record.symbolIndex,
                    orientation: record.orientation,
                    drawnAt: record.drawnAt,
                    expiresAt: record.expiresAt,
                    drawVersion: record.drawVersion,
                }),
                // A stored reversed draw of a symmetric rune cannot be valid: the schema refuses it
                fromDocument: (raw) => runeDrawDocSchema.parse({
                    ...raw,
                    drawnAt: toMillis(raw.drawnAt),
                    expiresAt: toMillis(raw.expiresAt),
                }),
            },
            options.repository ?? new RuneRepository(),
            options.content ?? new FixedContentService(),
            options.clock ?? Date.now,
        );
    }

    /** Today's draw if there is one. Never writes. */
    async getToday(uid: string): Promise<DailyRuneResponse> {
        const today = await this.engine.getToday(uid);

        if (!today) {
            return {
                date: this.engine.today(), drawn: false,
            };
        }

        return this.toResponse(today.date, today.record, today.content);
    }

    /** Draw today's rune; the first call of a Taipei day creates the record and any later one returns it. */
    async draw(uid: string): Promise<DailyRuneResponse> {
        const result = await this.engine.draw(uid);

        if (result.created) {
            this.logInfo('rune drawn', {
                action: 'draw',
                userId: uid,
            });
        }

        return this.toResponse(result.date, result.record, result.content);
    }

    private toResponse(date: string, record: DailyDrawRecord, content: FixedResultResponse): DailyRuneResponse {
        const rune = RUNES[record.symbolIndex];

        if (!rune) throw new RangeError(`Unknown rune index ${record.symbolIndex}`);

        return {
            date,
            drawn: true,
            rune: {
                index: rune.index,
                name: rune.name,
                glyph: rune.glyph,
                meaning: rune.meaning,
                orientation: record.orientation,
                illustration: rune.illustration,
            },
            content,
        };
    }
}
