import {
    beforeEach, describe, expect, it, vi,
} from 'vitest';
import { FakeFirestore } from '../test-utils/fakeFirestore';
import { GuestSessionService } from './guestSession.service';
import { HumanDesignService } from './humanDesign.service';
import { calculateHumanDesign } from '../humanDesign/calculate';
import { humanDesignInputDigest } from '../humanDesign/inputDigest';
import { addMonths } from '../../shared/utils/time';
import { HUMAN_DESIGN_DISCLAIMER } from '../../shared/constants/humanDesign';
import {
    NotFoundError, ValidationError,
} from '../../shared/types/errors';

const holder = vi.hoisted(() => ({ db: undefined as unknown }));

vi.mock('../utils/firebaseAdmin', () => ({ getAdminFirestore: () => holder.db }));

const NOW = Date.UTC(2026, 0, 15, 12);
const DAY = 24 * 60 * 60 * 1000;

const birth = {
    birthDate: '1990-06-15', birthTime: '12:00', birthPlace: 'es-madrid',
};
const madridChart = () => calculateHumanDesign('1990-06-15', '12:00', 'Europe/Madrid');

const member = (birthData: Record<string, unknown> | null) => ({
    email: 'a@example.com',
    birthData,
    bloodType: 'O',
    mbti: null,
    mbtiExpiresAt: null,
    createdAt: NOW,
    updatedAt: NOW,
});

const fullBirthData = {
    birthDate: '1990-06-15', zodiac: 'gemini', birthTime: '12:00', birthPlace: 'es-madrid',
};

