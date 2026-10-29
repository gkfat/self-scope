import {
    beforeEach, describe, expect, it, vi,
} from 'vitest';
import { FakeFirestore } from '../test-utils/fakeFirestore';
import { PointService } from './point.service';
import { RateLimitService } from './rateLimit.service';
import { ReportSnapshotService } from './reportSnapshot.service';
import { SingleAnalysisService } from './singleAnalysis.service';
import { assembleSingleReport } from '../../shared/report/assembleSingleReport';
import { bloodReportInput } from '../../shared/report/adapters/blood';
import {
    AiOutputError, type AiSingleAnalysisProvider, type AiSingleGeneration, type GenerateOptions,
} from '../ai/provider';
import { SINGLE_PROMPT_VERSION } from '../ai/singlePrompt';
import {
    REPORT_STALE_AFTER_MS, SINGLE_ANALYSIS_COST,
} from '../../shared/constants/ai';
import { fixedContentBodySchema } from '../../shared/schemas/firestore/fixedContent.schema';
import {
    SINGLE_ANALYSIS_SECTIONS, type SingleAnalysisInput,
} from '../../shared/schemas/firestore/singleAnalysis.schema';
import { DAY_MS } from '../../shared/utils/time';
import {
    ConflictError, InsufficientPointsError, NotFoundError,
} from '../../shared/types/errors';

const holder = vi.hoisted(() => ({ db: undefined as unknown }));

vi.mock('../utils/firebaseAdmin', () => ({ getAdminFirestore: () => holder.db }));

const NOW = Date.UTC(2026, 9, 28, 4);

const validOutput = () => ({
    sections: SINGLE_ANALYSIS_SECTIONS.map((section) => ({
        key: section.key,
        content: `這是「${section.title}」的內容，依你的報告來看，你可能比較偏好先觀察再行動，也傾向把事情想清楚。`,
        evidence: '依據報告裡血型的事實與歸納的面向',
    })),
});

class FakeAi implements AiSingleAnalysisProvider {
    calls: SingleAnalysisInput[] = [];
    behavior: (input: SingleAnalysisInput, options: GenerateOptions) => Promise<AiSingleGeneration> = async () => ({
        output: validOutput(),
        usage: {
            inputTokens: 600, outputTokens: 1500,
        },
        modelName: 'gpt-5-mini',
    });

    async generateSingle(input: SingleAnalysisInput, options: GenerateOptions) {
        this.calls.push(input);

        return this.behavior(input, options);
    }
}

const content = () => assembleSingleReport(bloodReportInput({
    bloodType: 'O',
    body: fixedContentBodySchema.parse({
        title: 'O 型',
        summary: 'O 型的簡述。',
        strengths: ['優勢一'],
        blindSpots: ['盲點一'],
        growthAdvice: '給自己一點時間。',
        disclaimer: '僅供娛樂與自我探索。',
    }),
}));

