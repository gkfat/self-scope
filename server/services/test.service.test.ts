import {
    beforeEach, describe, expect, it, vi,
} from 'vitest';
import definition from '../../content/tests/personality16-v1.json';
import { FakeFirestore } from '../test-utils/fakeFirestore';
import { TestService } from './test.service';
import { GuestSessionService } from './guestSession.service';
import {
    NotFoundError, ValidationError,
} from '../../shared/types/errors';
import { MBTI_TYPES } from '../../shared/schemas/common';
import { addMonths } from '../../shared/utils/time';
import { testDefinitionFileSchema } from '../../shared/schemas/firestore/test.schema';

const holder = vi.hoisted(() => ({ db: undefined as unknown }));

vi.mock('../utils/firebaseAdmin', () => ({ getAdminFirestore: () => holder.db }));

const NOW = Date.UTC(2026, 0, 15, 12);
const {
    questions, scoringRule, 
} = testDefinitionFileSchema.parse(definition);

const leaning = (toward: 'first' | 'second', extra: Record<string, unknown> = {}) => questions.map((q) => ({
    questionId: q.questionId,
    value: q.direction === toward ? 5 : 1,
    ...extra,
}));

async function seed(db: FakeFirestore) {
    await db.doc('tests/personality16').set({
        title: '16 型人格測驗', currentVersion: '1', active: true, updatedAt: NOW,
    });
    await db.doc('tests/personality16/versions/1').set({
        questions, scoringRule, publishedAt: NOW,
    });

    for (const type of MBTI_TYPES) {
        await db.doc(`fixedContents/MBTI_${type}`).set({
            contentType: 'MBTI',
            key: type,
            body: {
                title: type,
                summary: `${type} 的固定內容`,
                strengths: [],
                blindSpots: [],
                loveStyle: '',
                workStyle: '',
                communicationStyle: '',
                growthAdvice: '',
                disclaimer: '僅供娛樂與自我探索',
            },
            contentVersion: '1',
            status: 'PUBLISHED',
            updatedAt: NOW,
            publishedAt: NOW,
        });
    }
}

const userDoc = {
    email: 'a@example.com',
    birthData: null,
    bloodType: 'UNKNOWN',
    mbti: null,
    mbtiExpiresAt: null,
    createdAt: NOW,
    updatedAt: NOW,
};

