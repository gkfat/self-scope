import {
    beforeEach, describe, expect, it, vi,
} from 'vitest';
import { FakeFirestore } from '../test-utils/fakeFirestore';
import { SummaryService } from './summary.service';
import {
    InsufficientPointsError, NotFoundError, UnprocessableError,
} from '../../shared/types/errors';
import {
    addMonths, DAY_MS,
} from '../../shared/utils/time';

const holder = vi.hoisted(() => ({ db: undefined as unknown }));

vi.mock('../utils/firebaseAdmin', () => ({ getAdminFirestore: () => holder.db }));

const NOW = Date.UTC(2026, 0, 15, 12);

const body = (title: string) => ({
    title,
    summary: `${title} 摘要`,
    strengths: [],
    blindSpots: [],
    loveStyle: '',
    workStyle: '',
    communicationStyle: '',
    growthAdvice: '',
    disclaimer: '僅供娛樂與自我探索',
});

async function seedContent(db: FakeFirestore, key: string, status = 'PUBLISHED') {
    await db.doc(`fixedContents/SUMMARY_${key}`).set({
        contentType: 'SUMMARY',
        key,
        body: body(key),
        contentVersion: '2',
        status,
        updatedAt: NOW,
        publishedAt: status === 'PUBLISHED' ? NOW : null,
    });
}

const user = (overrides: Record<string, unknown> = {}) => ({
    email: 'a@example.com',
    birthData: {
        birthDate: '1995-03-25', zodiac: 'aries', birthTime: null, birthPlace: null,
    },
    bloodType: 'A',
    mbti: 'INTJ',
    mbtiExpiresAt: addMonths(NOW, 2),
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
});

async function seedPoints(db: FakeFirestore, uid: string, remaining: number) {
    await db.doc(`users/${uid}/pointBatches/b1`).set({
        source: 'PURCHASE',
        sourceRef: null,
        granted: remaining,
        remaining,
        expiresAt: null,
        createdAt: NOW - DAY_MS,
    });
}

const pointsLeft = async (db: FakeFirestore, uid = 'u1') => (await db.doc(`users/${uid}/pointBatches/b1`).get()).data()?.remaining;
const summaryDocs = (db: FakeFirestore) => db.paths().filter((p) => p.includes('/summaries/'));
const chargeDocs = (db: FakeFirestore) => db.paths().filter((p) => p.includes('/pointTransactions/'));

