import {
    beforeEach, describe, expect, it, vi,
} from 'vitest';
import { FakeFirestore } from '../test-utils/fakeFirestore';
import { KinUnlockService } from './kinUnlock.service';
import { kinTodayResponseSchema } from '../../shared/schemas/api/mayaKin.schema';
import { kinOf } from '../../shared/utils/mayaKin';
import { addMonths } from '../../shared/utils/time';
import { NotFoundError } from '../../shared/types/errors';

const holder = vi.hoisted(() => ({ db: undefined as unknown }));

vi.mock('../utils/firebaseAdmin', () => ({ getAdminFirestore: () => holder.db }));

// 2026-10-27 12:00 in Taipei
const NOW = Date.UTC(2026, 9, 27, 4);
const DAY = 24 * 60 * 60 * 1000;
const TODAY = '2026-10-27';

function contentDoc(key: string, status = 'PUBLISHED') {
    return {
        contentType: 'KIN_TODAY',
        key,
        body: {
            title: `Kin ${key}`, summary: `summary of ${key}`, disclaimer: '僅供娛樂與自我探索',
        },
        contentVersion: '1',
        status,
        updatedAt: 1,
        publishedAt: status === 'PUBLISHED' ? 1 : null,
    };
}

describe('KinUnlockService', () => {
    let db: FakeFirestore;
    let clock: { now: number };
    let service: KinUnlockService;

    const seedFor = async (date: string, status = 'PUBLISHED') => {
        const kin = kinOf(date);

        await db.doc(`fixedContents/KIN_TODAY_${kin.kinNumber}`).set(contentDoc(String(kin.kinNumber), status));

        return kin;
    };
    const unlocks = (uid = 'u1') => db.paths().filter((path) => path.startsWith(`users/${uid}/kinUnlocks/`));

    beforeEach(() => {
        db = new FakeFirestore();
        holder.db = db;
        clock = { now: NOW };
        service = new KinUnlockService({ clock: () => clock.now });
    });

    it('unlocks the first time of the day, stores it and gives the Kin with its content', async () => {
        const kin = await seedFor(TODAY);
        const response = await service.unlock('u1');

        expect(kinTodayResponseSchema.parse(response)).toMatchObject({
            date: TODAY,
            unlocked: true,
            kin,
            content: {
                contentType: 'KIN_TODAY', key: String(kin.kinNumber),
            },
        });
        expect((await db.doc(`users/u1/kinUnlocks/${TODAY}`).get()).data()).toEqual({
            kin,
            unlockedAt: NOW,
            expiresAt: addMonths(NOW, 3),
        });
    });

    it('does not touch points', async () => {
        await seedFor(TODAY);
        await service.unlock('u1');

        expect(db.paths().filter((path) => path.includes('point'))).toEqual([]);
    });

    it('returns the same record when unlocking again the same day', async () => {
        await seedFor(TODAY);

        const first = await service.unlock('u1');

        clock.now += 3 * 60 * 60 * 1000;

        expect(await service.unlock('u1')).toEqual(first);
        expect(unlocks()).toHaveLength(1);
        expect((await db.doc(`users/u1/kinUnlocks/${TODAY}`).get()).data()?.unlockedAt).toBe(NOW);
    });

    it('stores one record when two requests unlock at once', async () => {
        await seedFor(TODAY);

        const [a, b] = await Promise.all([service.unlock('u1'), service.unlock('u1')]);

        expect(a).toEqual(b);
        expect(unlocks()).toHaveLength(1);
    });

    it('works out a new Kin on the next Taipei day, switching at midnight there', async () => {
        await seedFor(TODAY);
        await seedFor('2026-10-28');

        // 23:59:59 in Taipei is still the same day, 00:00:00 is the next
        clock.now = Date.UTC(2026, 9, 27, 15, 59, 59);
        expect((await service.unlock('u1')).date).toBe(TODAY);

        clock.now = Date.UTC(2026, 9, 27, 16, 0, 0);

        const next = await service.unlock('u1');

        expect(next.date).toBe('2026-10-28');
        expect(next).toMatchObject({ kin: kinOf('2026-10-28') });
        expect(unlocks()).toHaveLength(2);
    });

    it('keeps accounts apart', async () => {
        await seedFor(TODAY);
        await service.unlock('u1');
        await service.unlock('u2');

        expect(unlocks('u1')).toHaveLength(1);
        expect(unlocks('u2')).toHaveLength(1);
    });

    it.each(['DRAFT', 'REVIEWED'])('answers 404 and stores nothing while the content is %s', async (status) => {
        await seedFor(TODAY, status);

        await expect(service.unlock('u1')).rejects.toBeInstanceOf(NotFoundError);
        expect(unlocks()).toHaveLength(0);
        expect(await service.getToday('u1')).toEqual({
            date: TODAY, unlocked: false,
        });
    });

    it('answers 404 and stores nothing when the content is missing, and a later unlock still works', async () => {
        await expect(service.unlock('u1')).rejects.toBeInstanceOf(NotFoundError);
        expect(unlocks()).toHaveLength(0);

        await seedFor(TODAY);

        expect(await service.unlock('u1')).toMatchObject({ unlocked: true });
    });

    describe('getToday', () => {
        it('says locked, gives away no Kin and writes nothing', async () => {
            await seedFor(TODAY);

            const response = await service.getToday('u1');

            expect(kinTodayResponseSchema.parse(response)).toEqual({
                date: TODAY, unlocked: false,
            });
            expect(response).not.toHaveProperty('kin');
            expect(response).not.toHaveProperty('content');
            expect(unlocks()).toHaveLength(0);
        });

        it('gives the Kin and content every time once unlocked, as often as asked', async () => {
            await seedFor(TODAY);

            const unlocked = await service.unlock('u1');

            for (let i = 0; i < 5; i++) expect(await service.getToday('u1')).toEqual(unlocked);
        });

        it('is locked again the next day', async () => {
            await seedFor(TODAY);
            await service.unlock('u1');

            clock.now += DAY;

            expect(await service.getToday('u1')).toEqual({
                date: '2026-10-28', unlocked: false,
            });
        });
    });
});
