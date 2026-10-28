import {
    beforeEach, describe, expect, it, vi,
} from 'vitest';
import definition from '../../content/tests/personality16-v1.json';
import { FakeFirestore } from '../test-utils/fakeFirestore';
import { GuestSessionService } from './guestSession.service';
import { SingleReportService } from './singleReport.service';
import { reportSnapshotDetailSchema } from '../../shared/schemas/api/reportSnapshot.schema';
import { testDefinitionFileSchema } from '../../shared/schemas/firestore/test.schema';
import { MBTI_TYPES } from '../../shared/schemas/common';
import {
    NotFoundError, UnprocessableError, 
} from '../../shared/types/errors';
import { addMonths } from '../../shared/utils/time';

const holder = vi.hoisted(() => ({ db: undefined as unknown }));

vi.mock('../utils/firebaseAdmin', () => ({ getAdminFirestore: () => holder.db }));

const NOW = Date.UTC(2026, 9, 28, 4);
const DAY = 24 * 3600 * 1000;
const {
    questions, scoringRule,
} = testDefinitionFileSchema.parse(definition);

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

async function publish(db: FakeFirestore, type: string, key: string, title: string) {
    await db.doc(`fixedContents/${type}_${key}`).set({
        contentType: type, key, body: body(title), contentVersion: '1', status: 'PUBLISHED', updatedAt: NOW, publishedAt: NOW,
    });
}

const user = (overrides: Record<string, unknown> = {}) => ({
    email: 'a@example.com',
    birthData: {
        birthDate: '1989-10-27', zodiac: 'scorpio', birthTime: null, birthPlace: null,
    },
    bloodType: 'O',
    mbti: null,
    mbtiExpiresAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
});

