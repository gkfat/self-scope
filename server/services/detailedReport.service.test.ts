import {
    beforeEach, describe, expect, it, vi,
} from 'vitest';
import definition from '../../content/tests/personality16-v1.json';
import { FakeFirestore } from '../test-utils/fakeFirestore';
import { calculateHumanDesign } from '../humanDesign/calculate';
import { DetailedReportService } from './detailedReport.service';
import { PointService } from './point.service';
import { RateLimitService } from './rateLimit.service';
import {
    AiOutputError, type AiGeneration, type AiReportProvider, type GenerateOptions,
} from '../ai/provider';
import { PROMPT_VERSION } from '../ai/prompt';
import {
    InsufficientPointsError, NotFoundError, RateLimitError, UnprocessableError,
} from '../../shared/types/errors';
import {
    REPORT_SECTIONS, type AnalysisInput,
} from '../../shared/schemas/firestore/detailedReport.schema';
import { testDefinitionFileSchema } from '../../shared/schemas/firestore/test.schema';
import { REPORT_STALE_AFTER_MS } from '../../shared/constants/ai';
import {
    DAY_MS, addMonths,
} from '../../shared/utils/time';

const holder = vi.hoisted(() => ({ db: undefined as unknown }));

vi.mock('../utils/firebaseAdmin', () => ({ getAdminFirestore: () => holder.db }));

const NOW = Date.UTC(2026, 0, 15, 12);
const {
    questions, scoringRule, 
} = testDefinitionFileSchema.parse(definition);

const validOutput = () => ({
    sections: REPORT_SECTIONS.map((section, index) => ({
        key: section.key,
        content: `這是「${section.title}」的內容，依你提供的資料來看，你可能比較偏好先觀察再行動（第 ${index} 段）。`,
        evidence: '依據你的 MBTI 結果與各向度的傾向分數',
        evidenceKind: index % 2 === 0 ? ('OBSERVED' as const) : ('INFERRED' as const),
    })),
});

class FakeAi implements AiReportProvider {
    calls: AnalysisInput[] = [];
    behavior: (input: AnalysisInput, options: GenerateOptions) => Promise<AiGeneration> = async () => ({
        output: validOutput(),
        usage: {
            inputTokens: 900, outputTokens: 2500,
        },
        modelName: 'gpt-5-mini',
    });

    async generate(input: AnalysisInput, options: GenerateOptions) {
        this.calls.push(input);

        return this.behavior(input, options);
    }
}

const user = (overrides: Record<string, unknown> = {}) => ({
    email: 'a@example.com',
    birthData: {
        birthDate: '1995-03-25', zodiac: 'aries', birthTime: null, birthPlace: null,
    },
    bloodType: 'O',
    mbti: 'INTJ',
    mbtiExpiresAt: addMonths(NOW, 2),
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
});

