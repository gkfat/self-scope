/**
 * Firestore hands back `Timestamp` objects for fields that were written as `Date`,
 * not `Date`s. Read time fields through these helpers so code works with either
 * (and with plain epoch-millisecond numbers).
 */
type TimestampLike = { toMillis: () => number };

function isTimestampLike(value: unknown): value is TimestampLike {
    return typeof value === 'object' && value !== null && typeof (value as TimestampLike).toMillis === 'function';
}

export function toMillis(value: unknown): number {
    if (typeof value === 'number') return value;
    if (value instanceof Date) return value.getTime();
    if (isTimestampLike(value)) return value.toMillis();

    throw new TypeError('Expected a Firestore Timestamp, Date or epoch milliseconds');
}

export function toDate(value: unknown): Date {
    return new Date(toMillis(value));
}
