export const DAY_MS = 24 * 60 * 60 * 1000;

export function addDays(from: number, days: number): number {
    return from + days * DAY_MS;
}

/**
 * Add calendar months, clamping the day so that e.g. Jan 31 + 1 month is
 * the last day of February instead of rolling into March.
 */
export function addMonths(from: number, months: number): number {
    const date = new Date(from);
    const day = date.getUTCDate();

    date.setUTCDate(1);
    date.setUTCMonth(date.getUTCMonth() + months);

    const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
    date.setUTCDate(Math.min(day, lastDay));

    return date.getTime();
}
