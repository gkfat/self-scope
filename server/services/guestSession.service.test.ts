import {
    beforeEach, describe, expect, it, vi,
} from 'vitest';
import {
    FakeFirestore, FakeTimestamp,
} from '../test-utils/fakeFirestore';
import { GuestSessionService } from './guestSession.service';
import {
    ForbiddenError, GoneError, NotFoundError,
} from '../../shared/types/errors';
import { addMonths } from '../../shared/utils/time';
import { calculateHumanDesign } from '../humanDesign/calculate';
import { GUEST_SESSION_ID_PATTERN } from '../../shared/schemas/firestore/guestSession.schema';
import type { ProfileInput } from '../../shared/schemas/api/profile.schema';
import type { TestResult } from '../../shared/schemas/firestore/testAttempt.schema';

const holder = vi.hoisted(() => ({ db: undefined as unknown }));

vi.mock('../utils/firebaseAdmin', () => ({ getAdminFirestore: () => holder.db }));

const NOW = Date.UTC(2026, 0, 15, 12);
const DAY = 24 * 60 * 60 * 1000;

const profile: ProfileInput = {
    birthData: {
        birthDate: '1995-03-25',
        zodiac: 'aries',
        birthTime: null,
        birthPlace: null,
    },
    bloodType: 'O',
    gender: null,
};

const testResult: TestResult = {
    testId: 'mbti',
    testVersion: '1',
    answers: [
        {
            questionId: 'q1', value: 'a', responseTimeMs: null,
        },
    ],
    result: 'INTJ',
    completedAt: NOW,
};

const emptyUser = {
    email: 'a@example.com',
    birthData: null,
    bloodType: 'UNKNOWN',
    mbti: null,
    mbtiExpiresAt: null,
    createdAt: NOW,
    updatedAt: NOW,
};

