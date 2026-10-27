import { BaseService } from './base.service';
import { HumanDesignService } from './humanDesign.service';
import { PointService } from './point.service';
import { RateLimitService } from './rateLimit.service';
import { DetailedReportRepository } from '../repositories/detailedReport.repository';
import { TestRepository } from '../repositories/test.repository';
import { UserRepository } from '../repositories/user.repository';
import { getAiProvider } from '../ai';
import { buildAnalysisInput } from '../ai/analysisInput';
import {
    buildBaziReportFacts, type BaziReportFacts,
} from '../bazi/reportFacts';
import {
    buildMayaKinReportFacts, type MayaKinReportFacts,
} from '../mayaKin/reportFacts';
import {
    AiOutputError, type AiReportProvider, 
} from '../ai/provider';
import { PROMPT_VERSION } from '../ai/prompt';
import {
    assessReport, parseReportOutput,
} from '../ai/quality';
import { getServerConfig } from '../../config/config';
import { runInBackground } from '../utils/background';
import {
    DEFAULT_AI_PRICE_INPUT_PER_MTOK,
    DEFAULT_AI_PRICE_OUTPUT_PER_MTOK,
    REPORT_DISCLAIMER,
    REPORT_LIMIT_PER_DAY,
    REPORT_LIMIT_PER_HOUR,
    REPORT_RETENTION_MONTHS,
    REPORT_STALE_AFTER_MS,
    REPORT_TIMEOUT_MS,
} from '../../shared/constants/ai';
import {
    isGeneratedAnalysis, multiDimensionCost,
} from '../../shared/utils/multiDimensionPricing';
import {
    REPORT_SECTIONS, detailedReportDocSchema,
    type AiUsageRecord, type DetailedReportDoc, type ReportDimension,
} from '../../shared/schemas/firestore/detailedReport.schema';
import { testAttemptDocSchema } from '../../shared/schemas/firestore/testAttempt.schema';
import type {
    CreateReportRequest, ReportAccepted, ReportItem,
} from '../../shared/schemas/api/detailedReport.schema';
import { lifePathNumber } from '../../shared/utils/numerology';
import type { NumerologyNumber } from '../../shared/schemas/common';
import { addMonths } from '../../shared/utils/time';
import {
    NotFoundError, UnprocessableError, errorMessage,
} from '../../shared/types/errors';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const LIST_LIMIT = 50;

type Pricing = {
    inputPerMtok: number;
    outputPerMtok: number;
};

type DetailedReportServiceOptions = {
    repository?: DetailedReportRepository;
    users?: UserRepository;
    tests?: TestRepository;
    humanDesign?: HumanDesignService;
    points?: PointService;
    rateLimit?: RateLimitService;
    getProvider?: () => AiReportProvider;
    /** Runs the generation after the response; replaced in tests so they can wait for it. */
    background?: (task: () => Promise<void>, onError: (error: unknown) => void) => Promise<void>;
    pricing?: () => Pricing;
    timeoutMs?: number;
    clock?: () => number;
};

type StartOptions = {
    reason: 'DETAILED_REPORT' | 'REGENERATE';
    supersedesReportId: string | null;
};

type FailureReason = 'TIMEOUT' | 'AI_ERROR' | 'INVALID_OUTPUT' | 'REFUSED' | 'TRUNCATED' | 'UNPARSEABLE' | 'STALE';

function chargeTransactionId(reportId: string, supersedes: string | null) {
    return supersedes ? `regenerate_${reportId}` : `report_${reportId}`;
}

export class DetailedReportService extends BaseService {
    protected serviceName = 'detailed-report';

    private readonly repository: DetailedReportRepository;
    private readonly users: UserRepository;
    private readonly tests: TestRepository;
    private readonly humanDesign: HumanDesignService;
    private readonly points: PointService;
    private readonly rateLimit: RateLimitService;
    private readonly getProvider: () => AiReportProvider;
    private readonly background: NonNullable<DetailedReportServiceOptions['background']>;
    private readonly pricing: () => Pricing;
    private readonly timeoutMs: number;
    private readonly clock: () => number;

