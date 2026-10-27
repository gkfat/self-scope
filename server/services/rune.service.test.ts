import {
    beforeEach, describe, expect, it, vi,
} from 'vitest';
import { FakeFirestore } from '../test-utils/fakeFirestore';
import { RuneService } from './rune.service';
import { dailyRuneResponseSchema } from '../../shared/schemas/api/rune.schema';
import {
    RUNES, isReversibleRune,
} from '../../shared/constants/runes';
import { drawDailyRune } from '../../shared/utils/rune';
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
        contentType: 'RUNE',
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

/** An account whose rune on the given day satisfies the condition, found by trying accounts in turn. */
function accountWhere(date: string, condition: (rune: ReturnType<typeof drawDailyRune>) => boolean): string {
    for (let n = 0; n < 5000; n++) {
        if (condition(drawDailyRune(`probe-${n}`, date))) return `probe-${n}`;
    }

    throw new Error('no account found for the condition');
}

describe('RuneService', () => {
    let db: FakeFirestore;
    let clock: { now: number };
    let service: RuneService;

    const seedFor = async (uid: string, date: string, status = 'PUBLISHED') => {
        const {
            runeIndex, orientation, 
        } = drawDailyRune(uid, date);
        const key = `${runeIndex}_${orientation}`;

        await db.doc(`fixedContents/RUNE_${key}`).set(contentDoc(key, status));

        return {
            runeIndex, orientation, key,
        };
    };
    const draws = (uid = 'u1') => db.paths().filter((path) => path.startsWith(`users/${uid}/runeDraws/`));

    beforeEach(() => {
        db = new FakeFirestore();
        holder.db = db;
        clock = { now: NOW };
        service = new RuneService({ clock: () => clock.now });
    });

    it('draws the first rune of the day, stores it and gives its content', async () => {
        const picked = await seedFor('u1', TODAY);
        const response = await service.draw('u1');

        expect(dailyRuneResponseSchema.parse(response)).toMatchObject({
            date: TODAY,
            drawn: true,
            rune: {
                index: picked.runeIndex,
                name: RUNES[picked.runeIndex]?.name,
                glyph: RUNES[picked.runeIndex]?.glyph,
                orientation: picked.orientation,
                illustration: null,
            },
            content: {
                contentType: 'RUNE', key: picked.key,
            },
        });
        expect((await db.doc(`users/u1/runeDraws/${TODAY}`).get()).data()).toEqual({
            symbolIndex: picked.runeIndex,
            orientation: picked.orientation,
            drawnAt: NOW,
            expiresAt: addMonths(NOW, 3),
            drawVersion: 'rune-v1',
        });
    });

    it('does not touch points', async () => {
        await seedFor('u1', TODAY);
        await service.draw('u1');

        expect(db.paths().filter((path) => path.includes('point'))).toEqual([]);
    });

    it('returns the same record when drawing again the same day', async () => {
        await seedFor('u1', TODAY);

        const first = await service.draw('u1');

        clock.now += 3 * 60 * 60 * 1000;

        expect(await service.draw('u1')).toEqual(first);
        expect(draws()).toHaveLength(1);
        expect((await db.doc(`users/u1/runeDraws/${TODAY}`).get()).data()?.drawnAt).toBe(NOW);
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

    it('always draws a rune that looks the same upside down upright, in the record and in the answer', async () => {
        const uid = accountWhere(TODAY, (rune) => !isReversibleRune(rune.runeIndex));

        await seedFor(uid, TODAY);

        const response = await service.draw(uid);

        expect(response).toMatchObject({
            drawn: true, rune: { orientation: 'upright' },
        });
        expect((await db.doc(`users/${uid}/runeDraws/${TODAY}`).get()).data()?.orientation).toBe('upright');
    });

    it('can draw a reversed rune when the rune can be reversed', async () => {
        const uid = accountWhere(TODAY, (rune) => isReversibleRune(rune.runeIndex) && rune.orientation === 'reversed');

        await seedFor(uid, TODAY);

        expect(await service.draw(uid)).toMatchObject({
            drawn: true, rune: { orientation: 'reversed' },
        });
    });

    it('refuses to read back a stored reversed draw of a symmetric rune', async () => {
        const symmetric = RUNES.find((rune) => !rune.reversible)?.index ?? 0;

        await db.doc(`users/u1/runeDraws/${TODAY}`).set({
            symbolIndex: symmetric, orientation: 'reversed', drawnAt: NOW, expiresAt: NOW + DAY, drawVersion: 'rune-v1',
        });

        await expect(service.getToday('u1')).rejects.toThrow();
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
            expect(dailyRuneResponseSchema.parse(await service.getToday('u1'))).toEqual({
                date: TODAY, drawn: false,
            });
            expect(draws()).toHaveLength(0);
        });

        it('gives the drawn rune with its content, and is not drawn again the next day', async () => {
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