describe('DetailedReportService', () => {
    let db: FakeFirestore;
    let ai: FakeAi;
    let clock: { now: number };
    let pending: Array<Promise<void>>;
    let service: DetailedReportService;

    const settle = async () => {
        await Promise.all(pending);
    };

    const makeService = (extra: { timeoutMs?: number } = {}) => new DetailedReportService({
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
        ...extra,
    });

    const points = async () => (await new PointService({ clock: () => clock.now }).getBalance('u1')).availableBalance;
    const request = {
        includeBloodType: true, includeHumanDesign: false, 
    };
    const report = async (id: string, uid = 'u1') => (await db.doc(`users/${uid}/detailedReports/${id}`).get()).data();
    const chargeDocs = () => db.paths().filter((p) => p.includes('/pointTransactions/'));

    beforeEach(async () => {
        db = new FakeFirestore();
        holder.db = db;
        ai = new FakeAi();
        clock = { now: NOW };
        pending = [];
        service = makeService();

        await db.doc('users/u1').set(user());
        await db.doc('users/u1/pointBatches/b1').set({
            source: 'PURCHASE', sourceRef: null, granted: 20, remaining: 20, expiresAt: null, createdAt: NOW - DAY_MS,
        });
    });

    describe('create', () => {
        it('charges 5 points, replies at once and completes the report in the background', async () => {
            const accepted = await service.create('u1', request, 'key-aaaaaaaa');

            expect(accepted).toEqual({
                reportId: 'key-aaaaaaaa', status: 'GENERATING', pointsDeducted: 5,
            });
            expect(await points()).toBe(15);
            expect((await report('key-aaaaaaaa'))?.status).toBe('GENERATING');

            await settle();

            const done = await report('key-aaaaaaaa');
            expect(done).toMatchObject({
                status: 'COMPLETED',
                modelName: 'gpt-5-mini',
                promptVersion: PROMPT_VERSION,
                completedAt: NOW,
                failureReason: null,
            });
            expect(done?.expiresAt).toBe(addMonths(NOW, 6));
            expect((done?.sections as unknown[]).length).toBe(8);
            expect((done?.sections as Array<{ title: string }>)[0]?.title).toBe('個人概況摘要');
            expect(String(done?.disclaimer)).toContain('娛樂與自我探索');
        });

        it('records usage and an estimated cost', async () => {
            await service.create('u1', request, 'key-aaaaaaaa');
            await settle();

            const usage = db.paths().filter((p) => p.startsWith('aiUsageRecords/'));
            expect(usage).toHaveLength(1);

            const record = (await db.doc(usage[0] as string).get()).data();
            expect(record).toMatchObject({
                userId: 'u1', reportId: 'key-aaaaaaaa', modelName: 'gpt-5-mini', inputTokens: 900, outputTokens: 2500,
            });
            expect(record?.estimatedCost).toBeCloseTo(0.00134, 6);
        });

        it('gives the model plain facts, including the latest test\'s dimension scores', async () => {
            await db.doc('users/u1/testAttempts/t1').set({
                testId: 'personality16',
                testVersion: '1',
                answers: questions.map((q) => ({
                    questionId: q.questionId, value: q.direction === 'first' ? 5 : 1, responseTimeMs: null,
                })),
                result: 'ESTJ',
                completedAt: NOW - 1000,
                expiresAt: addMonths(NOW, 3),
            });
            await db.doc('tests/personality16/versions/1').set({
                questions, scoringRule, publishedAt: NOW,
            });

            await service.create('u1', request, 'key-aaaaaaaa');
            await settle();

            const input = ai.calls[0];
            expect(input?.profile).toEqual({
                zodiac: 'aries', bloodType: 'O', mbti: 'INTJ',
            });
            expect(input?.test?.dimensions.EI?.leaning).toBe('E');
            expect(JSON.stringify(input)).not.toMatch(/u1|email|questionId/);
        });

        it('leaves blood type out when the member does not want it used', async () => {
            await service.create('u1', {
                includeBloodType: false, includeHumanDesign: false,
            }, 'key-aaaaaaaa');
            await settle();

            expect(ai.calls[0]?.profile.bloodType).toBeNull();
        });

        it('refuses without charging when the member has not enough points', async () => {
            await db.doc('users/u1/pointBatches/b1').update({ remaining: 4 });

            await expect(service.create('u1', request, 'key-aaaaaaaa')).rejects.toBeInstanceOf(InsufficientPointsError);

            expect(await report('key-aaaaaaaa')).toBeUndefined();
            expect(chargeDocs()).toEqual([]);
            expect(ai.calls).toHaveLength(0);
        });

        it('asks for the missing piece instead of generating (422)', async () => {
            await db.doc('users/u1').update({
                mbti: null, mbtiExpiresAt: null,
            });
            await expect(service.create('u1', request, 'key-aaaaaaaa')).rejects.toMatchObject({
                statusCode: 422, code: 'MBTI_REQUIRED',
            });

            await db.doc('users/u1').update({ birthData: null });
            await expect(service.create('u1', request, 'key-bbbbbbbb')).rejects.toMatchObject({ code: 'PROFILE_REQUIRED' });

            expect(await points()).toBe(20);
            expect(ai.calls).toHaveLength(0);
        });

        it('asks for the human design when it is requested but not saved', async () => {
            await expect(service.create('u1', {
                includeBloodType: true, includeHumanDesign: true,
            }, 'key-aaaaaaaa')).rejects.toMatchObject({ code: 'HUMAN_DESIGN_REQUIRED' });
            expect(await points()).toBe(20);
        });

        it('uses a saved human design as an input and records its type', async () => {
            const chart = calculateHumanDesign('1995-03-25', '14:30', 'Asia/Taipei');

            await db.doc('users/u1/humanDesign/main').set({
                result: chart,
                inputDigest: 'digest',
                calculatedAt: NOW,
                expiresAt: addMonths(NOW, 3),
            });

            await service.create('u1', {
                includeBloodType: true, includeHumanDesign: true,
            }, 'key-aaaaaaaa');
            await settle();

            // chart-level facts only, not the raw gate activations
            expect(ai.calls[0]?.humanDesign).toEqual({
                type: chart.type,
                strategy: chart.strategy,
                authority: chart.authority,
                profile: chart.profile,
                definition: chart.definition,
                incarnationCross: chart.incarnationCross,
                definedCenters: chart.definedCenters,
                channels: chart.channels,
            });
            expect(((await report('key-aaaaaaaa'))?.combinationKey as { humanDesignType: string }).humanDesignType).toBe(chart.type);
        });

        it('recalculates a chart whose birth data changed before using it', async () => {
            const stale = calculateHumanDesign('1996-10-27', '01:30', 'Europe/London');

            await db.doc('users/u1').update({
                birthData: {
                    birthDate: '1990-06-15', zodiac: 'gemini', birthTime: '12:00', birthPlace: 'es-madrid',
                },
            });
            await db.doc('users/u1/humanDesign/main').set({
                result: stale,
                inputDigest: 'calculated-from-old-birth-data',
                calculatedAt: NOW,
                expiresAt: addMonths(NOW, 3),
            });

            await service.create('u1', {
                includeBloodType: true, includeHumanDesign: true,
            }, 'key-aaaaaaaa');
            await settle();

            expect(ai.calls[0]?.humanDesign).toMatchObject({ profile: '2/4' });
        });

        it('treats a repeated Idempotency-Key as the same request', async () => {
            await service.create('u1', request, 'key-aaaaaaaa');
            await settle();
            const again = await service.create('u1', request, 'key-aaaaaaaa');

            expect(again).toEqual({
                reportId: 'key-aaaaaaaa', status: 'COMPLETED', pointsDeducted: 0,
            });
            expect(await points()).toBe(15);
            expect(ai.calls).toHaveLength(1);
        });

        it('charges and generates once when the same key arrives concurrently', async () => {
            const results = await Promise.allSettled(Array.from({ length: 3 }, () => service.create('u1', request, 'key-aaaaaaaa')));
            await settle();

            expect(results.every((r) => r.status === 'fulfilled')).toBe(true);
            expect(await points()).toBe(15);
            expect(chargeDocs()).toHaveLength(1);
            expect(ai.calls).toHaveLength(1);
        });

        it('stops at 3 generations an hour without charging the 4th', async () => {
            for (const key of [
                'key-00000001',
                'key-00000002',
                'key-00000003',
            ]) {
                await service.create('u1', request, key);
            }

            await expect(service.create('u1', request, 'key-00000004')).rejects.toBeInstanceOf(RateLimitError);
            await settle();

            expect(await points()).toBe(5);
            expect(await report('key-00000004')).toBeUndefined();
        });
    });

    describe('when generation goes wrong', () => {
        const refundDocs = () => db.paths().filter((p) => p.includes('pointTransactions/refund_'));

        it('fails and refunds when the model throws', async () => {
            ai.behavior = async () => {
                throw new Error('overloaded');
            };

            await service.create('u1', request, 'key-aaaaaaaa');
            await settle();

            expect(await report('key-aaaaaaaa')).toMatchObject({
                status: 'FAILED', failureReason: 'AI_ERROR',
            });
            expect(await points()).toBe(20);
            expect(refundDocs()).toHaveLength(1);
        });

        it('keeps the reason when the model refuses or is cut off', async () => {
            ai.behavior = async () => {
                throw new AiOutputError('REFUSED');
            };
            await service.create('u1', request, 'key-aaaaaaaa');
            await settle();

            expect((await report('key-aaaaaaaa'))?.failureReason).toBe('REFUSED');
            expect(await points()).toBe(20);
        });

        it('fails, refunds and still records usage when the answer breaks the content rules', async () => {
            ai.behavior = async () => {
                const output = validOutput();
                output.sections[1] = {
                    ...output.sections[1]!, content: `${output.sections[1]!.content}這可能代表憂鬱症的傾向。`,
                };

                return {
                    output,
                    usage: {
                        inputTokens: 800, outputTokens: 2000,
                    },
                    modelName: 'gpt-5-mini',
                };
            };

            await service.create('u1', request, 'key-aaaaaaaa');
            await settle();

            expect(await report('key-aaaaaaaa')).toMatchObject({
                status: 'FAILED', failureReason: 'INVALID_OUTPUT', sections: [],
            });
            expect(await points()).toBe(20);
            expect(db.paths().filter((p) => p.startsWith('aiUsageRecords/'))).toHaveLength(1);
        });

        it('fails and refunds when the answer does not match the report shape', async () => {
            ai.behavior = async () => ({
                output: { sections: [] },
                usage: {
                    inputTokens: 1, outputTokens: 1,
                },
                modelName: 'm',
            });

            await service.create('u1', request, 'key-aaaaaaaa');
            await settle();

            expect((await report('key-aaaaaaaa'))?.failureReason).toBe('INVALID_OUTPUT');
            expect(await points()).toBe(20);
        });

        it('gives up on a slow model, then fails and refunds', async () => {
            service = makeService({ timeoutMs: 20 });
            ai.behavior = (_input, { signal }) => new Promise((_resolve, reject) => {
                signal.addEventListener('abort', () => reject(new Error('aborted')));
            });

            await service.create('u1', request, 'key-aaaaaaaa');
            await settle();

            expect(await report('key-aaaaaaaa')).toMatchObject({
                status: 'FAILED', failureReason: 'TIMEOUT',
            });
            expect(await points()).toBe(20);
        });

        it('lets the member read the failure and try again with a new key', async () => {
            ai.behavior = async () => {
                throw new Error('overloaded');
            };
            await service.create('u1', request, 'key-aaaaaaaa');
            await settle();

            expect((await service.get('u1', 'key-aaaaaaaa')).failureReason).toBe('AI_ERROR');

            ai.behavior = async () => ({
                output: validOutput(),
                usage: {
                    inputTokens: 1, outputTokens: 1,
                },
                modelName: 'm',
            });
            await service.create('u1', request, 'key-bbbbbbbb');
            await settle();

            expect((await report('key-bbbbbbbb'))?.status).toBe('COMPLETED');
            expect(await points()).toBe(15);
        });
    });

    describe('a report whose worker disappeared', () => {
        const stuck = async () => {
            await service.create('u1', request, 'key-aaaaaaaa');
            await settle();
            await db.doc('users/u1/detailedReports/key-aaaaaaaa').update({
                status: 'GENERATING', sections: [], completedAt: null, expiresAt: null,
            });
        };

        it('is left alone while it could still be running', async () => {
            await stuck();
            clock.now += REPORT_STALE_AFTER_MS - 1000;

            expect((await service.get('u1', 'key-aaaaaaaa')).status).toBe('GENERATING');
        });

        it('is failed and refunded the next time it is read, only once', async () => {
            await stuck();
            const before = await points();
            clock.now += REPORT_STALE_AFTER_MS + 1000;

            const first = await service.get('u1', 'key-aaaaaaaa');
            const second = await service.get('u1', 'key-aaaaaaaa');
            await service.list('u1');

            expect(first).toMatchObject({
                status: 'FAILED', failureReason: 'STALE',
            });
            expect(second.status).toBe('FAILED');
            expect(await points()).toBe(before + 5);
        });
    });

    describe('regenerate', () => {
        beforeEach(async () => {
            await service.create('u1', request, 'key-aaaaaaaa');
            await settle();
        });

        it('charges again, makes a new report and keeps the old one', async () => {
            const accepted = await service.regenerate('u1', 'key-aaaaaaaa', 'key-bbbbbbbb');
            await settle();

            expect(accepted).toEqual({
                reportId: 'key-bbbbbbbb', status: 'GENERATING', pointsDeducted: 5,
            });
            expect(await points()).toBe(10);
            expect((await report('key-aaaaaaaa'))?.status).toBe('COMPLETED');
            expect(await report('key-bbbbbbbb')).toMatchObject({
                status: 'COMPLETED', supersedesReportId: 'key-aaaaaaaa',
            });
            expect(db.paths()).toContain('users/u1/pointTransactions/regenerate_key-bbbbbbbb');
        });

        it('uses the member\'s current data', async () => {
            await db.doc('users/u1').update({ mbti: 'ENFP' });

            await service.regenerate('u1', 'key-aaaaaaaa', 'key-bbbbbbbb');
            await settle();

            expect(ai.calls[1]?.profile.mbti).toBe('ENFP');
        });

        it('is idempotent for the same new key', async () => {
            await service.regenerate('u1', 'key-aaaaaaaa', 'key-bbbbbbbb');
            const again = await service.regenerate('u1', 'key-aaaaaaaa', 'key-bbbbbbbb');
            await settle();

            expect(again.pointsDeducted).toBe(0);
            expect(await points()).toBe(10);
        });

        it('refunds the regeneration charge when it fails and leaves the old report untouched', async () => {
            ai.behavior = async () => {
                throw new Error('overloaded');
            };

            await service.regenerate('u1', 'key-aaaaaaaa', 'key-bbbbbbbb');
            await settle();

            expect((await report('key-bbbbbbbb'))?.status).toBe('FAILED');
            expect((await report('key-aaaaaaaa'))?.status).toBe('COMPLETED');
            expect(await points()).toBe(15);
        });

        it('cannot start from a report that is missing, someone else\'s or expired', async () => {
            await expect(service.regenerate('u1', 'nope-nope', 'key-cccccccc')).rejects.toBeInstanceOf(NotFoundError);
            await expect(service.regenerate('u2', 'key-aaaaaaaa', 'key-cccccccc')).rejects.toBeInstanceOf(NotFoundError);

            clock.now = addMonths(NOW, 6) + DAY_MS;
            await db.doc('users/u1').update({ mbtiExpiresAt: addMonths(clock.now, 3) });
            await expect(service.regenerate('u1', 'key-aaaaaaaa', 'key-cccccccc')).rejects.toBeInstanceOf(NotFoundError);
        });

        it('does not start when the member can no longer be analysed', async () => {
            await db.doc('users/u1').update({
                mbti: null, mbtiExpiresAt: null,
            });

            await expect(service.regenerate('u1', 'key-aaaaaaaa', 'key-bbbbbbbb')).rejects.toBeInstanceOf(UnprocessableError);
            expect(await points()).toBe(15);
        });
    });

    describe('get / list', () => {
        beforeEach(async () => {
            await service.create('u1', request, 'key-aaaaaaaa');
            await settle();
        });

        it('returns the report to its owner without charging or calling the model', async () => {
            const item = await service.get('u1', 'key-aaaaaaaa');

            expect(item.status).toBe('COMPLETED');
            expect(item.sections).toHaveLength(8);
            expect(ai.calls).toHaveLength(1);
            expect(await points()).toBe(15);
        });

        it('treats someone else\'s report id as not found', async () => {
            await expect(service.get('u2', 'key-aaaaaaaa')).rejects.toBeInstanceOf(NotFoundError);
            expect(await service.list('u2')).toEqual([]);
        });

        it('hides a report after its 6 months are up', async () => {
            clock.now = addMonths(NOW, 6) + DAY_MS;

            await expect(service.get('u1', 'key-aaaaaaaa')).rejects.toBeInstanceOf(NotFoundError);
            expect(await service.list('u1')).toEqual([]);
        });

        it('lists newest first, with failed and running reports visible', async () => {
            clock.now += 1000;
            ai.behavior = async () => {
                throw new Error('overloaded');
            };
            await service.create('u1', request, 'key-bbbbbbbb');
            await settle();

            const items = await service.list('u1');

            expect(items.map((item) => item.reportId)).toEqual(['key-bbbbbbbb', 'key-aaaaaaaa']);
            expect(items[0]?.status).toBe('FAILED');
        });
    });
});