    constructor(options: DetailedReportServiceOptions = {}) {
        super();
        this.repository = options.repository ?? new DetailedReportRepository();
        this.users = options.users ?? new UserRepository();
        this.tests = options.tests ?? new TestRepository();
        this.humanDesign = options.humanDesign ?? new HumanDesignService({ clock: options.clock });
        this.points = options.points ?? new PointService({ clock: options.clock });
        this.rateLimit = options.rateLimit ?? new RateLimitService({ clock: options.clock });
        this.getProvider = options.getProvider ?? getAiProvider;
        this.background = options.background ?? runInBackground;
        this.pricing = options.pricing ?? (() => {
            const config = getServerConfig();

            return {
                inputPerMtok: config.aiPriceInputPerMtok ?? DEFAULT_AI_PRICE_INPUT_PER_MTOK,
                outputPerMtok: config.aiPriceOutputPerMtok ?? DEFAULT_AI_PRICE_OUTPUT_PER_MTOK,
            };
        });
        this.timeoutMs = options.timeoutMs ?? REPORT_TIMEOUT_MS;
        this.clock = options.clock ?? Date.now;
    }

    /**
     * Charge 5 points and start generating a report. The Idempotency-Key is the report id, so the
     * same key never charges or generates twice (RULE-025). Generation continues after the response.
     */
    async create(uid: string, request: CreateReportRequest, idempotencyKey: string): Promise<ReportAccepted> {
        return this.start(uid, request, idempotencyKey, {
            reason: 'DETAILED_REPORT', supersedesReportId: null,
        });
    }

    /**
     * Make a new report from the member's current data, charging again and keeping the old one (RULE-006).
     */
    async regenerate(uid: string, sourceReportId: string, idempotencyKey: string): Promise<ReportAccepted> {
        const source = await this.repository.reportRef(uid, sourceReportId).get();

        if (!source.exists) {
            throw new NotFoundError('Report');
        }

        const doc = detailedReportDocSchema.parse(source.data());

        if (doc.expiresAt !== null && doc.expiresAt <= this.clock()) {
            throw new NotFoundError('Report');
        }

        const { combinationKey } = doc;
        const dimensions: ReportDimension[] = [];

        if (combinationKey.zodiac !== null) dimensions.push('ZODIAC');
        if (combinationKey.bloodType !== null) dimensions.push('BLOOD');
        if (combinationKey.mbti !== null) dimensions.push('MBTI');
        if (combinationKey.humanDesignType !== null) dimensions.push('HUMAN_DESIGN');
        if (combinationKey.numerology !== null) dimensions.push('NUMEROLOGY');
        if (combinationKey.baziDayMaster !== null) dimensions.push('BAZI');
        if (combinationKey.kinNumber !== null) dimensions.push('MAYA_KIN');

        return this.start(uid, { dimensions }, idempotencyKey, {
            reason: 'REGENERATE', supersedesReportId: sourceReportId,
        });
    }

    async get(uid: string, reportId: string): Promise<ReportItem> {
        const snap = await this.repository.reportRef(uid, reportId).get();

        if (!snap.exists) {
            throw new NotFoundError('Report');
        }

        const doc = await this.reapIfStale(uid, reportId, detailedReportDocSchema.parse(snap.data()));

        if (doc.expiresAt !== null && doc.expiresAt <= this.clock()) {
            throw new NotFoundError('Report');
        }

        return this.toItem(reportId, doc);
    }

    async list(uid: string): Promise<ReportItem[]> {
        const now = this.clock();
        const snap = await this.repository.reportsRef(uid).orderBy('createdAt', 'desc').limit(LIST_LIMIT).get();
        const items: ReportItem[] = [];

        for (const doc of snap.docs) {
            const report = await this.reapIfStale(uid, doc.id, detailedReportDocSchema.parse(doc.data()));

            if (report.expiresAt !== null && report.expiresAt <= now) continue;

            items.push(this.toItem(doc.id, report));
        }

        return items;
    }

