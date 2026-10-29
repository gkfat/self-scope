import {
    beforeEach, describe, expect, it, vi,
} from 'vitest';
import { FakeFirestore } from '../test-utils/fakeFirestore';
import { MultiReportService } from './multiReport.service';
import { PointService } from './point.service';
import { RateLimitService } from './rateLimit.service';
import { ReportSnapshotService } from './reportSnapshot.service';
import { SingleAnalysisService } from './singleAnalysis.service';
import { SingleReportService } from './singleReport.service';
import {
    AiOutputError, type AiMultiGeneration, type AiSingleAnalysisProvider, type GenerateOptions,
} from '../ai/provider';
import { MULTI_PROMPT_VERSION } from '../ai/multiPrompt';
import type {
    MultiAnalysisInput, MultiAnalysisOutput,
} from '../../shared/schemas/firestore/multiAnalysis.schema';
import { multiReportAcceptedSchema } from '../../shared/schemas/api/multiReport.schema';
import { reportSnapshotDetailSchema } from '../../shared/schemas/api/reportSnapshot.schema';
import { INSIGHT_RULES_VERSION } from '../../shared/ontology/insightRules';
import {
    InsufficientPointsError, ValidationError,
} from '../../shared/types/errors';
import { DAY_MS } from '../../shared/utils/time';

const holder = vi.hoisted(() => ({ db: undefined as unknown }));

vi.mock('../utils/firebaseAdmin', () => ({ getAdminFirestore: () => holder.db }));

const NOW = Date.UTC(2026, 9, 28, 4);

const body = (title: string) => ({
    title,
    summary: `${title}的簡述。`,
    strengths: ['優勢一'],
    blindSpots: ['盲點一'],
    loveStyle: '',
    workStyle: '',
    communicationStyle: '',
    growthAdvice: '給自己一點時間。',
    disclaimer: '僅供娛樂與自我探索。',
});

/** An answer that is right for the candidates it was given: an overview, one insight for each, and some advice. */
const goodOutput = (input: MultiAnalysisInput): MultiAnalysisOutput => {
    const ids = input.candidates.map((candidate) => candidate.id);
    const text = '依你的報告來看，你可能傾向把事情安排得清楚，也容易在雜亂的環境裡感到不自在。';

    return {
        sections: [
            {
                kind: 'overview', candidateIds: ids.slice(0, 1), content: text, evidence: '依據規則找出的洞見與重點事實',
            },
            ...ids.map((id) => ({
                kind: 'insight' as const, candidateIds: [id], content: text, evidence: '依據這條洞見的來源事實',
            })),
            {
                kind: 'advice', candidateIds: ids.slice(0, 1), content: text, evidence: '依據規則找出的洞見',
            },
        ],
    };
};

class FakeAi implements AiSingleAnalysisProvider {
    calls: MultiAnalysisInput[] = [];
    multi: (input: MultiAnalysisInput, options: GenerateOptions) => Promise<AiMultiGeneration> = async (input) => ({
        output: goodOutput(input),
        usage: {
            inputTokens: 1500, outputTokens: 2500,
        },
        modelName: 'gpt-5-mini',
    });

    async generateSingle(): Promise<never> {
        throw new Error('not used');
    }

    async generateMulti(input: MultiAnalysisInput, options: GenerateOptions) {
        this.calls.push(input);

        return this.multi(input, options);
    }
}

const user = (overrides: Record<string, unknown> = {}) => ({
    email: 'a@example.com',
    birthData: {
        birthDate: '1989-09-10', zodiac: 'virgo', birthTime: null, birthPlace: null,
    },
    bloodType: 'A',
    mbti: null,
    mbtiExpiresAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
});