describe('SingleReportService', () => {
    let db: FakeFirestore;
    let clock: { now: number };
    let service: SingleReportService;

    const snapshotPaths = () => db.paths().filter((p) => p.includes('/reportSnapshots/'));

    beforeEach(async () => {
        db = new FakeFirestore();
        holder.db = db;
        clock = { now: NOW };
        service = new SingleReportService({ clock: () => clock.now });

        await db.doc('users/u1').set(user());
        await publish(db, 'BLOOD', 'O', 'O 型');
        await publish(db, 'ZODIAC', 'scorpio', '天蠍座');
        await publish(db, 'NUMEROLOGY', '1', '生命靈數 1');

        for (const type of MBTI_TYPES) await publish(db, 'MBTI', type, type);
    });

    describe('the blood type report', () => {
        it('makes a report the API schema accepts, kept for 6 months', async () => {
            const report = await service.generate({ uid: 'u1' }, 'BLOOD');

            expect(reportSnapshotDetailSchema.safeParse(report).success).toBe(true);
            expect(report).toMatchObject({
                kind: 'SINGLE', systems: ['BLOOD'], position: 'O 型', aiAugmented: false, ai: null, expiresAt: addMonths(NOW, 6),
            });
            expect(snapshotPaths()).toHaveLength(1);
        });

        it('gives the same report again without keeping a second copy', async () => {
            const first = await service.generate({ uid: 'u1' }, 'BLOOD');

            clock.now += 1000;

            const second = await service.generate({ uid: 'u1' }, 'BLOOD');

            expect(second.id).toBe(first.id);
            expect(snapshotPaths()).toHaveLength(1);
        });

        it('asks for the blood type when it is not known, and stores nothing', async () => {
            await db.doc('users/u1').set(user({ bloodType: 'UNKNOWN' }));

            await expect(service.generate({ uid: 'u1' }, 'BLOOD')).rejects.toMatchObject({ code: 'BLOOD_REQUIRED' });
            expect(snapshotPaths()).toEqual([]);
        });

        it('turns away content that is not published, and stores nothing', async () => {
            await db.doc('fixedContents/BLOOD_O').update({ status: 'DRAFT' });

            await expect(service.generate({ uid: 'u1' }, 'BLOOD')).rejects.toBeInstanceOf(NotFoundError);
            expect(snapshotPaths()).toEqual([]);
        });
    });

    describe('the sign report', () => {
        it('has only the sun sign and a note when the birth time and city are missing', async () => {
            const report = await service.generate({ uid: 'u1' }, 'ZODIAC');
            const texts = report.blocks.flatMap((b) => b.segments.map((s) => s.text));

            expect(report.position).toBe('太陽天蠍座');
            expect(texts.some((text) => text.startsWith('上升：'))).toBe(false);
            expect(texts.some((text) => text.includes('填寫出生時間與出生城市'))).toBe(true);
            expect(report.basis.map((b) => b.system)).toEqual(['ZODIAC']);
        });

        it('has the chart, the houses and the aspects when they are given, and is a new report then', async () => {
            const plain = await service.generate({ uid: 'u1' }, 'ZODIAC');

            await db.doc('users/u1').set(user({
                birthData: {
                    birthDate: '1989-10-27', zodiac: 'scorpio', birthTime: '06:10', birthPlace: 'tw-taipei',
                },
            }));

            const full = await service.generate({ uid: 'u1' }, 'ZODIAC');
            const texts = full.blocks.flatMap((b) => b.segments.map((s) => s.text));

            expect(full.id).not.toBe(plain.id);
            expect(texts.some((text) => text.startsWith('上升：'))).toBe(true);
            expect(texts.filter((text) => /^第 \d+ 宮/.test(text))).toHaveLength(12);
            expect(full.basis.map((b) => b.system)).toEqual(['ZODIAC', 'NATAL_CHART']);
            expect(snapshotPaths()).toHaveLength(2);
        });

        it('still gives the report, without the chart, when the saved city is no longer known', async () => {
            await db.doc('users/u1').set(user({
                birthData: {
                    birthDate: '1989-10-27', zodiac: 'scorpio', birthTime: '06:10', birthPlace: 'xx-nowhere',
                },
            }));

            const report = await service.generate({ uid: 'u1' }, 'ZODIAC');

            expect(report.basis.map((b) => b.system)).toEqual(['ZODIAC']);
        });

        it('asks for the birth date when there is none', async () => {
            await db.doc('users/u1').set(user({ birthData: null }));

            await expect(service.generate({ uid: 'u1' }, 'ZODIAC')).rejects.toMatchObject({ code: 'PROFILE_REQUIRED' });
        });
    });

    describe('the life path number report', () => {
        it('keeps the year number with the date it was made for, and asking on another day is the same report', async () => {
            const first = await service.generate({ uid: 'u1' }, 'NUMEROLOGY');

            expect(first.blocks.find((b) => b.key === 'time')?.segments[0]).toMatchObject({
                timeSensitive: true, asOf: '2026-10-28',
            });

            clock.now += DAY;

            const next = await service.generate({ uid: 'u1' }, 'NUMEROLOGY');

            expect(next.id).toBe(first.id);
            expect(snapshotPaths()).toHaveLength(1);
        });

        it('is a new report when the year changes, since the year number does', async () => {
            const first = await service.generate({ uid: 'u1' }, 'NUMEROLOGY');

            clock.now = Date.UTC(2027, 0, 5, 4);

            const next = await service.generate({ uid: 'u1' }, 'NUMEROLOGY');

            expect(next.id).not.toBe(first.id);
        });
    });

    describe('the MBTI report', () => {
        it('asks for the test when there is no valid result', async () => {
            await expect(service.generate({ uid: 'u1' }, 'MBTI')).rejects.toMatchObject({ code: 'MBTI_REQUIRED' });
            await db.doc('users/u1').set(user({
                mbti: 'ISTJ', mbtiExpiresAt: NOW - 1000,
            }));
            await expect(service.generate({ uid: 'u1' }, 'MBTI')).rejects.toBeInstanceOf(UnprocessableError);
        });

        it('says how clear each pair is when the latest attempt is that result', async () => {
            await db.doc('users/u1').set(user({
                mbti: 'ESTJ', mbtiExpiresAt: addMonths(NOW, 2),
            }));
            await db.doc('tests/personality16/versions/1').set({
                questions, scoringRule, publishedAt: NOW,
            });
            await db.doc('users/u1/testAttempts/a1').set({
                testId: 'personality16',
                testVersion: '1',
                answers: questions.map((q) => ({
                    questionId: q.questionId, value: q.direction === 'first' ? 5 : 1, responseTimeMs: null,
                })),
                result: 'ESTJ',
                completedAt: NOW - 1000,
                expiresAt: addMonths(NOW, 3),
            });

            const report = await service.generate({ uid: 'u1' }, 'MBTI');
            const texts = report.blocks.flatMap((b) => b.segments.map((s) => s.text));

            expect(report.position).toBe('ESTJ');
            expect(texts.some((text) => text.includes('外向（E），明顯偏向'))).toBe(true);
            expect(report.basis).toMatchObject([
                {
                    system: 'MBTI', ruleVersion: '1',
                },
            ]);
        });

        it('names the sides without a strength when no attempt matches the stored type', async () => {
            await db.doc('users/u1').set(user({
                mbti: 'INTJ', mbtiExpiresAt: addMonths(NOW, 2),
            }));

            const report = await service.generate({ uid: 'u1' }, 'MBTI');
            const facts = report.blocks.find((b) => b.key === 'facts')?.segments.map((s) => s.text) ?? [];

            expect(facts.some((text) => text.includes('內向（I）'))).toBe(true);
            expect(facts.some((text) => text.includes('偏向') && text.includes('（I）'))).toBe(false);
            expect(report.basis).toEqual([]);
        });

        it('says in its limits that this MBTI is a questionnaire of our own', async () => {
            await db.doc('users/u1').set(user({
                mbti: 'INTJ', mbtiExpiresAt: addMonths(NOW, 2),
            }));

            const limits = (await service.generate({ uid: 'u1' }, 'MBTI')).blocks.find((b) => b.key === 'limits');

            expect(limits?.segments[0]?.text).toContain('自製');
        });
    });

    describe('for a guest', () => {
        let guests: GuestSessionService;

        const session = async (profile: Record<string, unknown>) => {
            const { sessionId } = await guests.create();

            await guests.saveProfile(sessionId, profile as never);

            return sessionId;
        };

        beforeEach(() => {
            guests = new GuestSessionService({ clock: () => clock.now });
        });

        it('gets the same report from what the session holds, and nothing is kept', async () => {
            const sessionId = await session({
                birthData: {
                    birthDate: '1989-10-27', zodiac: 'scorpio',
                },
                bloodType: 'O',
            });
            const report = await service.generate({ guestSessionId: sessionId }, 'BLOOD');

            expect(report).toMatchObject({
                kind: 'SINGLE', position: 'O 型', persisted: false, id: null, expiresAt: null, aiAugmented: false,
            });
            expect(reportSnapshotDetailSchema.safeParse({
                ...report, id: 'x', expiresAt: NOW,
            }).success).toBe(true);
            expect(snapshotPaths()).toEqual([]);
        });

        it('makes the sign report with the chart when the session has a birth time and a city', async () => {
            const sessionId = await session({
                birthData: {
                    birthDate: '1989-10-27', zodiac: 'scorpio', birthTime: '06:10', birthPlace: 'tw-taipei',
                },
                bloodType: 'UNKNOWN',
            });
            const texts = (await service.generate({ guestSessionId: sessionId }, 'ZODIAC')).blocks.flatMap((b) => b.segments.map((s) => s.text));

            expect(texts.some((text) => text.startsWith('上升：'))).toBe(true);
            expect(snapshotPaths()).toEqual([]);
        });

        it('makes the MBTI report with the strength of each pair from the guest\'s own answers', async () => {
            const sessionId = await session({
                birthData: {
                    birthDate: '1989-10-27', zodiac: 'scorpio',
                },
                bloodType: 'UNKNOWN',
            });

            await db.doc('tests/personality16/versions/1').set({
                questions, scoringRule, publishedAt: NOW,
            });
            await guests.saveTestResult(sessionId, {
                testId: 'personality16',
                testVersion: '1',
                answers: questions.map((q) => ({
                    questionId: q.questionId, value: q.direction === 'first' ? 5 : 1, responseTimeMs: null,
                })),
                result: 'ESTJ',
                completedAt: NOW,
            });

            const report = await service.generate({ guestSessionId: sessionId }, 'MBTI');
            const texts = report.blocks.flatMap((b) => b.segments.map((s) => s.text));

            expect(report.position).toBe('ESTJ');
            expect(texts.some((text) => text.includes('外向（E），明顯偏向'))).toBe(true);
            expect(snapshotPaths()).toEqual([]);
        });

        it('asks for what is missing in the same words as for a member', async () => {
            const sessionId = await session({
                birthData: {
                    birthDate: '1989-10-27', zodiac: 'scorpio',
                },
                bloodType: 'UNKNOWN',
            });

            await expect(service.generate({ guestSessionId: sessionId }, 'BLOOD')).rejects.toMatchObject({ code: 'BLOOD_REQUIRED' });
            await expect(service.generate({ guestSessionId: sessionId }, 'MBTI')).rejects.toMatchObject({ code: 'MBTI_REQUIRED' });
        });

        it('asks for the birth date when there is no session, an unknown one, or one that has run out', async () => {
            const sessionId = await session({
                birthData: {
                    birthDate: '1989-10-27', zodiac: 'scorpio',
                },
                bloodType: 'O',
            });

            await expect(service.generate({ guestSessionId: null }, 'BLOOD')).rejects.toMatchObject({ code: 'PROFILE_REQUIRED' });
            await expect(service.generate({ guestSessionId: 'x'.repeat(32) }, 'BLOOD')).rejects.toMatchObject({ code: 'PROFILE_REQUIRED' });

            clock.now += 2 * DAY;
            await expect(service.generate({ guestSessionId: sessionId }, 'BLOOD')).rejects.toMatchObject({ code: 'PROFILE_REQUIRED' });
        });
    });

    it('treats an unknown member as not found', async () => {
        await expect(service.generate({ uid: 'nobody' }, 'BLOOD')).rejects.toBeInstanceOf(NotFoundError);
    });
});
