import {
    beforeEach, describe, expect, it, vi,
} from 'vitest';
import { FakeFirestore } from '../test-utils/fakeFirestore';
import { HoroscopeService } from './horoscope.service';
import { computeTransitChart } from '../astrology/transitChart';
import { dailyHoroscopeResponseSchema } from '../../shared/schemas/api/horoscope.schema';
import {
    HOROSCOPE_BODIES, horoscopeContentKeys,
} from '../../shared/constants/horoscope';
import { ZODIACS } from '../../shared/schemas/common';
import {
    NotFoundError, UnprocessableError,
} from '../../shared/types/errors';

const holder = vi.hoisted(() => ({ db: undefined as unknown }));

vi.mock('../utils/firebaseAdmin', () => ({ getAdminFirestore: () => holder.db }));

// 2026-10-28 12:00 in Taipei
const NOW = Date.UTC(2026, 9, 28, 4);
const DAY = 24 * 60 * 60 * 1000;
const TODAY = '2026-10-28';

function contentDoc(key: string, status = 'PUBLISHED') {
    return {
        contentType: 'HOROSCOPE',
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

const member = (sign: string | null) => ({
    email: 'a@example.com',
    birthData: sign ? {
        birthDate: '1990-06-15', zodiac: sign, birthTime: null, birthPlace: null,
    } : null,
    bloodType: 'O',
    mbti: null,
    mbtiExpiresAt: null,
    createdAt: NOW,
    updatedAt: NOW,
});

describe('HoroscopeService', () => {
    let db: FakeFirestore;
    let clock: { now: number };
    let service: HoroscopeService;

    const seedAllContent = async () => {
        for (const key of horoscopeContentKeys()) await db.doc(`fixedContents/HOROSCOPE_${key}`).set(contentDoc(key));
    };

    beforeEach(async () => {
        db = new FakeFirestore();
        holder.db = db;
        clock = { now: NOW };
        service = new HoroscopeService({ clock: () => clock.now });

        await db.doc('users/u1').set(member('scorpio'));
        await seedAllContent();
    });

    it('reads the five bodies of today\'s sky for the member\'s sign, the Moon first', async () => {
        const response = dailyHoroscopeResponseSchema.parse(await service.getToday('u1'));

        expect(response.date).toBe(TODAY);
        expect(response.sign).toBe('scorpio');
        expect(response.bodies.map((entry) => entry.body)).toEqual([...HOROSCOPE_BODIES]);
        expect(response.bodies.map((entry) => entry.area)).toEqual([
            '今日心情與節奏',
            '這段時間的主題',
            '溝通與思考',
            '感情與人際',
            '行動與精力',
        ]);
    });

    it('puts each body in the house its sign makes counted from the member\'s own, from today\'s chart at 00:00', async () => {
        const chart = computeTransitChart(TODAY);
        const response = await service.getToday('u1');

        for (const entry of response.bodies) {
            const transitSign = chart.placements[entry.body].sign;
            const expected = ((ZODIACS.indexOf(transitSign) - ZODIACS.indexOf('scorpio') + 12) % 12) + 1;

            expect(entry.transitSign, entry.body).toBe(transitSign);
            expect(entry.house, entry.body).toBe(expected);
        }
    });

    it('gives the content of that body in that house', async () => {
        const response = await service.getToday('u1');

        for (const entry of response.bodies) {
            expect(entry.content).toMatchObject({
                contentType: 'HOROSCOPE', key: `${entry.body}_${entry.house}`,
            });
        }
    });

    it('gives every one of the twelve signs a first house for its own sign and different houses for different signs', async () => {
        const houseOfMoon = new Set<number>();

        for (const sign of ZODIACS) {
            await db.doc('users/u2').set(member(sign));

            const response = await service.getToday('u2');
            const moon = response.bodies.find((entry) => entry.body === 'MOON');

            houseOfMoon.add(moon?.house ?? 0);
            expect(response.sign).toBe(sign);
        }

        // Twelve signs see the same Moon in twelve different houses
        expect(houseOfMoon.size).toBe(12);
    });

    it('is the same all day and changes with the date: the Moon moves house within days', async () => {
        const morning = await service.getToday('u1');

        clock.now = Date.UTC(2026, 9, 28, 15, 59);

        expect(await service.getToday('u1')).toEqual(morning);

        // Taipei midnight: the next date
        clock.now = Date.UTC(2026, 9, 28, 16, 0);

        const nextDay = await service.getToday('u1');

        expect(nextDay.date).toBe('2026-10-29');

        const moonHouses = new Set<number>();

        for (let day = 0; day < 6; day++) {
            clock.now = NOW + day * DAY;
            moonHouses.add((await service.getToday('u1')).bodies[0]?.house ?? 0);
        }

        expect(moonHouses.size).toBeGreaterThan(1);
    });

    it('asks for the birth date when there is none, and stores nothing', async () => {
        await db.doc('users/u3').set(member(null));

        const before = db.paths();

        await expect(service.getToday('u3')).rejects.toBeInstanceOf(UnprocessableError);
        await expect(service.getToday('u3')).rejects.toMatchObject({ code: 'PROFILE_REQUIRED' });
        expect(db.paths()).toEqual(before);
    });

    it('answers 404 for an unknown member', async () => {
        await expect(service.getToday('nobody')).rejects.toBeInstanceOf(NotFoundError);
    });

    it.each(['DRAFT', 'REVIEWED'])('answers 404 when a needed content is %s, with nothing filled in instead', async (status) => {
        const moon = (await service.getToday('u1')).bodies[0];

        await db.doc(`fixedContents/HOROSCOPE_MOON_${moon?.house}`).set(contentDoc(`MOON_${moon?.house}`, status));

        await expect(service.getToday('u1')).rejects.toBeInstanceOf(NotFoundError);
    });

    it('answers 404 when a needed content is missing', async () => {
        const venus = (await service.getToday('u1')).bodies[3];

        await db.doc(`fixedContents/HOROSCOPE_VENUS_${venus?.house}`).delete();

        await expect(service.getToday('u1')).rejects.toBeInstanceOf(NotFoundError);
    });

    it('writes nothing and touches no points however often it is asked', async () => {
        const before = db.paths();

        for (let i = 0; i < 3; i++) await service.getToday('u1');

        expect(db.paths()).toEqual(before);
        expect(db.paths().filter((path) => path.includes('point'))).toEqual([]);
    });
});