describe('SummaryService', () => {
    let db: FakeFirestore;
    let clock: { now: number };
    let service: SummaryService;

    beforeEach(async () => {
        db = new FakeFirestore();
        holder.db = db;
        clock = { now: NOW };
        service = new SummaryService({ clock: () => clock.now });

        await db.doc('users/u1').set(user());
        await seedPoints(db, 'u1', 5);
        await seedContent(db, 'aries_INTJ_A');
        await seedContent(db, 'aries_INTJ');
    });

    describe('obtain', () => {
        it('charges 1 point the first time and stores the summary for 3 months', async () => {
            const result = await service.obtain('u1', { includeBloodType: true });

            expect(result).toMatchObject({
                summaryId: 'aries_INTJ_A',
                pointsDeducted: 1,
                combinationKey: {
                    zodiac: 'aries', mbti: 'INTJ', bloodType: 'A',
                },
                content: {
                    title: 'aries_INTJ_A', contentVersion: '2', disclaimer: '僅供娛樂與自我探索',
                },
                obtainedAt: NOW,
                expiresAt: addMonths(NOW, 3),
            });
            expect(await pointsLeft(db)).toBe(4);
            expect(summaryDocs(db)).toEqual(['users/u1/summaries/aries_INTJ_A']);
        });

        it('does not charge again for a combination the member already has', async () => {
            await service.obtain('u1', { includeBloodType: true });
            const again = await service.obtain('u1', { includeBloodType: true });

            expect(again.pointsDeducted).toBe(0);
            expect(await pointsLeft(db)).toBe(4);
            expect(chargeDocs(db)).toHaveLength(1);
        });

        it('treats the two-factor and three-factor combinations as separate summaries', async () => {
            const withBlood = await service.obtain('u1', { includeBloodType: true });
            const withoutBlood = await service.obtain('u1', { includeBloodType: false });

            expect(withBlood.summaryId).toBe('aries_INTJ_A');
            expect(withoutBlood.summaryId).toBe('aries_INTJ');
            expect(await pointsLeft(db)).toBe(3);
        });

        it('uses the two-factor combination when the blood type is unknown', async () => {
            await db.doc('users/u1').update({ bloodType: 'UNKNOWN' });

            const result = await service.obtain('u1', { includeBloodType: true });

            expect(result.summaryId).toBe('aries_INTJ');
            expect(result.combinationKey.bloodType).toBeNull();
        });

        it('charges only once when requests are repeated concurrently', async () => {
            const results = await Promise.all(Array.from({ length: 6 }, () => service.obtain('u1', { includeBloodType: true })));

            expect(results.filter((r) => r.pointsDeducted === 1)).toHaveLength(1);
            expect(await pointsLeft(db)).toBe(4);
            expect(chargeDocs(db)).toHaveLength(1);
        });

        it('rejects without charging when there are not enough points', async () => {
            await db.doc('users/u1/pointBatches/b1').update({ remaining: 0 });

            await expect(service.obtain('u1', { includeBloodType: true })).rejects.toBeInstanceOf(InsufficientPointsError);

            expect(summaryDocs(db)).toEqual([]);
            expect(chargeDocs(db)).toEqual([]);
        });

        it('ignores expired points', async () => {
            await db.doc('users/u1/pointBatches/b1').update({ expiresAt: NOW - 1 });

            await expect(service.obtain('u1', { includeBloodType: true })).rejects.toBeInstanceOf(InsufficientPointsError);
        });

        it('asks for the personality test when the member has no mbti', async () => {
            await db.doc('users/u1').update({
                mbti: null, mbtiExpiresAt: null,
            });

            await expect(service.obtain('u1', { includeBloodType: true })).rejects.toMatchObject({
                statusCode: 422, code: 'MBTI_REQUIRED',
            });
            expect(await pointsLeft(db)).toBe(5);
        });

        it('treats an expired mbti as missing', async () => {
            await db.doc('users/u1').update({ mbtiExpiresAt: NOW - 1 });

            await expect(service.obtain('u1', { includeBloodType: true })).rejects.toBeInstanceOf(UnprocessableError);
        });

        it('asks for the profile when birth data is missing', async () => {
            await db.doc('users/u1').update({ birthData: null });

            await expect(service.obtain('u1', { includeBloodType: true })).rejects.toMatchObject({
                statusCode: 422, code: 'PROFILE_REQUIRED',
            });
        });

        it('does not charge when the content for the combination is not published', async () => {
            await seedContent(db, 'aries_INTJ_A', 'DRAFT');

            await expect(service.obtain('u1', { includeBloodType: true })).rejects.toBeInstanceOf(NotFoundError);
            expect(await pointsLeft(db)).toBe(5);
            expect(summaryDocs(db)).toEqual([]);
        });

        it('charges again once the earlier summary has expired', async () => {
            await service.obtain('u1', { includeBloodType: true });

            clock.now = addMonths(NOW, 3) + DAY_MS;
            // The member's mbti has expired by now too; assume they retook the test.
            await db.doc('users/u1').update({ mbtiExpiresAt: addMonths(clock.now, 3) });
            const renewed = await service.obtain('u1', { includeBloodType: true });

            expect(renewed.pointsDeducted).toBe(1);
            expect(renewed.expiresAt).toBe(addMonths(clock.now, 3));
            expect(await pointsLeft(db)).toBe(3);
            expect(chargeDocs(db)).toHaveLength(2);
        });
    });

    describe('list / get', () => {
        beforeEach(async () => {
            await service.obtain('u1', { includeBloodType: true });
            await service.obtain('u1', { includeBloodType: false });
        });

        it('lists unexpired summaries, newest first, without charging', async () => {
            const items = await service.list('u1');

            expect(items.map((i) => i.summaryId).sort()).toEqual(['aries_INTJ', 'aries_INTJ_A']);
            expect(await pointsLeft(db)).toBe(3);
        });

        it('hides expired summaries', async () => {
            clock.now = addMonths(NOW, 3) + DAY_MS;

            expect(await service.list('u1')).toEqual([]);
            await expect(service.get('u1', 'aries_INTJ_A')).rejects.toBeInstanceOf(NotFoundError);
        });

        it('returns one summary with its content', async () => {
            const item = await service.get('u1', 'aries_INTJ_A');

            expect(item.content.title).toBe('aries_INTJ_A');
        });

        it('does not show other members\' summaries', async () => {
            await expect(service.get('u2', 'aries_INTJ_A')).rejects.toBeInstanceOf(NotFoundError);
            expect(await service.list('u2')).toEqual([]);
        });

        it('skips a summary whose content is no longer published', async () => {
            await seedContent(db, 'aries_INTJ', 'DRAFT');

            expect((await service.list('u1')).map((i) => i.summaryId)).toEqual(['aries_INTJ_A']);
        });
    });
});
