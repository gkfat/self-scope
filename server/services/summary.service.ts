import { BaseService } from './base.service';
import { FixedContentService } from './fixedContent.service';
import { PointService } from './point.service';
import { SummaryRepository } from '../repositories/summary.repository';
import { UserRepository } from '../repositories/user.repository';
import {
    summaryDocSchema,
    type SummaryCombination, type SummaryDoc,
} from '../../shared/schemas/firestore/summary.schema';
import type {
    SummaryItem, SummaryObtained, SummaryRequest,
} from '../../shared/schemas/api/summary.schema';
import {
    isGeneratedAnalysis, multiDimensionCost,
} from '../../shared/utils/multiDimensionPricing';
import {
    fixedContentId, summaryKey,
} from '../../shared/utils/fixedContentKeys';
import { lifePathNumber } from '../../shared/utils/numerology';
import type { NumerologyNumber } from '../../shared/schemas/common';
import { addMonths } from '../../shared/utils/time';
import {
    NotFoundError, UnprocessableError,
} from '../../shared/types/errors';

const SUMMARY_RETENTION_MONTHS = 3;
const LIST_LIMIT = 50;

type SummaryServiceOptions = {
    repository?: SummaryRepository;
    users?: UserRepository;
    fixedContent?: FixedContentService;
    points?: PointService;
    clock?: () => number;
};

export class SummaryService extends BaseService {
    protected serviceName = 'summary';

    private readonly repository: SummaryRepository;
    private readonly users: UserRepository;
    private readonly fixedContent: FixedContentService;
    private readonly points: PointService;
    private readonly clock: () => number;

    constructor(options: SummaryServiceOptions = {}) {
        super();
        this.repository = options.repository ?? new SummaryRepository();
        this.users = options.users ?? new UserRepository();
        this.fixedContent = options.fixedContent ?? new FixedContentService();
        this.points = options.points ?? new PointService({ clock: options.clock });
        this.clock = options.clock ?? Date.now;
    }

    /**
     * Get the written-content analysis for the chosen dimensions, paying its price (1 point for two
     * dimensions, 3 for three) the first time. Owning a combination makes asking again free (RULE-005), and
     * the charge and the ownership record are written in one transaction, so a
     * repeated or concurrent request can never pay twice (NFR-017).
     */
    async obtain(uid: string, request: SummaryRequest): Promise<SummaryObtained> {
        const cost = multiDimensionCost(request.dimensions);

        // Choices with the human design are generated, not written content (DetailedReportService)
        if (cost === null || isGeneratedAnalysis(request.dimensions)) {
            throw new UnprocessableError('This choice of dimensions is not offered', 'DIMENSIONS_NOT_OFFERED');
        }

        const combination = await this.resolveCombination(uid, request);
        const key = summaryKey(combination);
        // Make sure there is something to deliver before anything is charged.
        const content = await this.fixedContent.getPublished('SUMMARY', key);

        const now = this.clock();
        const repo = this.repository;
        const summaryRef = repo.summaryRef(uid, key);

        const outcome = await repo.runTransaction(async (tx) => {
            const existingSnap = await tx.get(summaryRef);

            if (existingSnap.exists) {
                const existing = summaryDocSchema.parse(existingSnap.data());

                // Expired summaries wait for the cleanup job; they no longer count as owned.
                if (existing.expiresAt > now) {
                    return {
                        doc: existing, charged: false,
                    };
                }
            }

            // The transaction id carries the purchase time, so buying the same
            // combination again after it expired is a new, separate charge.
            const plan = await this.points.planDeduction(tx, {
                uid,
                amount: cost,
                reason: 'SUMMARY',
                transactionId: `summary_${key}_${now}`,
                reference: key,
            });

            const doc: SummaryDoc = {
                combinationKey: combination,
                contentRef: fixedContentId('SUMMARY', key),
                contentVersion: content.contentVersion,
                obtainedAt: now,
                expiresAt: addMonths(now, SUMMARY_RETENTION_MONTHS),
            };

            plan.apply();
            tx.set(summaryRef, doc);

            return {
                doc, charged: true,
            };
        });

        this.logInfo('summary obtained', {
            action: 'obtain',
            userId: uid,
            data: {
                charged: outcome.charged, key,
            },
        });

        return {
            summaryId: key,
            combinationKey: outcome.doc.combinationKey,
            content,
            obtainedAt: outcome.doc.obtainedAt,
            expiresAt: outcome.doc.expiresAt,
            pointsDeducted: outcome.charged ? cost : 0,
        };
    }