    private async start(
        uid: string,
        request: CreateReportRequest,
        reportId: string,
        options: StartOptions,
    ): Promise<ReportAccepted> {
        const repo = this.repository;
        const reportRef = repo.reportRef(uid, reportId);

        // A retry of the same request just reports where the first one got to.
        const existing = await reportRef.get();

        if (existing.exists) {
            return {
                reportId,
                status: detailedReportDocSchema.parse(existing.data()).status,
                pointsDeducted: 0,
            };
        }

        const cost = multiDimensionCost(request.dimensions);

        // Only choices that include the human design, the BaZi chart or the Maya Kin are generated; the rest are written content (SummaryService)
        if (cost === null || !isGeneratedAnalysis(request.dimensions)) {
            throw new UnprocessableError('This choice of dimensions is not offered here', 'DIMENSIONS_NOT_OFFERED');
        }

        const {
            input, combinationKey,
        } = await this.collectInput(uid, request);

        await this.rateLimit.consume(`report_hour_${uid}`, REPORT_LIMIT_PER_HOUR, HOUR_MS);
        await this.rateLimit.consume(`report_day_${uid}`, REPORT_LIMIT_PER_DAY, DAY_MS);

        const now = this.clock();

        const created = await repo.runTransaction(async (tx) => {
            const snap = await tx.get(reportRef);

            if (snap.exists) {
                return false;
            }

            const plan = await this.points.planDeduction(tx, {
                uid,
                amount: cost,
                reason: options.reason,
                transactionId: chargeTransactionId(reportId, options.supersedesReportId),
                reference: reportId,
            });

            const doc: DetailedReportDoc = {
                combinationKey,
                input,
                status: 'GENERATING',
                sections: [],
                disclaimer: null,
                modelName: null,
                promptVersion: null,
                supersedesReportId: options.supersedesReportId,
                failureReason: null,
                createdAt: now,
                completedAt: null,
                expiresAt: null,
                downloadCount: 0,
                lastDownloadedAt: null,
            };

            plan.apply();
            tx.set(reportRef, doc);

            return true;
        });

        if (!created) {
            // Lost a race with the same Idempotency-Key: the winner is generating.
            return {
                reportId, status: 'GENERATING', pointsDeducted: 0,
            };
        }

        this.logInfo('report accepted', {
            action: 'start',
            userId: uid,
            data: {
                reportId, reason: options.reason,
            },
        });

        void this.background(
            () => this.generate(uid, reportId),
            (error) => this.logError('background generation crashed', {
                action: 'generate',
                userId: uid,
                data: { reportId },
                error,
            }),
        );

        return {
            reportId, status: 'GENERATING', pointsDeducted: cost,
        };
    }

