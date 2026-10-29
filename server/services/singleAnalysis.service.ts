import { BaseService } from './base.service';
import { PointService } from './point.service';
import { RateLimitService } from './rateLimit.service';
import { ReportSnapshotRepository } from '../repositories/reportSnapshot.repository';
import { getAiProvider } from '../ai';
import {
    AiOutputError, type AiSingleAnalysisProvider,
} from '../ai/provider';
import {
    assessSingleAnalysis, parseSingleAnalysisOutput,
} from '../ai/quality';
import { SINGLE_PROMPT_VERSION } from '../ai/singlePrompt';
import { getServerConfig } from '../../config/config';
import { runInBackground } from '../utils/background';
import {
    DEFAULT_AI_PRICE_INPUT_PER_MTOK, DEFAULT_AI_PRICE_OUTPUT_PER_MTOK, REPORT_LIMIT_PER_DAY, REPORT_LIMIT_PER_HOUR, REPORT_STALE_AFTER_MS,
    REPORT_TIMEOUT_MS, SINGLE_ANALYSIS_COST,
} from '../../shared/constants/ai';
import type { AiUsageRecord } from '../../shared/schemas/firestore/detailedReport.schema';
import {
    reportSnapshotDocSchema, type ReportSnapshotDoc, type SnapshotAiJob, type SnapshotBlock,
} from '../../shared/schemas/firestore/reportSnapshot.schema';
import {
    SINGLE_ANALYSIS_SECTIONS, type SingleAnalysisInput, type SingleAnalysisOutput,
} from '../../shared/schemas/firestore/singleAnalysis.schema';
import {
    ConflictError, NotFoundError, errorMessage,
} from '../../shared/types/errors';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

type Pricing = {
    inputPerMtok: number;
    outputPerMtok: number;
};

type SingleAnalysisServiceOptions = {
    repository?: ReportSnapshotRepository;
    points?: PointService;
    rateLimit?: RateLimitService;
    getProvider?: () => AiSingleAnalysisProvider;
    /** Runs the generation after the response; replaced in tests so they can wait for it. */
    background?: (task: () => Promise<void>, onError: (error: unknown) => void) => Promise<void>;
    pricing?: () => Pricing;
    timeoutMs?: number;
    clock?: () => number;
};

type FailureReason = 'TIMEOUT' | 'AI_ERROR' | 'INVALID_OUTPUT' | 'REFUSED' | 'TRUNCATED' | 'UNPARSEABLE' | 'STALE';

const chargeTransactionId = (jobId: string) => `single_ai_${jobId}`;

/** The sentences of a block of the report, when it has any. */
const textsOf = (doc: ReportSnapshotDoc, key: string, kind?: string): string[] => doc.blocks
    .filter((block) => block.key === key)
    .flatMap((block) => block.segments.filter((segment) => !kind || segment.kind === kind).map((segment) => segment.text));

/**
 * The AI analysis of a report that is already kept: 1 point, made after the response, written into the report's own
 * `ai` field (the base report is never touched), given back when it fails. The Idempotency-Key is the job id, so the
 * same key never charges or generates twice. What the model sees is only the facts and facets of that report.
 */
export class SingleAnalysisService extends BaseService {
    protected serviceName = 'single-analysis';

    private readonly repository: ReportSnapshotRepository;
    private readonly points: PointService;
    private readonly rateLimit: RateLimitService;
    private readonly getProvider: () => AiSingleAnalysisProvider;
    private readonly background: NonNullable<SingleAnalysisServiceOptions['background']>;
    private readonly pricing: () => Pricing;
    private readonly timeoutMs: number;
    private readonly clock: () => number;

