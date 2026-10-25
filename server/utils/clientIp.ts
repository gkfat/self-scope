import type { H3Event } from 'h3';
import { getRequestIP } from 'h3';

/**
 * Best-effort client IP behind Vercel's proxy (first X-Forwarded-For hop).
 * Returns 'unknown' when it cannot be determined; callers must treat that as one shared bucket.
 */
export function getClientIp(event: H3Event): string {
    return getRequestIP(event, { xForwardedFor: true }) ?? 'unknown';
}
