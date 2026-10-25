import {
    beforeEach, describe, expect, it, vi,
} from 'vitest';
import { AccountService } from './account.service';
import { AccountRepository } from '../repositories/account.repository';
import { FakeFirestore } from '../test-utils/fakeFirestore';
import {
    addDays, addMonths, DAY_MS,
} from '../../shared/utils/time';

const HMAC_KEY = 'test-key';
const START = Date.UTC(2026, 0, 15);

type Clock = { now: number };

function createService(db: FakeFirestore, clock: Clock) {
    // The fake only implements the Firestore surface the repository touches.
    const repository = new AccountRepository();
    (repository as unknown as { db: FakeFirestore }).db = db;

    return new AccountService({
        repository,
        getHmacKey: () => HMAC_KEY,
        clock: () => clock.now,
    });
}

vi.mock('../utils/firebaseAdmin', () => ({ getAdminFirestore: () => ({}) }));

describe('AccountService.login', () => {
    let db: FakeFirestore;
    let clock: Clock;
    let service: AccountService;

    beforeEach(() => {
        db = new FakeFirestore();
        clock = { now: START };
        service = createService(db, clock);
    });

    it('creates the account and grants 3 points on first login', async () => {
        const result = await service.login({
            uid: 'u1', email: 'a@example.com',
        });

        expect(result).toEqual({
            userId: 'u1',
            email: 'a@example.com',
            isNewUser: true,
            welcomePointsGranted: 3,
        });

        const batch = (await db.doc('users/u1/pointBatches/welcome').get()).data();
        expect(batch).toMatchObject({
            source: 'WELCOME', granted: 3, remaining: 3,
        });
        expect(batch?.expiresAt).toBe(addDays(START, 90));
        expect((await db.doc('users/u1/pointTransactions/welcome').get()).exists).toBe(true);
    });

    it('does not store the raw Google uid in the grant record', async () => {
        await service.login({
            uid: 'u1', email: 'a@example.com',
        });

        const grantPaths = db.paths().filter((p) => p.startsWith('welcomeGrants/'));
        expect(grantPaths).toHaveLength(1);
        expect(grantPaths[0]).not.toContain('u1');
    });

    it('does not grant again on a second login', async () => {
        await service.login({
            uid: 'u1', email: 'a@example.com',
        });
        const second = await service.login({
            uid: 'u1', email: 'a@example.com',
        });

        expect(second.isNewUser).toBe(false);
        expect(second.welcomePointsGranted).toBe(0);
    });

    it('grants only once when first logins race', async () => {
        const results = await Promise.all([
            service.login({
                uid: 'u1', email: 'a@example.com',
            }),
            service.login({
                uid: 'u1', email: 'a@example.com',
            }),
            service.login({
                uid: 'u1', email: 'a@example.com',
            }),
        ]);

        expect(results.filter((r) => r.isNewUser)).toHaveLength(1);
        expect(results.reduce((sum, r) => sum + r.welcomePointsGranted, 0)).toBe(3);
        expect(db.paths().filter((p) => p.includes('/pointBatches/'))).toHaveLength(1);
    });

    it('withholds the grant when the account re-registers within 3 months', async () => {
        await service.login({
            uid: 'u1', email: 'a@example.com',
        });
        await db.recursiveDelete(db.doc('users/u1'));

        clock.now = addMonths(START, 3) - DAY_MS;
        const again = await service.login({
            uid: 'u1', email: 'a@example.com',
        });

        expect(again.isNewUser).toBe(true);
        expect(again.welcomePointsGranted).toBe(0);
        expect(db.paths().filter((p) => p.includes('/pointBatches/'))).toHaveLength(0);
        expect((await db.doc('users/u1/pointAccount/main').get()).data()?.welcomeGrantedAt).toBeNull();
    });

    it('grants again once the grant record has expired', async () => {
        await service.login({
            uid: 'u1', email: 'a@example.com',
        });
        await db.recursiveDelete(db.doc('users/u1'));

        // TTL deletion is lazy, so the expired record still exists here.
        clock.now = addMonths(START, 3) + DAY_MS;
        const again = await service.login({
            uid: 'u1', email: 'a@example.com',
        });

        expect(again.welcomePointsGranted).toBe(3);
    });

    it('rejects a Google account without an email', async () => {
        await expect(service.login({ uid: 'u1' })).rejects.toThrow('no email');
    });
});
