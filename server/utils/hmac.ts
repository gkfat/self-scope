import { createHmac } from 'node:crypto';

/**
 * Keyed hash (HMAC-SHA256, hex). Used wherever a personal identifier must be
 * compared or rate-limited without storing it raw.
 */
export function keyedHash(value: string, key: string): string {
    return createHmac('sha256', key).update(value).digest('hex');
}

/**
 * Keyed hash of a Google account id. The welcome-grant ledger stores only this
 * value, never the raw id (RULE-031).
 */
export function hashGoogleUid(googleId: string, key: string): string {
    return keyedHash(googleId, key);
}