describe('HumanDesignService', () => {
    let db: FakeFirestore;
    let clock: { now: number };
    let guests: GuestSessionService;
    let service: HumanDesignService;

    const saved = async (uid = 'u1') => (await db.doc(`users/${uid}/humanDesign/main`).get()).data();

    beforeEach(() => {
        db = new FakeFirestore();
        holder.db = db;
        clock = { now: NOW };
        guests = new GuestSessionService({ clock: () => clock.now });
        service = new HumanDesignService({
            guestSessions: guests, clock: () => clock.now,
        });
    });

    describe('calculate for a member', () => {
        beforeEach(async () => {
            await db.doc('users/u1').set(member(null));
        });

        it('returns the chart and keeps it for 3 months', async () => {
            const response = await service.calculate(birth, {
                uid: 'u1', guestSessionId: null,
            });

            expect(response).toMatchObject({
                ...madridChart(),
                disclaimer: HUMAN_DESIGN_DISCLAIMER,
                saved: true,
                expiresAt: addMonths(NOW, 3),
            });
            expect(response.type).toBe('MANIFESTING_GENERATOR');
            expect(response.profile).toBe('2/4');
        });

        it('says so when the entered time happened twice, and not when it did not', async () => {
            const ambiguous = await service.calculate({
                birthDate: '1996-10-27', birthTime: '01:30', birthPlace: 'gb-london',
            }, {
                uid: 'u1', guestSessionId: null,
            });
            const plain = await service.calculate(birth, {
                uid: 'u1', guestSessionId: null,
            });

            expect(ambiguous.timeNote).toBe('AMBIGUOUS');
            expect(plain.timeNote).toBeNull();
            expect((await service.getSaved('u1')).timeNote).toBeNull();
        });

        it('stores a digest of the input, never the raw birth time and place', async () => {
            await service.calculate(birth, {
                uid: 'u1', guestSessionId: null,
            });

            const doc = await saved();
            expect(doc).toMatchObject({
                inputDigest: humanDesignInputDigest(birth), calculatedAt: NOW, expiresAt: addMonths(NOW, 3),
            });
            expect(JSON.stringify(doc)).not.toMatch(/es-madrid|12:00/);
        });

        it('replaces the previous chart on recalculation', async () => {
            await service.calculate(birth, {
                uid: 'u1', guestSessionId: null,
            });
            await service.calculate({
                ...birth, birthDate: '1996-10-27', birthTime: '01:30', birthPlace: 'gb-london',
            }, {
                uid: 'u1', guestSessionId: null,
            });

            expect((await saved())?.result).toMatchObject({ profile: '2/5' });
        });

        it('fills what the request leaves out from the saved profile', async () => {
            await db.doc('users/u1').set(member(fullBirthData));

            const response = await service.calculate({}, {
                uid: 'u1', guestSessionId: null,
            });

            expect(response.profile).toBe('2/4');
        });

        it('lets the request override the profile', async () => {
            await db.doc('users/u1').set(member(fullBirthData));

            const response = await service.calculate({
                birthDate: '1996-10-27', birthTime: '01:30', birthPlace: 'gb-london',
            }, {
                uid: 'u1', guestSessionId: null,
            });

            expect(response.profile).toBe('2/5');
        });

        it.each([
            [
                {
                    birthDate: '1990-06-15', birthPlace: 'es-madrid', 
                }, 'BIRTH_TIME_REQUIRED',
            ],
            [
                {
                    birthDate: '1990-06-15', birthTime: '12:00', 
                }, 'BIRTH_PLACE_REQUIRED',
            ],
            [
                {
                    birthTime: '12:00', birthPlace: 'es-madrid', 
                }, 'PROFILE_REQUIRED',
            ],
        ])('asks for the missing piece %j (%s) and saves nothing', async (request, code) => {
            await expect(service.calculate(request, {
                uid: 'u1', guestSessionId: null,
            })).rejects.toMatchObject({
                statusCode: 422, code,
            });
            expect(await saved()).toBeUndefined();
        });

        it('rejects a place that is not in the city list', async () => {
            await expect(service.calculate({
                ...birth, birthPlace: 'nowhere',
            }, {
                uid: 'u1', guestSessionId: null,
            })).rejects.toBeInstanceOf(ValidationError);
        });

        it('fails for an unknown member', async () => {
            await expect(service.calculate(birth, {
                uid: 'ghost', guestSessionId: null,
            })).rejects.toBeInstanceOf(NotFoundError);
        });
    });

    describe('calculate for a guest', () => {
        it('shows the chart without a session and keeps nothing', async () => {
            const response = await service.calculate(birth, {
                uid: null, guestSessionId: null,
            });

            expect(response).toMatchObject({
                type: 'MANIFESTING_GENERATOR', saved: false, expiresAt: null,
            });
            expect(db.paths().filter((p) => p.includes('humanDesign'))).toEqual([]);
        });

        it('keeps the chart in the guest session', async () => {
            const { sessionId } = await guests.create();

            const response = await service.calculate(birth, {
                uid: null, guestSessionId: sessionId,
            });

            expect(response.saved).toBe(true);
            expect(response.expiresAt).toBeNull();
            expect((await db.doc(`guestSessions/${sessionId}`).get()).data()?.tempResults).toMatchObject({
                humanDesign: {
                    inputDigest: humanDesignInputDigest(birth), calculatedAt: NOW,
                },
            });
        });

        it('uses the birth data the guest already entered', async () => {
            const { sessionId } = await guests.create();
            await guests.saveProfile(sessionId, {
                birthData: {
                    birthDate: '1990-06-15', zodiac: 'gemini', birthTime: '12:00', birthPlace: 'es-madrid',
                },
                bloodType: 'UNKNOWN',
            });

            const response = await service.calculate({}, {
                uid: null, guestSessionId: sessionId,
            });

            expect(response.profile).toBe('2/4');
        });

        it('still shows the chart when the session has expired, keeping nothing', async () => {
            const { sessionId } = await guests.create();
            clock.now += 2 * DAY;

            const response = await service.calculate(birth, {
                uid: null, guestSessionId: sessionId,
            });

            expect(response.saved).toBe(false);
        });
    });

    describe('getSaved', () => {
        beforeEach(async () => {
            await db.doc('users/u1').set(member(fullBirthData));
        });

        it('returns the saved chart without recalculating or charging', async () => {
            await service.calculate({}, {
                uid: 'u1', guestSessionId: null,
            });
            const before = await saved();

            const response = await service.getSaved('u1');

            expect(response).toMatchObject({
                profile: '2/4', saved: true, expiresAt: addMonths(NOW, 3),
            });
            expect(await saved()).toEqual(before);
        });

        it('is not found before any calculation', async () => {
            await expect(service.getSaved('u1')).rejects.toBeInstanceOf(NotFoundError);
        });

        it('is not found after the 3 months are up', async () => {
            await service.calculate({}, {
                uid: 'u1', guestSessionId: null,
            });
            clock.now = addMonths(NOW, 3) + DAY;

            await expect(service.getSaved('u1')).rejects.toBeInstanceOf(NotFoundError);
        });

        it('recalculates when the birth data changed, keeping the original expiry', async () => {
            await service.calculate({}, {
                uid: 'u1', guestSessionId: null,
            });
            clock.now += 10 * DAY;
            await db.doc('users/u1').update({
                birthData: {
                    birthDate: '1996-10-27', zodiac: 'scorpio', birthTime: '01:30', birthPlace: 'gb-london',
                },
            });

            const response = await service.getSaved('u1');

            expect(response.profile).toBe('2/5');
            expect(response.expiresAt).toBe(addMonths(NOW, 3));
            expect(await saved()).toMatchObject({
                inputDigest: humanDesignInputDigest({
                    birthDate: '1996-10-27', birthTime: '01:30', birthPlace: 'gb-london',
                }),
                calculatedAt: NOW + 10 * DAY,
            });
        });

        it('keeps a chart made from other data until the profile itself changes', async () => {
            await service.calculate({
                birthDate: '1996-10-27', birthTime: '01:30', birthPlace: 'gb-london',
            }, {
                uid: 'u1', guestSessionId: null,
            });

            expect((await service.getSaved('u1')).profile).toBe('2/5');

            await db.doc('users/u1').update({
                birthData: {
                    ...fullBirthData, birthTime: '13:00',
                },
            });

            expect((await service.getSaved('u1')).profile).toBe(
                calculateHumanDesign('1990-06-15', '13:00', 'Europe/Madrid').profile,
            );
        });

        it('recalculates from the profile once an incomplete profile is completed', async () => {
            await db.doc('users/u1').update({
                birthData: {
                    birthDate: '1990-06-15', zodiac: 'gemini', birthTime: null, birthPlace: null,
                },
            });
            await service.calculate({
                birthDate: '1996-10-27', birthTime: '01:30', birthPlace: 'gb-london',
            }, {
                uid: 'u1', guestSessionId: null,
            });
            expect((await service.getSaved('u1')).profile).toBe('2/5');

            await db.doc('users/u1').update({ birthData: fullBirthData });

            expect((await service.getSaved('u1')).profile).toBe('2/4');
        });

        it('keeps the saved chart when the profile no longer has a time and place to compare', async () => {
            await service.calculate({}, {
                uid: 'u1', guestSessionId: null,
            });
            await db.doc('users/u1').update({
                birthData: {
                    birthDate: '1990-06-15', zodiac: 'gemini', birthTime: null, birthPlace: null,
                },
            });

            expect((await service.getSaved('u1')).profile).toBe('2/4');
        });
    });

    describe('getCurrent', () => {
        it('returns the chart, or null when there is none or it expired', async () => {
            await db.doc('users/u1').set(member(fullBirthData));

            expect(await service.getCurrent('u1')).toBeNull();

            await service.calculate({}, {
                uid: 'u1', guestSessionId: null,
            });
            expect((await service.getCurrent('u1'))?.profile).toBe('2/4');

            clock.now = addMonths(NOW, 3) + DAY;
            expect(await service.getCurrent('u1')).toBeNull();
        });
    });
});