describe('SingleAnalysisService', () => {
    let db: FakeFirestore;
    let ai: FakeAi;
    let clock: { now: number };
    let pending: Array<Promise<void>>;
    let service: SingleAnalysisService;
    let snapshotId: string;

    const settle = async () => {
        await Promise.all(pending);
    };
    const points = async () => (await new PointService({ clock: () => clock.now }).getBalance('u1')).availableBalance;
    const snapshot = async () => (await db.doc(`users/u1/reportSnapshots/${snapshotId}`).get()).data();

    beforeEach(async () => {
        db = new FakeFirestore();
        holder.db = db;
        ai = new FakeAi();
        clock = { now: NOW };
        pending = [];
        service = new SingleAnalysisService({
            getProvider: () => ai,
            background: (task, onError) => {
                const promise = task().catch(onError);

                pending.push(promise);

                return promise;
            },
            points: new PointService({ clock: () => clock.now }),
            rateLimit: new RateLimitService({ clock: () => clock.now }),
            pricing: () => ({
                inputPerMtok: 0.1, outputPerMtok: 0.5,
            }),
            clock: () => clock.now,
        });

        await db.doc('users/u1').set({ email: 'a@example.com' });
        await db.doc('users/u1/pointBatches/b1').set({
            source: 'PURCHASE', sourceRef: null, granted: 5, remaining: 5, expiresAt: null, createdAt: NOW - DAY_MS,
        });
        snapshotId = (await new ReportSnapshotService({ clock: () => clock.now }).saveOrReuse('u1', content())).id;
    });

    it('charges 1 point, replies at once and writes the analysis beside the report in the background', async () => {
        const before = await snapshot();
        const accepted = await service.start('u1', snapshotId, 'key-aaaaaaaa');

        expect(accepted).toEqual({
            status: 'GENERATING', pointsDeducted: SINGLE_ANALYSIS_COST,
        });
        expect(await points()).toBe(4);

        await settle();

        const done = await snapshot();

        expect(done?.aiJob).toMatchObject({
            id: 'key-aaaaaaaa', status: 'COMPLETED', failureReason: null,
        });
        expect(done?.ai).toMatchObject({
            modelName: 'gpt-5-mini', promptVersion: SINGLE_PROMPT_VERSION, generatedAt: NOW,
        });
        expect((done?.ai as { blocks: unknown[] }).blocks).toHaveLength(SINGLE_ANALYSIS_SECTIONS.length);
        // The report itself is exactly as it was
        expect(done?.blocks).toEqual(before?.blocks);
        expect(done?.versions).toEqual(before?.versions);
    });

    it('marks every sentence of the analysis as an AI inference', async () => {
        await service.start('u1', snapshotId, 'key-aaaaaaaa');
        await settle();

        const blocks = ((await snapshot())?.ai as { blocks: Array<{ segments: Array<{ kind: string }> }> }).blocks;

        expect(blocks.flatMap((block) => block.segments.map((segment) => segment.kind))).toEqual(
            blocks.flatMap((block) => block.segments.map(() => 'AI_INFERENCE')),
        );
    });

    it('gives the model only the facts, facets and limits of the report', async () => {
        await service.start('u1', snapshotId, 'key-aaaaaaaa');
        await settle();

        const [input] = ai.calls;

        expect(Object.keys(input ?? {}).sort()).toEqual([
            'facets',
            'facts',
            'notes',
            'position',
            'system',
        ]);
        expect(input?.system).toBe('BLOOD');
        expect(input?.facts.length).toBeGreaterThan(0);
        expect(input?.notes.some((note) => note.startsWith('規則版本'))).toBe(false);
    });

    it('records the usage with an estimated cost', async () => {
        await service.start('u1', snapshotId, 'key-aaaaaaaa');
        await settle();

        const usage = db.paths().filter((p) => p.startsWith('aiUsageRecords/'));

        expect(usage).toHaveLength(1);
        expect((await db.doc(usage[0] as string).get()).data()).toMatchObject({
            userId: 'u1', reportId: snapshotId, inputTokens: 600, outputTokens: 1500,
        });
    });

    it('does not charge or generate twice for the same key', async () => {
        await service.start('u1', snapshotId, 'key-aaaaaaaa');
        const again = await service.start('u1', snapshotId, 'key-aaaaaaaa');
        await settle();

        expect(again.pointsDeducted).toBe(0);
        expect(await points()).toBe(4);
        expect(ai.calls).toHaveLength(1);
    });

    it('refuses a second analysis while one is being made', async () => {
        // The worker never runs, so the first analysis stays in progress
        service = new SingleAnalysisService({
            getProvider: () => ai,
            background: async () => undefined,
            points: new PointService({ clock: () => clock.now }),
            rateLimit: new RateLimitService({ clock: () => clock.now }),
            clock: () => clock.now,
        });
        await service.start('u1', snapshotId, 'key-aaaaaaaa');

        await expect(service.start('u1', snapshotId, 'key-bbbbbbbb')).rejects.toBeInstanceOf(ConflictError);
        expect(await points()).toBe(4);
    });

    it('replaces the earlier analysis when asked again after it is done, keeping the report', async () => {
        await service.start('u1', snapshotId, 'key-aaaaaaaa');
        await settle();
        clock.now += 1000;
        await service.start('u1', snapshotId, 'key-bbbbbbbb');
        await settle();

        const done = await snapshot();

        expect(done?.aiJob).toMatchObject({
            id: 'key-bbbbbbbb', status: 'COMPLETED',
        });
        expect(done?.ai).toMatchObject({ generatedAt: NOW + 1000 });
        expect(await points()).toBe(3);
    });

    it('turns away a member without enough points and changes nothing', async () => {
        await db.doc('users/u1/pointBatches/b1').update({ remaining: 0 });

        await expect(service.start('u1', snapshotId, 'key-aaaaaaaa')).rejects.toBeInstanceOf(InsufficientPointsError);

        expect((await snapshot())?.aiJob).toBeNull();
        expect(ai.calls).toHaveLength(0);
    });

    it('does not find the report of someone else, or one that has expired', async () => {
        await expect(service.start('u2', snapshotId, 'key-aaaaaaaa')).rejects.toBeInstanceOf(NotFoundError);

        clock.now += 400 * DAY_MS;
        await expect(service.start('u1', snapshotId, 'key-aaaaaaaa')).rejects.toBeInstanceOf(NotFoundError);
        expect(await points()).toBe(5);
    });

    describe('when the analysis fails', () => {
        const failed = async () => {
            await service.start('u1', snapshotId, 'key-aaaaaaaa');
            await settle();
        };

        it('refunds the point and leaves no analysis when the model errors', async () => {
            ai.behavior = async () => {
                throw new Error('boom');
            };
            await failed();

            expect(await points()).toBe(5);
            expect((await snapshot())?.aiJob).toMatchObject({
                status: 'FAILED', failureReason: 'AI_ERROR',
            });
            expect((await snapshot())?.ai).toBeNull();
        });

        it('says why when the model refuses', async () => {
            ai.behavior = async () => {
                throw new AiOutputError('REFUSED');
            };
            await failed();

            expect((await snapshot())?.aiJob).toMatchObject({ failureReason: 'REFUSED' });
            expect(await points()).toBe(5);
        });

        it('refunds when the answer fails the quality check (a diagnosis)', async () => {
            ai.behavior = async () => ({
                output: {
                    sections: validOutput().sections.map((section, index) => (index === 0
                        ? {
                            ...section, content: '你可能罹患憂鬱症，所以比較偏好先觀察再行動，也傾向把事情想清楚。',
                        }
                        : section)),
                },
                usage: {
                    inputTokens: 1, outputTokens: 1,
                },
                modelName: 'gpt-5-mini',
            });
            await failed();

            expect((await snapshot())?.aiJob).toMatchObject({
                status: 'FAILED', failureReason: 'INVALID_OUTPUT',
            });
            expect(await points()).toBe(5);
        });

        it('refunds when the answer has the wrong sections', async () => {
            ai.behavior = async () => ({
                output: { sections: validOutput().sections.slice(0, 2) },
                usage: {
                    inputTokens: 1, outputTokens: 1,
                },
                modelName: 'gpt-5-mini',
            });
            await failed();

            expect((await snapshot())?.aiJob).toMatchObject({ failureReason: 'INVALID_OUTPUT' });
            expect(await points()).toBe(5);
        });

        it('can be asked again after a failure, with a new key', async () => {
            ai.behavior = async () => {
                throw new Error('boom');
            };
            await failed();
            ai.behavior = async () => ({
                output: validOutput(),
                usage: {
                    inputTokens: 1, outputTokens: 1,
                },
                modelName: 'gpt-5-mini',
            });
            await service.start('u1', snapshotId, 'key-bbbbbbbb');
            await settle();

            expect((await snapshot())?.aiJob).toMatchObject({ status: 'COMPLETED' });
            expect(await points()).toBe(4);
        });
    });

    it('fails and refunds an analysis whose worker vanished, when the report is looked at', async () => {
        service = new SingleAnalysisService({
            getProvider: () => ai,
            background: async () => undefined,
            points: new PointService({ clock: () => clock.now }),
            rateLimit: new RateLimitService({ clock: () => clock.now }),
            clock: () => clock.now,
        });
        await service.start('u1', snapshotId, 'key-aaaaaaaa');
        expect(await points()).toBe(4);

        clock.now += REPORT_STALE_AFTER_MS + 1;
        await service.reapIfStale('u1', snapshotId);

        expect((await snapshot())?.aiJob).toMatchObject({
            status: 'FAILED', failureReason: 'STALE',
        });
        expect(await points()).toBe(5);
    });
});
