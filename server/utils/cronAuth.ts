import { timingSafeEqual } from 'node:crypto';
import { AuthError } from '../../shared/types/errors';

/**
 * Check the `Authorization: Bearer <CRON_SECRET>` header Vercel Cron sends.
 * Compared in constant time so the secret cannot be probed byte by byte.
 */
export function assertCronAuthorized(header: string | undefined, secret: string): void {
    const expected = Buffer.from(`Bearer ${secret}`);
    const actual = Buffer.from(header ?? '');

    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
        throw new AuthError('Invalid cron credentials');
    }
}