    /**
     * The member's summaries that have not expired, newest first. Reading is free.
     */
    async list(uid: string): Promise<SummaryItem[]> {
        const now = this.clock();
        const snap = await this.repository.summariesRef(uid)
            .orderBy('obtainedAt', 'desc')
            .limit(LIST_LIMIT)
            .get();

        const items: SummaryItem[] = [];

        for (const doc of snap.docs) {
            const summary = summaryDocSchema.parse(doc.data());

            if (summary.expiresAt <= now) continue;

            const item = await this.toItem(doc.id, summary);

            if (item) items.push(item);
        }

        return items;
    }

    async get(uid: string, summaryId: string): Promise<SummaryItem> {
        const snap = await this.repository.summaryRef(uid, summaryId).get();

        if (!snap.exists) {
            throw new NotFoundError('Summary');
        }

        const summary = summaryDocSchema.parse(snap.data());

        if (summary.expiresAt <= this.clock()) {
            throw new NotFoundError('Summary');
        }

        const item = await this.toItem(summaryId, summary);

        if (!item) {
            throw new NotFoundError('Summary');
        }

        return item;
    }

    /**
     * Combination from the member's saved profile. The client cannot pick it,
     * so nobody can request a combination that is not theirs.
     */
    private async resolveCombination(uid: string, request: SummaryRequest): Promise<SummaryCombination> {
        const user = await this.users.getById(uid);

        if (!user) {
            throw new NotFoundError('User');
        }

        const chosen = new Set(request.dimensions);

        if ((chosen.has('ZODIAC') || chosen.has('NUMEROLOGY')) && !user.birthData) {
            throw new UnprocessableError('Fill in your birth date and zodiac first', 'PROFILE_REQUIRED');
        }

        if (chosen.has('BLOOD') && user.bloodType === 'UNKNOWN') {
            throw new UnprocessableError('Fill in your blood type first', 'BLOOD_REQUIRED');
        }

        const mbtiValid = user.mbti !== null && (user.mbtiExpiresAt === null || user.mbtiExpiresAt > this.clock());

        if (chosen.has('MBTI') && (!mbtiValid || user.mbti === null)) {
            throw new UnprocessableError('Complete the personality test first', 'MBTI_REQUIRED');
        }

        return {
            zodiac: chosen.has('ZODIAC') ? user.birthData?.zodiac ?? null : null,
            mbti: chosen.has('MBTI') ? user.mbti : null,
            bloodType: chosen.has('BLOOD') && user.bloodType !== 'UNKNOWN' ? user.bloodType : null,
            numerology: chosen.has('NUMEROLOGY') && user.birthData
                ? String(lifePathNumber(user.birthData.birthDate)) as NumerologyNumber
                : null,
        };
    }

    /**
     * Serve the stored combination with its current published content.
     * A summary whose content is no longer published is left out rather than failing the list.
     */
    private async toItem(summaryId: string, summary: SummaryDoc): Promise<SummaryItem | null> {
        try {
            return {
                summaryId,
                combinationKey: summary.combinationKey,
                content: await this.fixedContent.getPublished('SUMMARY', summaryId),
                obtainedAt: summary.obtainedAt,
                expiresAt: summary.expiresAt,
            };
        } catch (error) {
            if (error instanceof NotFoundError) {
                this.logWarn('summary content is not available', {
                    action: 'toItem',
                    data: { summaryId },
                });
                return null;
            }

            throw error;
        }
    }
}