    constructor(options: SingleAnalysisServiceOptions = {}) {
        super();
        this.repository = options.repository ?? new ReportSnapshotRepository();
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
     * Charge 1 point and start the analysis of one of the member's reports. A retry with the same key only says where
     * the first request got to. Asking again with a new key replaces the earlier analysis once it is done.
     */
    async start(uid: string, snapshotId: string, jobId: string): Promise<{ status: SnapshotAiJob['status']; pointsDeducted: number }> {
        const ref = this.repository.snapshotRef(uid, snapshotId);

        await this.reapIfStale(uid, snapshotId);

        const before = await this.read(uid, snapshotId);

        if (before.aiJob?.id === jobId) {
            return {
                status: before.aiJob.status, pointsDeducted: 0,
            };
        }

        await this.rateLimit.consume(`single_ai_hour_${uid}`, REPORT_LIMIT_PER_HOUR, HOUR_MS);
        await this.rateLimit.consume(`single_ai_day_${uid}`, REPORT_LIMIT_PER_DAY, DAY_MS);

        const now = this.clock();

        const outcome = await this.repository.runTransaction(async (tx) => {
            const snap = await tx.get(ref);

            if (!snap.exists) throw new NotFoundError('Report snapshot');

            const doc = reportSnapshotDocSchema.parse(snap.data());

            if (doc.expiresAt <= now) throw new NotFoundError('Report snapshot');

            // Lost a race with the same key: its winner is generating
            if (doc.aiJob?.id === jobId) return {
                started: false, status: doc.aiJob.status,
            };

            if (doc.aiJob?.status === 'GENERATING') {
                throw new ConflictError('An analysis of this report is already being made');
            }

            const plan = await this.points.planDeduction(tx, {
                uid,
                amount: SINGLE_ANALYSIS_COST,
                reason: 'SINGLE_AI_ANALYSIS',
                transactionId: chargeTransactionId(jobId),
                reference: snapshotId,
            });

            plan.apply();
            tx.update(ref, {
                aiJob: {
                    id: jobId, status: 'GENERATING', failureReason: null, createdAt: now,
                } satisfies SnapshotAiJob,
            });

            return {
                started: true, status: 'GENERATING' as const,
            };
        });

        if (!outcome.started) {
            return {
                status: outcome.status, pointsDeducted: 0,
            };
        }

        this.logInfo('ai analysis accepted', {
            action: 'start', userId: uid, data: { snapshotId },
        });

        void this.background(
            () => this.generate(uid, snapshotId, jobId),
            (error) => this.logError('background analysis crashed', {
                action: 'generate', userId: uid, data: { snapshotId }, error,
            }),
        );

        return {
            status: 'GENERATING', pointsDeducted: SINGLE_ANALYSIS_COST,
        };
    }

    /** An analysis whose worker vanished is failed (and refunded) when someone looks at the report. */
    async reapIfStale(uid: string, snapshotId: string): Promise<void> {
        const snap = await this.repository.snapshotRef(uid, snapshotId).get();

        if (!snap.exists) return;

        const { aiJob } = reportSnapshotDocSchema.parse(snap.data());

        if (aiJob?.status !== 'GENERATING' || this.clock() - aiJob.createdAt < REPORT_STALE_AFTER_MS) return;

        await this.fail(uid, snapshotId, aiJob.id, 'STALE');
    }

    private async read(uid: string, snapshotId: string): Promise<ReportSnapshotDoc> {
        const snap = await this.repository.snapshotRef(uid, snapshotId).get();

        if (!snap.exists) throw new NotFoundError('Report snapshot');

        const doc = reportSnapshotDocSchema.parse(snap.data());

        if (doc.expiresAt <= this.clock()) throw new NotFoundError('Report snapshot');

        return doc;
    }

    /** The facts and facets of the report, as its own sentences: nothing the member typed. */
    private inputOf(doc: ReportSnapshotDoc): SingleAnalysisInput {
        const [system] = doc.systems;

        if (!system) throw new NotFoundError('Report snapshot');

        return {
            system,
            position: doc.position,
            facts: [...textsOf(doc, 'facts', 'FACT'), ...textsOf(doc, 'time', 'FACT')],
            facets: textsOf(doc, 'summary'),
            notes: textsOf(doc, 'limits').filter((text) => !text.startsWith('規則版本')),
        };
    }

    /** The background job: ask the model, check the answer, then complete or fail-and-refund. Never throws. */
    private async generate(uid: string, snapshotId: string, jobId: string): Promise<void> {
        const doc = await this.read(uid, snapshotId);

        if (doc.aiJob?.id !== jobId || doc.aiJob.status !== 'GENERATING') return;

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
            const generation = await this.getProvider().generateSingle(this.inputOf(doc), { signal: controller.signal });

            await this.recordUsage(uid, snapshotId, generation.modelName, generation.usage);

            const output = parseSingleAnalysisOutput(generation.output);
            const quality = output ? assessSingleAnalysis(output) : null;

            if (!output || !quality || quality.fatal.length > 0) {
                this.logWarn('analysis rejected by quality checks', {
                    action: 'generate',
                    userId: uid,
                    data: {
                        snapshotId, codes: quality?.fatal.map((finding) => finding.code) ?? ['SCHEMA'],
                    },
                });
                await this.fail(uid, snapshotId, jobId, 'INVALID_OUTPUT');

                return;
            }

            await this.complete(uid, snapshotId, jobId, output, generation.modelName);
        } catch (error) {
            await this.fail(uid, snapshotId, jobId, this.reasonFor(error, controller.signal), error);
        } finally {
            clearTimeout(timer);
        }
    }

