import { BaseService } from './base.service';
import { PointService } from './point.service';
import { RateLimitService } from './rateLimit.service';
import { ReportSnapshotRepository } from '../repositories/reportSnapshot.repository';
import { getAiProvider } from '../ai';
import {
    AiOutputError, type AiSingleAnalysisProvider,
} from '../ai/provider';
import { MULTI_PROMPT_VERSION } from '../ai/multiPrompt';
import {
    assessMultiAnalysis, assessSingleAnalysis, parseMultiAnalysisOutput, parseSingleAnalysisOutput,
} from '../ai/quality';
import { SINGLE_PROMPT_VERSION } from '../ai/singlePrompt';
import { getServerConfig } from '../../config/config';
import { runInBackground } from '../utils/background';
import {
    DEFAULT_AI_PRICE_INPUT_PER_MTOK, DEFAULT_AI_PRICE_OUTPUT_PER_MTOK, REPORT_LIMIT_PER_DAY, REPORT_LIMIT_PER_HOUR, REPORT_STALE_AFTER_MS,
    REPORT_TIMEOUT_MS, SINGLE_ANALYSIS_COST,
} from '../../shared/constants/ai';
import type { AiUsageRecord } from '../../shared/schemas/firestore/aiUsage.schema';
import {
    reportSnapshotDocSchema, type ReportSnapshotDoc, type SnapshotAiJob, type SnapshotBlock,
} from '../../shared/schemas/firestore/reportSnapshot.schema';
import {
    MULTI_ANALYSIS_KIND_TITLES, type MultiAnalysisInput, type MultiAnalysisOutput,
} from '../../shared/schemas/firestore/multiAnalysis.schema';
import {
    SINGLE_ANALYSIS_SECTIONS, type SingleAnalysisInput, type SingleAnalysisOutput,
} from '../../shared/schemas/firestore/singleAnalysis.schema';
import {
    MULTI_REPORT_SYSTEMS, type MultiReportSystem,
} from '../../shared/report/systems';
import { multiReportCost } from '../../shared/utils/multiDimensionPricing';
import {
    ConflictError, NotFoundError, ValidationError, errorMessage,
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

type Made = {
    failed: true;
} | {
    failed: false; blocks: SnapshotBlock[]; modelName: string; promptVersion: string;
};

const aiSegment = (text: string, sources: SnapshotBlock['segments'][number]['sources']): SnapshotBlock['segments'][number] => ({
    text, kind: 'AI_INFERENCE', sources, timeSensitive: false, asOf: null,
});

/** The sections of a single report's analysis as blocks: each part and the facts it rests on, all marked as the AI's inference. */
function singleBlocks(output: SingleAnalysisOutput, system: SnapshotBlock['segments'][number]['sources'][number]['system']): SnapshotBlock[] {
    const titles = new Map<string, string>(SINGLE_ANALYSIS_SECTIONS.map((section) => [section.key, section.title]));
    const sources = system ? [{ system }] : [];

    return output.sections.map((section) => ({
        key: `ai:${section.key}`,
        title: titles.get(section.key) ?? section.key,
        segments: [aiSegment(section.content, sources), aiSegment(`依據：${section.evidence}`, sources)],
    }));
}

/** The parts of a multi-dimension analysis as blocks; every segment cites the rules (candidates) it rests on. */
function multiBlocks(output: MultiAnalysisOutput): SnapshotBlock[] {
    return ([
        'overview',
        'insight',
        'advice',
    ] as const).flatMap((kind) => {
        const sections = output.sections.filter((section) => section.kind === kind);

        return sections.length > 0 ? [
            {
                key: `ai:${kind}`,
                title: MULTI_ANALYSIS_KIND_TITLES[kind],
                segments: sections.flatMap((section) => {
                    const sources = section.candidateIds.map((rule) => ({ rule }));

                    return [aiSegment(section.content, sources), aiSegment(`依據：${section.evidence}`, sources)];
                }),
            },
        ] : [];
    });
}

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
        const cost = this.costOf(before);

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
                amount: cost,
                reason: before.kind === 'SINGLE' ? 'SINGLE_AI_ANALYSIS' : 'MULTI_REPORT',
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
            status: 'GENERATING', pointsDeducted: cost,
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

    /** A single report costs one point; a multi-dimension report costs what its systems add up to. */
    private costOf(doc: ReportSnapshotDoc): number {
        if (doc.kind === 'SINGLE') return SINGLE_ANALYSIS_COST;

        const cost = multiReportCost(doc.systems.filter((system): system is MultiReportSystem => (MULTI_REPORT_SYSTEMS as readonly string[]).includes(system)));

        if (cost === null) throw new ValidationError('This choice of systems is not offered');

        return cost;
    }

    /** The facts and facets of a single report, as its own sentences: nothing the member typed. */
    private singleInputOf(doc: ReportSnapshotDoc): SingleAnalysisInput {
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

    /** The candidates of a multi-dimension report are the insights the rules put in it, each under the id of its rule. */
    private multiInputOf(doc: ReportSnapshotDoc): MultiAnalysisInput {
        const insights = doc.blocks.find((item) => item.key === 'insights')?.segments ?? [];

        return {
            systems: doc.systems,
            positions: textsOf(doc, 'coordinates'),
            facts: [...textsOf(doc, 'highlights', 'FACT'), ...textsOf(doc, 'now')],
            candidates: insights.flatMap((item) => {
                const id = item.sources.find((source) => source.rule)?.rule;

                return id && item.confirmQuestion ? [
                    {
                        id,
                        text: item.text,
                        hypothesis: item.confirmQuestion,
                        sources: item.sources.flatMap((source) => (source.term ? [source.term] : [])),
                    },
                ] : [];
            }),
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
            const made = doc.kind === 'SINGLE' ? await this.makeSingle(doc, controller.signal, uid, snapshotId) : await this.makeMulti(doc, controller.signal, uid, snapshotId);

            if (made.failed) {
                await this.fail(uid, snapshotId, jobId, 'INVALID_OUTPUT');

                return;
            }

            await this.complete(uid, snapshotId, jobId, made.blocks, made.modelName, made.promptVersion);
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

    /** The analysis of a single report: ask, check, and turn the sections into blocks. */
    private async makeSingle(doc: ReportSnapshotDoc, signal: AbortSignal, uid: string, snapshotId: string): Promise<Made> {
        const generation = await this.getProvider().generateSingle(this.singleInputOf(doc), { signal });

        await this.recordUsage(uid, snapshotId, generation.modelName, generation.usage);

        const output = parseSingleAnalysisOutput(generation.output);
        const quality = output ? assessSingleAnalysis(output) : null;

        if (!output || !quality || quality.fatal.length > 0) {
            this.logRejected(uid, snapshotId, quality?.fatal.map((finding) => finding.code) ?? ['SCHEMA']);

            return { failed: true };
        }

        const [system] = doc.systems;

        return {
            failed: false,
            blocks: singleBlocks(output, system),
            modelName: generation.modelName,
            promptVersion: SINGLE_PROMPT_VERSION,
        };
    }

    /** The analysis of a multi-dimension report: every part has to cite candidates the rules really found. */
    private async makeMulti(doc: ReportSnapshotDoc, signal: AbortSignal, uid: string, snapshotId: string): Promise<Made> {
        const input = this.multiInputOf(doc);
        const generation = await this.getProvider().generateMulti(input, { signal });

        await this.recordUsage(uid, snapshotId, generation.modelName, generation.usage);

        const output = parseMultiAnalysisOutput(generation.output);
        const quality = output ? assessMultiAnalysis(output, input.candidates.map((candidate) => candidate.id)) : null;

        if (!output || !quality || quality.fatal.length > 0) {
            this.logRejected(uid, snapshotId, quality?.fatal.map((finding) => finding.code) ?? ['SCHEMA']);

            return { failed: true };
        }

        return {
            failed: false,
            blocks: multiBlocks(output),
            modelName: generation.modelName,
            promptVersion: MULTI_PROMPT_VERSION,
        };
    }

    private logRejected(uid: string, snapshotId: string, codes: string[]): void {
        this.logWarn('analysis rejected by quality checks', {
            action: 'generate', userId: uid, data: {
                snapshotId, codes,
            },
        });
    }

    private async complete(uid: string, snapshotId: string, jobId: string, blocks: SnapshotBlock[], modelName: string, promptVersion: string): Promise<void> {
        const ref = this.repository.snapshotRef(uid, snapshotId);
        const now = this.clock();

        await this.repository.runTransaction(async (tx) => {
            const snap = await tx.get(ref);

            if (!snap.exists) return;

            const doc = reportSnapshotDocSchema.parse(snap.data());

            // It may have been failed meanwhile (stale reaper) or the report may be gone; never overwrite that
            if (doc.aiJob?.id !== jobId || doc.aiJob.status !== 'GENERATING') return;

            tx.update(ref, {
                ai: {
                    blocks, modelName, promptVersion, generatedAt: now,
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