describe('MultiReportService', () => {
    let db: FakeFirestore;
    let ai: FakeAi;
    let clock: { now: number };
    let pending: Array<Promise<void>>;
    let service: MultiReportService;

    const settle = async () => {
        await Promise.all(pending);
    };
    const points = async () => (await new PointService({ clock: () => clock.now }).getBalance('u1')).availableBalance;
    const snapshots = () => db.paths().filter((p) => p.includes('/reportSnapshots/'));
    const detail = async (id: string) => reportSnapshotDetailSchema.parse(await new ReportSnapshotService({ clock: () => clock.now }).get('u1', id));

    const make = (background: (task: () => Promise<void>, onError: (error: unknown) => void) => Promise<void>) => {
        const clockFn = () => clock.now;
        const analysis = new SingleAnalysisService({
            getProvider: () => ai,
            background,
            points: new PointService({ clock: clockFn }),
            rateLimit: new RateLimitService({ clock: clockFn }),
            pricing: () => ({
                inputPerMtok: 0.1, outputPerMtok: 0.5,
            }),
            clock: clockFn,
        });

        return new MultiReportService({
            single: new SingleReportService({ clock: clockFn }),
            snapshots: new ReportSnapshotService({ clock: clockFn }),
            analysis,
            points: new PointService({ clock: clockFn }),
            clock: clockFn,
        });
    };

    beforeEach(async () => {
        db = new FakeFirestore();
        holder.db = db;
        ai = new FakeAi();
        clock = { now: NOW };
        pending = [];
        service = make((task, onError) => {
            const promise = task().catch(onError);

            pending.push(promise);

            return promise;
        });

        await db.doc('users/u1').set(user());
        await db.doc('users/u1/pointBatches/b1').set({
            source: 'PURCHASE', sourceRef: null, granted: 10, remaining: 10, expiresAt: null, createdAt: NOW - DAY_MS,
        });

        for (const [
            type,
            key,
            title,
        ] of [
            [
                'ZODIAC',
                'virgo',
                '處女座',
            ], [
                'BLOOD',
                'A',
                'A 型',
            ],
        ] as const) {
            await db.doc(`fixedContents/${type}_${key}`).set({
                contentType: type, key, body: body(title), contentVersion: '1', status: 'PUBLISHED', updatedAt: NOW, publishedAt: NOW,
            });
        }
    });

    it('charges the price of the systems (1.2 times their sum, rounded down), replies at once and writes the AI reading beside the report', async () => {
        const accepted = multiReportAcceptedSchema.parse(await service.create('u1', ['ZODIAC', 'BLOOD'], 'key-aaaaaaaa'));

        // (1 + 1) x 1.2 = 2.4 -> 2
        expect(accepted).toMatchObject({
            status: 'GENERATING', pointsDeducted: 2,
        });
        expect(await points()).toBe(8);

        await settle();

        const done = await detail(accepted.snapshotId);

        expect(done.kind).toBe('MULTI');
        expect(done.aiJob).toMatchObject({
            id: 'key-aaaaaaaa', status: 'COMPLETED',
        });
        expect(done.ai?.promptVersion).toBe(MULTI_PROMPT_VERSION);
        expect(done.versions.insightRules).toBe(INSIGHT_RULES_VERSION);
    });

    it('makes every part of the AI reading cite the candidates the rules found', async () => {
        const accepted = await service.create('u1', ['ZODIAC', 'BLOOD'], 'key-aaaaaaaa');
        await settle();

        const done = await detail(accepted.snapshotId);
        const found = new Set(done.blocks.find((b) => b.key === 'insights')?.segments.flatMap((s) => s.sources.flatMap((source) => (source.rule ? [source.rule] : []))));
        const cited = done.ai?.blocks.flatMap((b) => b.segments.flatMap((s) => s.sources.map((source) => source.rule))) ?? [];

        expect(found.size).toBeGreaterThan(0);
        expect(cited.length).toBeGreaterThan(0);
        expect(cited.every((rule) => rule !== undefined && found.has(rule))).toBe(true);
        expect(done.ai?.blocks.flatMap((b) => b.segments).every((s) => s.kind === 'AI_INFERENCE')).toBe(true);
    });

    it('gives the model the candidates, never anything the member typed', async () => {
        await service.create('u1', ['ZODIAC', 'BLOOD'], 'key-aaaaaaaa');
        await settle();

        const [input] = ai.calls;

        expect(Object.keys(input ?? {}).sort()).toEqual([
            'candidates',
            'facts',
            'notes',
            'positions',
            'systems',
        ]);
        expect(input?.candidates.length).toBeGreaterThan(0);
        expect(input?.systems).toEqual(['ZODIAC', 'BLOOD']);
    });

    it('does not charge or make a second report for the same key', async () => {
        const first = await service.create('u1', ['ZODIAC', 'BLOOD'], 'key-aaaaaaaa');
        const again = await service.create('u1', ['ZODIAC', 'BLOOD'], 'key-aaaaaaaa');
        await settle();

        expect(again).toMatchObject({
            snapshotId: first.snapshotId, pointsDeducted: 0,
        });
        expect(await points()).toBe(8);
        expect(snapshots()).toHaveLength(1);
        expect(ai.calls).toHaveLength(1);
    });

    it('refuses fewer than two different systems before anything is made or charged', async () => {
        await expect(service.create('u1', ['ZODIAC'], 'key-aaaaaaaa')).rejects.toBeInstanceOf(ValidationError);
        await expect(service.create('u1', ['ZODIAC', 'ZODIAC'], 'key-aaaaaaaa')).rejects.toBeInstanceOf(ValidationError);

        expect(snapshots()).toHaveLength(0);
        expect(await points()).toBe(10);
    });

    it('turns away a member without enough points, with no report and no charge', async () => {
        await db.doc('users/u1/pointBatches/b1').update({ remaining: 1 });

        await expect(service.create('u1', ['ZODIAC', 'BLOOD'], 'key-aaaaaaaa')).rejects.toBeInstanceOf(InsufficientPointsError);

        expect(snapshots()).toHaveLength(0);
        expect(ai.calls).toHaveLength(0);
    });

    it('asks for what a system is missing before charging', async () => {
        await db.doc('users/u1').set(user({ bloodType: 'UNKNOWN' }));

        await expect(service.create('u1', ['ZODIAC', 'BLOOD'], 'key-aaaaaaaa')).rejects.toMatchObject({ code: 'BLOOD_REQUIRED' });
        expect(await points()).toBe(10);
    });

    it('refuses a combination in which the rules found nothing to say, with no report and no charge', async () => {
        // Cancer and blood type O: no insight rule fires for them
        await db.doc('users/u1').set(user({
            birthData: {
                birthDate: '1989-07-10', zodiac: 'cancer', birthTime: null, birthPlace: null,
            },
            bloodType: 'O',
        }));

        for (const [type, key] of [['ZODIAC', 'cancer'], ['BLOOD', 'O']] as const) {
            await db.doc(`fixedContents/${type}_${key}`).set({
                contentType: type, key, body: body(key), contentVersion: '1', status: 'PUBLISHED', updatedAt: NOW, publishedAt: NOW,
            });
        }

        await expect(service.create('u1', ['ZODIAC', 'BLOOD'], 'key-aaaaaaaa')).rejects.toMatchObject({ code: 'NO_INSIGHTS' });

        expect(snapshots()).toHaveLength(0);
        expect(await points()).toBe(10);
    });

    describe('when the reading fails', () => {
        const failing = async (output: (input: MultiAnalysisInput) => MultiAnalysisOutput) => {
            ai.multi = async (input) => ({
                output: output(input),
                usage: {
                    inputTokens: 1, outputTokens: 1,
                },
                modelName: 'gpt-5-mini',
            });
            const accepted = await service.create('u1', ['ZODIAC', 'BLOOD'], 'key-aaaaaaaa');

            await settle();

            return accepted;
        };

        it('refunds when a part cites nothing', async () => {
            const accepted = await failing((input) => ({
                sections: goodOutput(input).sections.map((section, index) => (index === 1
                    ? {
                        ...section, candidateIds: [],
                    }
                    : section)),
            }));

            expect((await detail(accepted.snapshotId)).aiJob).toMatchObject({
                status: 'FAILED', failureReason: 'INVALID_OUTPUT',
            });
            expect((await detail(accepted.snapshotId)).ai).toBeNull();
            expect(await points()).toBe(10);
        });

        it('refunds when a part cites a candidate that was never found', async () => {
            const accepted = await failing((input) => ({
                sections: goodOutput(input).sections.map((section, index) => (index === 0
                    ? {
                        ...section, candidateIds: ['made-up-rule'],
                    }
                    : section)),
            }));

            expect((await detail(accepted.snapshotId)).aiJob).toMatchObject({ failureReason: 'INVALID_OUTPUT' });
            expect(await points()).toBe(10);
        });

        it('refunds when a candidate is left without its insight', async () => {
            const accepted = await failing((input) => ({ sections: goodOutput(input).sections.filter((section) => section.kind !== 'insight') }));

            expect((await detail(accepted.snapshotId)).aiJob).toMatchObject({ failureReason: 'INVALID_OUTPUT' });
            expect(await points()).toBe(10);
        });

        it('refunds when the model errors, and keeps the report beside it', async () => {
            ai.multi = async () => {
                throw new AiOutputError('TRUNCATED');
            };
            const accepted = await service.create('u1', ['ZODIAC', 'BLOOD'], 'key-aaaaaaaa');

            await settle();

            const failed = await detail(accepted.snapshotId);

            expect(failed.aiJob).toMatchObject({
                status: 'FAILED', failureReason: 'TRUNCATED',
            });
            expect(failed.blocks.length).toBeGreaterThan(0);
            expect(await points()).toBe(10);
        });
    });

    it('does not fill the limit with copies when the same report is asked for again', async () => {
        await service.create('u1', ['ZODIAC', 'BLOOD'], 'key-aaaaaaaa');
        await settle();
        clock.now += 1000;
        await service.create('u1', ['ZODIAC', 'BLOOD'], 'key-bbbbbbbb');
        await settle();

        expect(snapshots()).toHaveLength(1);
        expect(await points()).toBe(6);
    });
});