describe('GuestSessionService', () => {
    let db: FakeFirestore;
    let clock: { now: number };
    let service: GuestSessionService;

    beforeEach(() => {
        db = new FakeFirestore();
        holder.db = db;
        clock = { now: NOW };
        service = new GuestSessionService({ clock: () => clock.now });
    });

    describe('create', () => {
        it('creates an unguessable id that expires in one day', async () => {
            const {
                sessionId, expiresAt, 
            } = await service.create();

            expect(sessionId).toMatch(GUEST_SESSION_ID_PATTERN);
            expect(expiresAt).toBe(NOW + DAY);

            const stored = (await db.doc(`guestSessions/${sessionId}`).get()).data();
            // A Timestamp on read means it was written as a Date, which Firestore TTL requires.
            expect(stored?.expiresAt).toBeInstanceOf(FakeTimestamp);
            expect(stored?.claimedBy).toBeNull();
        });

        it('creates a different id each time', async () => {
            const ids = await Promise.all([
                service.create(),
                service.create(),
                service.create(),
            ]);

            expect(new Set(ids.map((i) => i.sessionId)).size).toBe(3);
        });
    });

    describe('saveProfile / saveTestResult', () => {
        it('stores the profile and the test result without linking an account', async () => {
            const { sessionId } = await service.create();

            await service.saveProfile(sessionId, profile);
            await service.saveTestResult(sessionId, testResult);

            const stored = (await db.doc(`guestSessions/${sessionId}`).get()).data();
            expect(stored?.tempProfile).toMatchObject({ bloodType: 'O' });
            expect(stored?.tempResults).toMatchObject({ test: { result: 'INTJ' } });
            expect(stored?.claimedBy).toBeNull();
        });

        it('does not extend the expiry', async () => {
            const {
                sessionId, expiresAt, 
            } = await service.create();

            clock.now += 1000;
            await service.saveProfile(sessionId, profile);

            const stored = (await db.doc(`guestSessions/${sessionId}`).get()).data();
            expect((stored?.expiresAt as FakeTimestamp).toMillis()).toBe(expiresAt);
        });

        it('treats an unknown or expired session as not found', async () => {
            await expect(service.saveProfile('x'.repeat(32), profile)).rejects.toBeInstanceOf(NotFoundError);

            const { sessionId } = await service.create();
            clock.now += DAY;

            await expect(service.saveProfile(sessionId, profile)).rejects.toBeInstanceOf(NotFoundError);
        });
    });

    describe('getProfile', () => {
        it('returns what the guest has entered so far', async () => {
            const { sessionId } = await service.create();

            expect(await service.getProfile(sessionId)).toEqual({
                birthData: null, bloodType: 'UNKNOWN', mbti: null, gender: null, hasHumanDesign: false,
            });

            await service.saveProfile(sessionId, profile);
            await service.saveTestResult(sessionId, testResult);

            expect(await service.getProfile(sessionId)).toMatchObject({
                birthData: {
                    birthDate: '1995-03-25', zodiac: 'aries', 
                },
                bloodType: 'O',
                mbti: 'INTJ',
                hasHumanDesign: false,
            });
        });

        it('says whether a human design chart is kept', async () => {
            const { sessionId } = await service.create();
            await service.saveHumanDesign(sessionId, {
                result: calculateHumanDesign('1990-06-15', '12:00', 'Europe/Madrid'),
                inputDigest: 'digest',
                calculatedAt: NOW,
            });

            expect((await service.getProfile(sessionId)).hasHumanDesign).toBe(true);
        });

        it('treats an unknown, expired or claimed session as not found', async () => {
            const { sessionId } = await service.create();

            await expect(service.getProfile('nope')).rejects.toBeInstanceOf(NotFoundError);

            await db.doc('users/u1').set(emptyUser);
            await service.claim(sessionId, 'u1');
            await expect(service.getProfile(sessionId)).rejects.toBeInstanceOf(NotFoundError);

            const other = await service.create();
            clock.now += 2 * DAY;
            await expect(service.getProfile(other.sessionId)).rejects.toBeInstanceOf(NotFoundError);
        });
    });

    describe('claim', () => {
        async function sessionWithResults() {
            const { sessionId } = await service.create();
            await service.saveProfile(sessionId, profile);
            await service.saveTestResult(sessionId, testResult);

            return sessionId;
        }

        it('saves the test result, fills the empty profile and sets mbti', async () => {
            await db.doc('users/u1').set(emptyUser);
            const sessionId = await sessionWithResults();

            const result = await service.claim(sessionId, 'u1');

            expect(result).toEqual({ savedAttempts: 1 });

            const attempt = (await db.doc(`users/u1/testAttempts/guest_${sessionId}`).get()).data();
            expect(attempt).toMatchObject({
                result: 'INTJ', expiresAt: addMonths(NOW, 3),
            });

            const user = (await db.doc('users/u1').get()).data();
            expect(user?.birthData).toMatchObject({ zodiac: 'aries' });
            expect(user?.bloodType).toBe('O');
            expect(user?.mbti).toBe('INTJ');
            expect(user?.mbtiExpiresAt).toBe(addMonths(NOW, 3));
        });

        it('carries the guest\'s gender over into the empty profile', async () => {
            await db.doc('users/u1').set(emptyUser);

            const { sessionId } = await service.create();
            await service.saveProfile(sessionId, {
                ...profile, gender: 'MALE',
            });

            expect((await service.getProfile(sessionId)).gender).toBe('MALE');

            await service.claim(sessionId, 'u1');

            expect((await db.doc('users/u1').get()).data()?.gender).toBe('MALE');
        });

        it('does not replace the gender of a user who already saved a profile', async () => {
            await db.doc('users/u1').set({
                ...emptyUser,
                birthData: {
                    birthDate: '1980-01-01', zodiac: 'capricorn', birthTime: null, birthPlace: null,
                },
                gender: 'FEMALE',
            });

            const { sessionId } = await service.create();
            await service.saveProfile(sessionId, {
                ...profile, gender: 'MALE',
            });
            await service.claim(sessionId, 'u1');

            expect((await db.doc('users/u1').get()).data()?.gender).toBe('FEMALE');
        });

        describe('human design', () => {
            const guestChart = {
                result: calculateHumanDesign('1990-06-15', '12:00', 'Europe/Madrid'),
                inputDigest: 'guest-digest',
                calculatedAt: NOW - 60_000,
            };

            it('moves the guest\'s chart into the account for 3 months from when it was calculated', async () => {
                await db.doc('users/u1').set(emptyUser);
                const sessionId = await sessionWithResults();
                await service.saveHumanDesign(sessionId, guestChart);

                await service.claim(sessionId, 'u1');

                expect((await db.doc('users/u1/humanDesign/main').get()).data()).toMatchObject({
                    inputDigest: 'guest-digest',
                    result: { profile: '2/4' },
                    expiresAt: addMonths(NOW - 60_000, 3),
                });
                expect((await db.doc(`guestSessions/${sessionId}`).get()).data()?.tempResults).toBeNull();
            });

            it('keeps a chart the member already has', async () => {
                await db.doc('users/u1').set(emptyUser);
                await db.doc('users/u1/humanDesign/main').set({
                    result: {}, inputDigest: 'member-digest', calculatedAt: NOW - DAY, expiresAt: addMonths(NOW, 2),
                });
                const sessionId = await sessionWithResults();
                await service.saveHumanDesign(sessionId, guestChart);

                await service.claim(sessionId, 'u1');

                expect((await db.doc('users/u1/humanDesign/main').get()).data()?.inputDigest).toBe('member-digest');
            });

            it('saves nothing when the guest never calculated one', async () => {
                await db.doc('users/u1').set(emptyUser);

                await service.claim(await sessionWithResults(), 'u1');

                expect((await db.doc('users/u1/humanDesign/main').get()).exists).toBe(false);
            });
        });

        it('clears the temporary data on the first claim', async () => {
            await db.doc('users/u1').set(emptyUser);
            const sessionId = await sessionWithResults();

            await service.claim(sessionId, 'u1');

            const stored = (await db.doc(`guestSessions/${sessionId}`).get()).data();
            expect(stored).toMatchObject({
                tempProfile: null, tempResults: null, claimedBy: 'u1',
            });
        });

        it('is idempotent for the same user', async () => {
            await db.doc('users/u1').set(emptyUser);
            const sessionId = await sessionWithResults();

            const first = await service.claim(sessionId, 'u1');
            const second = await service.claim(sessionId, 'u1');

            expect(second).toEqual(first);
            expect(db.paths().filter((p) => p.includes('/testAttempts/'))).toHaveLength(1);
        });

        it('does not let another account take a claimed session', async () => {
            await db.doc('users/u1').set(emptyUser);
            await db.doc('users/u2').set(emptyUser);
            const sessionId = await sessionWithResults();

            await service.claim(sessionId, 'u1');

            await expect(service.claim(sessionId, 'u2')).rejects.toBeInstanceOf(ForbiddenError);
        });

        it('creates a single attempt when claimed concurrently', async () => {
            await db.doc('users/u1').set(emptyUser);
            const sessionId = await sessionWithResults();

            await Promise.all([
                service.claim(sessionId, 'u1'),
                service.claim(sessionId, 'u1'),
                service.claim(sessionId, 'u1'),
            ]);

            expect(db.paths().filter((p) => p.includes('/testAttempts/'))).toHaveLength(1);
        });

        it('keeps a profile the user already saved', async () => {
            await db.doc('users/u1').set({
                ...emptyUser,
                birthData: {
                    birthDate: '1990-01-01', zodiac: 'capricorn', birthTime: null, birthPlace: null,
                },
                bloodType: 'A',
            });
            const sessionId = await sessionWithResults();

            await service.claim(sessionId, 'u1');

            const user = (await db.doc('users/u1').get()).data();
            expect(user?.birthData).toMatchObject({ zodiac: 'capricorn' });
            expect(user?.bloodType).toBe('A');
        });

        it('returns Gone for an expired or unknown session', async () => {
            await db.doc('users/u1').set(emptyUser);
            const sessionId = await sessionWithResults();
            clock.now += DAY;

            await expect(service.claim(sessionId, 'u1')).rejects.toBeInstanceOf(GoneError);
            await expect(service.claim('y'.repeat(32), 'u1')).rejects.toBeInstanceOf(GoneError);
        });

        it('requires the user account to exist', async () => {
            const sessionId = await sessionWithResults();

            await expect(service.claim(sessionId, 'nobody')).rejects.toBeInstanceOf(NotFoundError);
        });

        it('saves zero attempts when the guest never took a test', async () => {
            await db.doc('users/u1').set(emptyUser);
            const { sessionId } = await service.create();
            await service.saveProfile(sessionId, profile);

            expect(await service.claim(sessionId, 'u1')).toEqual({ savedAttempts: 0 });
        });
    });
});
