import { BaseService } from './base.service';
import { RateLimitRepository } from '../repositories/rateLimit.repository';
import { RateLimitError } from '../../shared/types/errors';

type RateLimitServiceOptions = {
    repository?: RateLimitRepository;
    clock?: () => number;
};

/**
 * Fixed-window rate limiter backed by Firestore, so the limit holds across
 * serverless instances. Keys must already be non-identifying (hash IPs first).
 */
export class RateLimitService extends BaseService {
    protected serviceName = 'rate-limit';

    private readonly repository: RateLimitRepository;
    private readonly clock: () => number;

    constructor(options: RateLimitServiceOptions = {}) {
        super();
        this.repository = options.repository ?? new RateLimitRepository();
        this.clock = options.clock ?? Date.now;
    }

    /**
     * Count one hit for `key`; throws RateLimitError when the window is already full.
     */
    async consume(key: string, limit: number, windowMs: number): Promise<void> {
        const windowStart = Math.floor(this.clock() / windowMs) * windowMs;
        const ref = this.repository.ref(`${key}_${windowStart}`);

        await this.repository.runTransaction(async (tx) => {
            const snap = await tx.get(ref);
            const count = snap.exists ? (snap.data() as { count: number }).count : 0;

            if (count >= limit) {
                throw new RateLimitError('Too many requests, please try again later');
            }

            tx.set(ref, {
                count: count + 1,
                // Keep the doc one extra window so slow TTL cleanup never matters for correctness.
                expiresAt: new Date(windowStart + windowMs * 2),
            });
        });
    }
}
