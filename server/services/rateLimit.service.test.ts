import {
    beforeEach, describe, expect, it, vi,
} from 'vitest';
import {
    FakeFirestore, FakeTimestamp,
} from '../test-utils/fakeFirestore';
import { RateLimitService } from './rateLimit.service';
import { RateLimitError } from '../../shared/types/errors';

const holder = vi.hoisted(() => ({ db: undefined as unknown }));

vi.mock('../utils/firebaseAdmin', () => ({ getAdminFirestore: () => holder.db }));

const HOUR = 60 * 60 * 1000;

describe('RateLimitService', () => {
    let db: FakeFirestore;
    let now: number;
    let service: RateLimitService;

    beforeEach(() => {
        db = new FakeFirestore();
        holder.db = db;
        now = Date.UTC(2026, 0, 1, 10, 0, 0);
        service = new RateLimitService({ clock: () => now });
    });

    it('allows hits up to the limit and then rejects', async () => {
        await service.consume('k', 2, HOUR);
        await service.consume('k', 2, HOUR);

        await expect(service.consume('k', 2, HOUR)).rejects.toBeInstanceOf(RateLimitError);
    });

    it('counts keys independently', async () => {
        await service.consume('a', 1, HOUR);

        await expect(service.consume('b', 1, HOUR)).resolves.toBeUndefined();
    });

    it('starts a fresh window after the previous one ends', async () => {
        await service.consume('k', 1, HOUR);
        now += HOUR;

        await expect(service.consume('k', 1, HOUR)).resolves.toBeUndefined();
    });

    it('never lets concurrent hits exceed the limit', async () => {
        const results = await Promise.allSettled(
            Array.from({ length: 10 }, () => service.consume('k', 3, HOUR)),
        );

        expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(3);
    });

    it('writes a TTL date so old windows are cleaned up', async () => {
        await service.consume('k', 1, HOUR);

        const [path] = db.paths();
        const stored = (await db.doc(path as string).get()).data();
        expect(stored?.expiresAt).toBeInstanceOf(FakeTimestamp);
    });
});