    /**
     * Everything the report needs, or a 422 telling the member what is missing.
     */
    private async collectInput(uid: string, request: CreateReportRequest) {
        const user = await this.users.getById(uid);

        if (!user) {
            throw new NotFoundError('User');
        }

        const chosen = new Set(request.dimensions);
        const now = this.clock();

        if ((chosen.has('ZODIAC') || chosen.has('NUMEROLOGY') || chosen.has('MAYA_KIN')) && !user.birthData) {
            throw new UnprocessableError('Fill in your birth date and zodiac first', 'PROFILE_REQUIRED');
        }

        if (chosen.has('BLOOD') && user.bloodType === 'UNKNOWN') {
            throw new UnprocessableError('Fill in your blood type first', 'BLOOD_REQUIRED');
        }

        const mbtiValid = user.mbti !== null && (user.mbtiExpiresAt === null || user.mbtiExpiresAt > now);

        if (chosen.has('MBTI') && (!mbtiValid || user.mbti === null)) {
            throw new UnprocessableError('Complete the personality test first', 'MBTI_REQUIRED');
        }

        let humanDesign: Record<string, unknown> | null = null;

        if (chosen.has('HUMAN_DESIGN')) {
            // getCurrent recalculates a chart whose birth data has changed, so a stale chart is never paid for.
            const chart = await this.humanDesign.getCurrent(uid);

            if (!chart) {
                throw new UnprocessableError('Calculate your human design first', 'HUMAN_DESIGN_REQUIRED');
            }

            // The chart-level facts only: the raw gate activations add length without adding meaning.
            humanDesign = {
                type: chart.type,
                strategy: chart.strategy,
                authority: chart.authority,
                profile: chart.profile,
                definition: chart.definition,
                incarnationCross: chart.incarnationCross,
                definedCenters: chart.definedCenters,
                channels: chart.channels,
            };
        }

        let bazi: BaziReportFacts | null = null;

        if (chosen.has('BAZI')) {
            const birth = user.birthData;

            if (!birth || !birth.birthTime) {
                throw new UnprocessableError('Fill in your birth date and time first', 'BAZI_REQUIRED');
            }

            bazi = buildBaziReportFacts({
                birthDate: birth.birthDate,
                birthTime: birth.birthTime,
                birthPlace: birth.birthPlace ?? null,
            });
        }

        // The Kin follows from the birth date, which the check above has made sure is there
        const mayaKin: MayaKinReportFacts | null = chosen.has('MAYA_KIN') && user.birthData
            ? buildMayaKinReportFacts(user.birthData.birthDate)
            : null;

        const mbti = chosen.has('MBTI') ? user.mbti : null;
        const input = buildAnalysisInput({
            zodiac: chosen.has('ZODIAC') ? user.birthData?.zodiac ?? null : null,
            bloodType: chosen.has('BLOOD') ? user.bloodType : null,
            mbti,
            numerology: chosen.has('NUMEROLOGY') && user.birthData
                ? String(lifePathNumber(user.birthData.birthDate)) as NumerologyNumber
                : null,
            // The answer leanings belong to the MBTI dimension only
            test: mbti ? await this.latestTest(uid) : null,
            humanDesign,
            bazi,
            mayaKin,
        });

        return {
            input,
            combinationKey: {
                zodiac: input.profile.zodiac,
                mbti: input.profile.mbti,
                bloodType: input.profile.bloodType,
                humanDesignType: typeof humanDesign?.type === 'string' ? humanDesign.type : null,
                numerology: input.profile.numerology,
                baziDayMaster: bazi ? bazi.dayMaster.slice(0, 1) : null,
                kinNumber: mayaKin?.kinNumber ?? null,
            },
        };
    }

    /** The newest saved test that has not expired, with what is needed to read its answers. */
    private async latestTest(uid: string) {
        const snap = await this.tests.attemptsRef(uid).orderBy('completedAt', 'desc').limit(1).get();
        const doc = snap.docs[0];

        if (!doc) return null;

        const attempt = testAttemptDocSchema.parse(doc.data());

        if (attempt.expiresAt <= this.clock()) return null;

        const version = await this.tests.getVersion(attempt.testId, attempt.testVersion);

        if (!version) return null;

        return {
            testVersion: attempt.testVersion,
            questions: version.questions,
            rule: version.scoringRule,
            answers: attempt.answers,
        };
    }