describe('TestService', () => {
    let db: FakeFirestore;
    let service: TestService;
    const anon = {
        uid: null, guestSessionId: null,
    };

    beforeEach(async () => {
        db = new FakeFirestore();
        holder.db = db;
        await seed(db);
        service = new TestService({ clock: () => NOW });
    });

    describe('listTests / getTest', () => {
        it('lists active tests with their question count', async () => {
            expect(await service.listTests()).toEqual([
                {
                    testId: 'personality16',
                    title: '16 型人格測驗',
                    version: '1',
                    questionCount: 32,
                },
            ]);
        });

        it('hides inactive tests', async () => {
            await db.doc('tests/personality16').update({ active: false });

            expect(await service.listTests()).toEqual([]);
            await expect(service.getTest('personality16')).rejects.toBeInstanceOf(NotFoundError);
        });

        it('returns questions without any scoring information', async () => {
            const test = await service.getTest('personality16');

            expect(test.questions).toHaveLength(32);
            expect(JSON.stringify(test)).not.toContain('direction');
            expect(JSON.stringify(test)).not.toContain('dimension');
            expect(JSON.stringify(test)).not.toContain('scoringRule');
        });

        it('returns 404 for an unknown test', async () => {
            await expect(service.getTest('nope')).rejects.toBeInstanceOf(NotFoundError);
        });
    });

    describe('submit', () => {
        const request = (answers = leaning('first')) => ({
            testVersion: '1', answers,
        });

        it('scores on the server and returns the fixed content', async () => {
            const response = await service.submit('personality16', request(), anon);

            expect(response.result).toBe('ESTJ');
            expect(response.content).toMatchObject({
                contentType: 'MBTI', key: 'ESTJ', disclaimer: '僅供娛樂與自我探索',
            });
            expect(response.persisted).toBe(false);
            expect(response.attemptId).toBeNull();
        });

        it('returns the strength of each dimension, agreeing with the type', async () => {
            const response = await service.submit('personality16', request(), anon);

            expect(Object.keys(response.dimensions)).toEqual(scoringRule.dimensions.map((d) => d.id));
            expect(Object.values(response.dimensions).map((d) => d.leaning).join('')).toBe(response.result);

            for (const dimension of Object.values(response.dimensions)) {
                expect(Math.abs(dimension.score)).toBeLessThanOrEqual(dimension.maxScore);
                expect(dimension.maxScore).toBeGreaterThan(0);
            }
        });

        it('breaks a tied dimension with the rule\'s tie-break, as the type does', async () => {
            const neutral = questions.map((q) => ({
                questionId: q.questionId, value: scoringRule.neutralValue,
            }));
            const response = await service.submit('personality16', request(neutral), anon);

            expect(Object.values(response.dimensions).every((d) => d.score === 0)).toBe(true);
            expect(Object.values(response.dimensions).map((d) => d.leaning)).toEqual(scoringRule.dimensions.map((d) => d.tieBreak));
            expect(Object.values(response.dimensions).map((d) => d.leaning).join('')).toBe(response.result);
        });

        it('rejects incomplete or invalid answers without saving anything', async () => {
            await db.doc('users/u1').set(userDoc);

            await expect(service.submit('personality16', request(leaning('first').slice(2)), {
                uid: 'u1', guestSessionId: null,
            })).rejects.toBeInstanceOf(ValidationError);

            expect(db.paths().filter((p) => p.includes('/testAttempts/'))).toEqual([]);
        });

        it('rejects an unknown test version', async () => {
            await expect(service.submit('personality16', {
                testVersion: '99', answers: leaning('first'),
            }, anon)).rejects.toBeInstanceOf(NotFoundError);
        });

        it('scores against the submitted version even after a newer one is published', async () => {
            await db.doc('tests/personality16').update({ currentVersion: '2' });
            await db.doc('tests/personality16/versions/2').set({
                questions: [],
                scoringRule,
                publishedAt: NOW,
            });

            const response = await service.submit('personality16', request(), anon);

            expect(response.testVersion).toBe('1');
            expect(response.result).toBe('ESTJ');
        });

        describe('signed-in user', () => {
            const actor = {
                uid: 'u1', guestSessionId: null,
            };

            beforeEach(async () => {
                await db.doc('users/u1').set(userDoc);
            });

            it('saves the attempt for 3 months and updates the mbti', async () => {
                const response = await service.submit('personality16', request(), actor);

                expect(response.persisted).toBe(true);
                expect(response.expiresAt).toBe(addMonths(NOW, 3));

                const attempt = (await db.doc(`users/u1/testAttempts/${response.attemptId}`).get()).data();
                expect(attempt).toMatchObject({
                    testId: 'personality16', testVersion: '1', result: 'ESTJ', expiresAt: addMonths(NOW, 3),
                });

                const user = (await db.doc('users/u1').get()).data();
                expect(user?.mbti).toBe('ESTJ');
                expect(user?.mbtiExpiresAt).toBe(addMonths(NOW, 3));
            });

            it('drops answer times unless the user agreed to them', async () => {
                const withTimes = leaning('first', { responseTimeMs: 1200 });

                const refused = await service.submit('personality16', request(withTimes), actor);
                const refusedAttempt = (await db.doc(`users/u1/testAttempts/${refused.attemptId}`).get()).data();
                expect((refusedAttempt?.answers as Array<{ responseTimeMs: number | null }>)[0]?.responseTimeMs).toBeNull();

                const agreed = await service.submit('personality16', {
                    ...request(withTimes), responseTimeConsent: true,
                }, actor);
                const agreedAttempt = (await db.doc(`users/u1/testAttempts/${agreed.attemptId}`).get()).data();
                expect((agreedAttempt?.answers as Array<{ responseTimeMs: number | null }>)[0]?.responseTimeMs).toBe(1200);
            });

            it('still returns the result when saving fails', async () => {
                const response = await service.submit('personality16', request(), {
                    uid: 'ghost', guestSessionId: null,
                });

                expect(response).toMatchObject({
                    result: 'ESTJ', persisted: false, saveFailed: true, attemptId: null,
                });
            });
        });

        describe('guest', () => {
            it('keeps the result in the guest session only', async () => {
                const guests = new GuestSessionService({ clock: () => NOW });
                const { sessionId } = await guests.create();
                const guestService = new TestService({
                    clock: () => NOW, guestSessions: guests,
                });

                const response = await guestService.submit('personality16', request(), {
                    uid: null, guestSessionId: sessionId,
                });

                expect(response).toMatchObject({
                    persisted: false, saveFailed: false,
                });
                expect((await db.doc(`guestSessions/${sessionId}`).get()).data()?.tempResults).toMatchObject({ test: { result: 'ESTJ' } });
                expect(db.paths().filter((p) => p.includes('/testAttempts/'))).toEqual([]);
            });

            it('shows the result without saving when the session is unknown', async () => {
                const response = await service.submit('personality16', request(), {
                    uid: null, guestSessionId: 'z'.repeat(32),
                });

                expect(response).toMatchObject({
                    result: 'ESTJ', persisted: false, saveFailed: false,
                });
            });
        });

        it('stores nothing when the fixed content for the result is missing', async () => {
            await db.doc('users/u1').set(userDoc);
            await db.doc('fixedContents/MBTI_ESTJ').delete();

            await expect(service.submit('personality16', request(), {
                uid: 'u1', guestSessionId: null,
            })).rejects.toBeInstanceOf(NotFoundError);
            expect(db.paths().filter((p) => p.includes('/testAttempts/'))).toEqual([]);
        });
    });

    describe('listAttempts', () => {
        it('returns unexpired attempts, newest first', async () => {
            const attempt = (completedAt: number, expiresAt: number) => ({
                testId: 'personality16',
                testVersion: '1',
                answers: leaning('first', { responseTimeMs: null }),
                result: 'INTJ',
                completedAt,
                expiresAt,
            });
            await db.doc('users/u1/testAttempts/old').set(attempt(NOW - 2000, NOW - 1000));
            await db.doc('users/u1/testAttempts/a').set(attempt(NOW - 200, NOW + 1000));
            await db.doc('users/u1/testAttempts/b').set(attempt(NOW - 100, NOW + 1000));
            await db.doc('users/u2/testAttempts/x').set(attempt(NOW, NOW + 1000));

            const attempts = await service.listAttempts('u1');

            expect(attempts.map((a) => a.attemptId)).toEqual(['b', 'a']);
        });

        describe('dimension scores', () => {
            const saved = (testVersion: string, id: string, completedAt = NOW - 100) => db.doc(`users/u1/testAttempts/${id}`).set({
                testId: 'personality16',
                testVersion,
                answers: leaning('first', { responseTimeMs: null }),
                result: 'ESTJ',
                completedAt,
                expiresAt: NOW + 1000,
            });

            it('works them out from the answers with the attempt\'s own version', async () => {
                // A newer version with no questions must not change what an older attempt scored
                await db.doc('tests/personality16/versions/2').set({
                    questions: [], scoringRule, publishedAt: NOW,
                });
                await saved('1', 'a');

                const [attempt] = await service.listAttempts('u1');

                expect(attempt?.dimensions).not.toBeNull();
                expect(Object.values(attempt?.dimensions ?? {}).map((d) => d.leaning).join('')).toBe('ESTJ');
            });

            it('fails when the version of an attempt is gone, rather than guessing a score', async () => {
                await saved('gone', 'a');

                await expect(service.listAttempts('u1')).rejects.toBeInstanceOf(NotFoundError);
            });
        });
    });
});