    private reasonFor(error: unknown, signal: AbortSignal): FailureReason {
        if (signal.aborted) return 'TIMEOUT';
        if (error instanceof AiOutputError) return error.reason;

        return 'AI_ERROR';
    }

    private async complete(uid: string, snapshotId: string, jobId: string, output: SingleAnalysisOutput, modelName: string): Promise<void> {
        const ref = this.repository.snapshotRef(uid, snapshotId);
        const now = this.clock();

        await this.repository.runTransaction(async (tx) => {
            const snap = await tx.get(ref);

            if (!snap.exists) return;

            const doc = reportSnapshotDocSchema.parse(snap.data());
            const [system] = doc.systems;

            // It may have been failed meanwhile (stale reaper) or the report may be gone; never overwrite that
            if (!system || doc.aiJob?.id !== jobId || doc.aiJob.status !== 'GENERATING') return;

            const titles = new Map<string, string>(SINGLE_ANALYSIS_SECTIONS.map((section) => [section.key, section.title]));
            const blocks: SnapshotBlock[] = output.sections.map((section) => {
                const common = {
                    kind: 'AI_INFERENCE' as const, sources: [{ system }], timeSensitive: false, asOf: null,
                };

                return {
                    key: `ai:${section.key}`,
                    title: titles.get(section.key) ?? section.key,
                    segments: [
                        {
                            text: section.content, ...common,
                        }, {
                            text: `依據：${section.evidence}`, ...common,
                        },
                    ],
                };
            });

            tx.update(ref, {
                ai: {
                    blocks, modelName, promptVersion: SINGLE_PROMPT_VERSION, generatedAt: now,
                },
                aiJob: {
                    ...doc.aiJob, status: 'COMPLETED',
                } satisfies SnapshotAiJob,
            });
        });
    }

    /** Mark the job failed and give the point back, in one transaction so the refund happens exactly once. */
    private async fail(uid: string, snapshotId: string, jobId: string, reason: FailureReason, error?: unknown): Promise<void> {
        const ref = this.repository.snapshotRef(uid, snapshotId);

        await this.repository.runTransaction(async (tx) => {
            const snap = await tx.get(ref);

            if (!snap.exists) return;

            const doc = reportSnapshotDocSchema.parse(snap.data());

            if (doc.aiJob?.id !== jobId || doc.aiJob.status !== 'GENERATING') return;

            const refund = await this.points.planRefund(tx, {
                uid,
                deductTransactionId: chargeTransactionId(jobId),
                refundTransactionId: `refund_single_ai_${jobId}`,
                reference: snapshotId,
            });

            refund?.apply();
            tx.update(ref, {
                aiJob: {
                    ...doc.aiJob, status: 'FAILED', failureReason: reason,
                } satisfies SnapshotAiJob,
            });
        });

        this.logWarn('analysis failed and refunded', {
            action: 'fail',
            userId: uid,
            data: {
                snapshotId, reason, detail: error ? errorMessage(error).slice(0, 200) : undefined,
            },
        });
    }

    private async recordUsage(uid: string, snapshotId: string, modelName: string, usage: {
        inputTokens: number; outputTokens: number;
    }): Promise<void> {
        const price = this.pricing();
        const record: AiUsageRecord = {
            userId: uid,
            reportId: snapshotId,
            modelName,
            inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens,
            estimatedCost: (usage.inputTokens / 1_000_000) * price.inputPerMtok + (usage.outputTokens / 1_000_000) * price.outputPerMtok,
            createdAt: this.clock(),
        };

        await this.repository.usageRef().set(record);
    }
}