    /**
     * The background job: ask the model, check the answer, then complete or fail-and-refund.
     * Never throws: every outcome is written to the report.
     */
    private async generate(uid: string, reportId: string): Promise<void> {
        const snap = await this.repository.reportRef(uid, reportId).get();

        if (!snap.exists) return;

        const doc = detailedReportDocSchema.parse(snap.data());

        if (doc.status !== 'GENERATING') return;

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
            const generation = await this.getProvider().generate(doc.input, { signal: controller.signal });

            await this.recordUsage(uid, reportId, generation.modelName, generation.usage);

            const output = parseReportOutput(generation.output);
            const quality = output ? assessReport(output) : null;

            if (!output || !quality || quality.fatal.length > 0) {
                this.logWarn('report rejected by quality checks', {
                    action: 'generate',
                    userId: uid,
                    data: {
                        reportId, codes: quality?.fatal.map((finding) => finding.code) ?? ['SCHEMA'],
                    },
                });
                await this.fail(uid, reportId, 'INVALID_OUTPUT');
                return;
            }

            if (quality.warnings.length > 0) {
                this.logInfo('report quality warnings', {
                    action: 'generate',
                    userId: uid,
                    data: {
                        reportId, codes: quality.warnings.map((finding) => finding.code),
                    },
                });
            }

            await this.complete(uid, reportId, output.sections, generation.modelName);
        } catch (error) {
            await this.fail(uid, reportId, this.reasonFor(error, controller.signal), error);
        } finally {
            clearTimeout(timer);
        }
    }

    private reasonFor(error: unknown, signal: AbortSignal): FailureReason {
        if (signal.aborted) return 'TIMEOUT';
        if (error instanceof AiOutputError) return error.reason;

        return 'AI_ERROR';
    }

    private async complete(
        uid: string,
        reportId: string,
        sections: ReturnType<typeof detailedReportDocSchema.parse>['sections'],
        modelName: string,
    ): Promise<void> {
        const ref = this.repository.reportRef(uid, reportId);
        const now = this.clock();
        const titles = new Map<string, string>(REPORT_SECTIONS.map((section) => [section.key, section.title]));

        await this.repository.runTransaction(async (tx) => {
            const snap = await tx.get(ref);

            // It may have been failed meanwhile (stale reaper); never overwrite that.
            if (!snap.exists || detailedReportDocSchema.parse(snap.data()).status !== 'GENERATING') return;

            tx.update(ref, {
                status: 'COMPLETED',
                sections: sections.map((section) => ({
                    ...section, title: titles.get(section.key) ?? section.key,
                })),
                disclaimer: REPORT_DISCLAIMER,
                modelName,
                promptVersion: PROMPT_VERSION,
                completedAt: now,
                expiresAt: addMonths(now, REPORT_RETENTION_MONTHS),
            });
        });
    }

    /**
     * Mark a generating report failed and give the points back, in one transaction so the
     * refund happens exactly once however many paths try to fail it.
     */
    private async fail(uid: string, reportId: string, reason: FailureReason, error?: unknown): Promise<void> {
        const ref = this.repository.reportRef(uid, reportId);

        await this.repository.runTransaction(async (tx) => {
            const snap = await tx.get(ref);

            if (!snap.exists) return;

            const doc = detailedReportDocSchema.parse(snap.data());

            if (doc.status !== 'GENERATING') return;

            const refund = await this.points.planRefund(tx, {
                uid,
                deductTransactionId: chargeTransactionId(reportId, doc.supersedesReportId),
                refundTransactionId: `refund_${reportId}`,
                reference: reportId,
            });

            refund?.apply();
            tx.update(ref, {
                status: 'FAILED', failureReason: reason,
            });
        });

        this.logWarn('report failed and refunded', {
            action: 'fail',
            userId: uid,
            data: {
                reportId, reason, detail: error ? errorMessage(error).slice(0, 200) : undefined,
            },
        });
    }

    /** A report whose worker vanished is failed (and refunded) when someone looks at it. */
    private async reapIfStale(uid: string, reportId: string, doc: DetailedReportDoc): Promise<DetailedReportDoc> {
        if (doc.status !== 'GENERATING' || this.clock() - doc.createdAt < REPORT_STALE_AFTER_MS) {
            return doc;
        }

        await this.fail(uid, reportId, 'STALE');

        return detailedReportDocSchema.parse((await this.repository.reportRef(uid, reportId).get()).data());
    }

    private async recordUsage(
        uid: string,
        reportId: string,
        modelName: string,
        usage: { inputTokens: number; outputTokens: number },
    ): Promise<void> {
        const price = this.pricing();
        const record: AiUsageRecord = {
            userId: uid,
            reportId,
            modelName,
            inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens,
            estimatedCost: (usage.inputTokens / 1_000_000) * price.inputPerMtok
                + (usage.outputTokens / 1_000_000) * price.outputPerMtok,
            createdAt: this.clock(),
        };

        await this.repository.usageRef().set(record);
    }

    private toItem(reportId: string, doc: DetailedReportDoc): ReportItem {
        return {
            reportId,
            status: doc.status,
            combinationKey: doc.combinationKey,
            sections: doc.sections,
            disclaimer: doc.disclaimer,
            modelName: doc.modelName,
            promptVersion: doc.promptVersion,
            supersedesReportId: doc.supersedesReportId,
            failureReason: doc.failureReason,
            createdAt: doc.createdAt,
            completedAt: doc.completedAt,
            expiresAt: doc.expiresAt,
        };
    }
}

