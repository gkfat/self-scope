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

/** The three-dimension choice (4 points) and the two-dimension one (2 points) without the human design or the BaZi chart */
const THREE = {
    dimensions: [
        'ZODIAC',
        'MBTI',
        'BLOOD',
    ] as Array<'ZODIAC' | 'MBTI' | 'BLOOD'>, 
};
const PAIR = { dimensions: ['ZODIAC', 'MBTI'] as Array<'ZODIAC' | 'MBTI' | 'BLOOD'> };

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
        await seedPoints(db, 'u1', 20);
        await seedContent(db, 'aries_INTJ_A');
        await seedContent(db, 'aries_INTJ');
    });

    describe('obtain', () => {
        it('charges 4 points the first time for three dimensions and stores the summary for 3 months', async () => {
            const result = await service.obtain('u1', THREE);

            expect(result).toMatchObject({
                summaryId: 'aries_INTJ_A',
                pointsDeducted: 4,
                combinationKey: {
                    zodiac: 'aries', mbti: 'INTJ', bloodType: 'A',
                },
                content: {
                    title: 'aries_INTJ_A', contentVersion: '2', disclaimer: '僅供娛樂與自我探索',
                },
                obtainedAt: NOW,
                expiresAt: addMonths(NOW, 3),
            });
            expect(await pointsLeft(db)).toBe(16);
            expect(summaryDocs(db)).toEqual(['users/u1/summaries/aries_INTJ_A']);
        });

        it('does not charge again for a combination the member already has', async () => {
            await service.obtain('u1', THREE);
            const again = await service.obtain('u1', THREE);

            expect(again.pointsDeducted).toBe(0);
            expect(await pointsLeft(db)).toBe(16);
            expect(chargeDocs(db)).toHaveLength(1);
        });

        it('treats the two-factor and three-factor combinations as separate summaries', async () => {
            const withBlood = await service.obtain('u1', THREE);
            const withoutBlood = await service.obtain('u1', PAIR);

            expect(withBlood.summaryId).toBe('aries_INTJ_A');
            expect(withoutBlood.summaryId).toBe('aries_INTJ');
            expect(withoutBlood.pointsDeducted).toBe(2);
            expect(await pointsLeft(db)).toBe(14);
        });

        it('asks for the blood type when it is chosen but unknown, without charging', async () => {
            await db.doc('users/u1').update({ bloodType: 'UNKNOWN' });

            await expect(service.obtain('u1', THREE)).rejects.toMatchObject({
                statusCode: 422, code: 'BLOOD_REQUIRED',
            });
            expect(await pointsLeft(db)).toBe(20);
        });

        it('charges 2 points for a pair that includes the blood type', async () => {
            await seedContent(db, 'aries_A');
            await seedContent(db, 'INTJ_A');

            const zodiacBlood = await service.obtain('u1', { dimensions: ['BLOOD', 'ZODIAC'] });
            const bloodMbti = await service.obtain('u1', { dimensions: ['MBTI', 'BLOOD'] });

            expect(zodiacBlood).toMatchObject({
                summaryId: 'aries_A', pointsDeducted: 2,
                combinationKey: {
                    zodiac: 'aries', mbti: null, bloodType: 'A',
                },
            });
            expect(bloodMbti).toMatchObject({
                summaryId: 'INTJ_A', pointsDeducted: 2,
                combinationKey: {
                    zodiac: null, mbti: 'INTJ', bloodType: 'A',
                },
            });
            expect(await pointsLeft(db)).toBe(16);
        });

        it('does not offer the human design here', async () => {
            await expect(service.obtain('u1', { dimensions: ['ZODIAC', 'HUMAN_DESIGN'] } as never)).rejects.toMatchObject({ code: 'DIMENSIONS_NOT_OFFERED' });
            expect(await pointsLeft(db)).toBe(20);
        });

        it('charges only once when requests are repeated concurrently', async () => {
            const results = await Promise.all(Array.from({ length: 6 }, () => service.obtain('u1', THREE)));

            expect(results.filter((r) => r.pointsDeducted === 4)).toHaveLength(1);
            expect(await pointsLeft(db)).toBe(16);
            expect(chargeDocs(db)).toHaveLength(1);
        });

        it('rejects without charging when there are not enough points', async () => {
            await db.doc('users/u1/pointBatches/b1').update({ remaining: 0 });

            await expect(service.obtain('u1', THREE)).rejects.toBeInstanceOf(InsufficientPointsError);

            expect(summaryDocs(db)).toEqual([]);
            expect(chargeDocs(db)).toEqual([]);
        });

        it('ignores expired points', async () => {
            await db.doc('users/u1/pointBatches/b1').update({ expiresAt: NOW - 1 });

            await expect(service.obtain('u1', THREE)).rejects.toBeInstanceOf(InsufficientPointsError);
        });

        it('asks for the personality test when the member has no mbti', async () => {
            await db.doc('users/u1').update({
                mbti: null, mbtiExpiresAt: null,
            });

            await expect(service.obtain('u1', THREE)).rejects.toMatchObject({
                statusCode: 422, code: 'MBTI_REQUIRED',
            });
            expect(await pointsLeft(db)).toBe(20);
        });

        it('treats an expired mbti as missing', async () => {
            await db.doc('users/u1').update({ mbtiExpiresAt: NOW - 1 });

            await expect(service.obtain('u1', THREE)).rejects.toBeInstanceOf(UnprocessableError);
        });

        it('asks for the profile when birth data is missing', async () => {
            await db.doc('users/u1').update({ birthData: null });

            await expect(service.obtain('u1', THREE)).rejects.toMatchObject({
                statusCode: 422, code: 'PROFILE_REQUIRED',
            });
        });

        it('does not charge when the content for the combination is not published', async () => {
            await seedContent(db, 'aries_INTJ_A', 'DRAFT');

            await expect(service.obtain('u1', THREE)).rejects.toBeInstanceOf(NotFoundError);
            expect(await pointsLeft(db)).toBe(20);
            expect(summaryDocs(db)).toEqual([]);
        });

        it('charges again once the earlier summary has expired', async () => {
            await service.obtain('u1', PAIR);

            clock.now = addMonths(NOW, 3) + DAY_MS;
            // The member's mbti has expired by now too; assume they retook the test.
            await db.doc('users/u1').update({ mbtiExpiresAt: addMonths(clock.now, 3) });
            const renewed = await service.obtain('u1', PAIR);

            expect(renewed.pointsDeducted).toBe(2);
            expect(renewed.expiresAt).toBe(addMonths(clock.now, 3));
            expect(await pointsLeft(db)).toBe(16);
            expect(chargeDocs(db)).toHaveLength(2);
        });
    });

    describe('list / get', () => {
        beforeEach(async () => {
            await service.obtain('u1', THREE);
            await service.obtain('u1', PAIR);
        });

        it('lists unexpired summaries, newest first, without charging', async () => {
            const items = await service.list('u1');

            expect(items.map((i) => i.summaryId).sort()).toEqual(['aries_INTJ', 'aries_INTJ_A']);
            expect(await pointsLeft(db)).toBe(14);
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
