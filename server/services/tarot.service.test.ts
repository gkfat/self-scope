import {
    beforeEach, describe, expect, it, vi,
} from 'vitest';
import { FakeFirestore } from '../test-utils/fakeFirestore';
import { TarotService } from './tarot.service';
import { dailyTarotResponseSchema } from '../../shared/schemas/api/tarot.schema';
import { TAROT_CARDS } from '../../shared/constants/tarot';
import { drawDailyCard } from '../../shared/utils/tarot';
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
        contentType: 'TAROT',
        key,
        body: {
            title: key, summary: `summary of ${key}`, disclaimer: '僅供娛樂與自我探索',
        },
        contentVersion: '1',
        status,
        updatedAt: 1,
        publishedAt: status === 'PUBLISHED' ? 1 : null,
    };
}

describe('TarotService', () => {
    let db: FakeFirestore;
    let clock: { now: number };
    let service: TarotService;

    const seedFor = async (uid: string, date: string, status = 'PUBLISHED') => {
        const {
            cardIndex, orientation, 
        } = drawDailyCard(uid, date);
        const key = `${cardIndex}_${orientation}`;

        await db.doc(`fixedContents/TAROT_${key}`).set(contentDoc(key, status));

        return {
            cardIndex, orientation, key, 
        };
    };
    const draws = (uid = 'u1') => db.paths().filter((path) => path.startsWith(`users/${uid}/tarotDraws/`));

    beforeEach(() => {
        db = new FakeFirestore();
        holder.db = db;
        clock = { now: NOW };
        service = new TarotService({ clock: () => clock.now });
    });

    it('draws the first card of the day, stores it and gives its content', async () => {
        const picked = await seedFor('u1', TODAY);
        const response = await service.draw('u1');

        expect(dailyTarotResponseSchema.parse(response)).toMatchObject({
            date: TODAY,
            drawn: true,
            card: {
                index: picked.cardIndex,
                name: TAROT_CARDS[picked.cardIndex]?.name,
                orientation: picked.orientation,
                illustration: null,
            },
            content: {
                contentType: 'TAROT', key: picked.key,
            },
        });
        expect((await db.doc(`users/u1/tarotDraws/${TODAY}`).get()).data()).toEqual({
            cardIndex: picked.cardIndex,
            orientation: picked.orientation,
            drawnAt: NOW,
            expiresAt: addMonths(NOW, 3),
            drawVersion: 'tarot-v1',
        });
    });

    it('returns the same record when drawing again the same day', async () => {
        await seedFor('u1', TODAY);

        const first = await service.draw('u1');

        clock.now += 3 * 60 * 60 * 1000;

        expect(await service.draw('u1')).toEqual(first);
        expect(draws()).toHaveLength(1);
        expect((await db.doc(`users/u1/tarotDraws/${TODAY}`).get()).data()?.drawnAt).toBe(NOW);
    });

    it('stores one record when two requests draw at once', async () => {
        await seedFor('u1', TODAY);

        const [a, b] = await Promise.all([service.draw('u1'), service.draw('u1')]);

        expect(a).toEqual(b);
        expect(draws()).toHaveLength(1);
    });

    it('draws a new record on the next Taipei day, switching at midnight there', async () => {
        await seedFor('u1', TODAY);
        await seedFor('u1', '2026-10-28');

        // 23:59:59 in Taipei is still the same day, 00:00:00 is the next
        clock.now = Date.UTC(2026, 9, 27, 15, 59, 59);
        expect((await service.draw('u1')).date).toBe(TODAY);

        clock.now = Date.UTC(2026, 9, 27, 16, 0, 0);
        expect((await service.draw('u1')).date).toBe('2026-10-28');
        expect(draws()).toHaveLength(2);
    });

    it('keeps accounts apart', async () => {
        await seedFor('u1', TODAY);
        await seedFor('u2', TODAY);
        await service.draw('u1');
        await service.draw('u2');

        expect(draws('u1')).toHaveLength(1);
        expect(draws('u2')).toHaveLength(1);
    });

    it.each(['DRAFT', 'REVIEWED'])('answers 404 and stores nothing while the content is %s', async (status) => {
        await seedFor('u1', TODAY, status);

        await expect(service.draw('u1')).rejects.toBeInstanceOf(NotFoundError);
        expect(draws()).toHaveLength(0);
        expect(await service.getToday('u1')).toEqual({
            date: TODAY, drawn: false,
        });
    });

    it('answers 404 and stores nothing when the content is missing, and a later draw still works', async () => {
        await expect(service.draw('u1')).rejects.toBeInstanceOf(NotFoundError);
        expect(draws()).toHaveLength(0);

        await seedFor('u1', TODAY);

        expect(await service.draw('u1')).toMatchObject({ drawn: true });
    });

    describe('getToday', () => {
        it('says not drawn yet and writes nothing', async () => {
            expect(dailyTarotResponseSchema.parse(await service.getToday('u1'))).toEqual({
                date: TODAY, drawn: false,
            });
            expect(draws()).toHaveLength(0);
        });

        it('gives the drawn card with its content, also a day later within the same Taipei date', async () => {
            await seedFor('u1', TODAY);

            const drawn = await service.draw('u1');

            expect(await service.getToday('u1')).toEqual(drawn);

            clock.now += DAY;

            expect(await service.getToday('u1')).toEqual({
                date: '2026-10-28', drawn: false,
            });
        });
    });
});
