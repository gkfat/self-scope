import { DAY_PILLAR_ANCHOR } from '../../constants/bazi';
import { DAY_MS } from '../time';
import {
    ganzhiFromIndex, ganzhiIndex, type Ganzhi,
} from './ganzhi';

// Kept apart from `pillars.ts` so a screen that only needs the day pillar does not pull in the astronomy code.

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Milliseconds of a real civil date (YYYY-MM-DD) at 00:00 UTC; throws for a malformed or impossible date. */
export function parseDate(isoDate: string): number {
    const match = DATE_PATTERN.exec(isoDate);

    if (!match) throw new Error(`Invalid birth date: ${isoDate}`);

    const [
        year,
        month,
        day,
    ] = [
        Number(match[1]),
        Number(match[2]),
        Number(match[3]),
    ] as [number, number, number];
    const ms = Date.UTC(year, month - 1, day);

    const parsed = new Date(ms);

    // Date.UTC rolls an impossible month or day over, so compare every part back
    if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
        throw new Error(`Invalid birth date: ${isoDate}`);
    }

    return ms;
}

/** Day pillar of a civil date, counted from the anchor day of the sexagenary cycle. */
export function dayPillarOf(isoDate: string): Ganzhi {
    const anchor = ganzhiIndex({
        stem: DAY_PILLAR_ANCHOR.stem,
        branch: DAY_PILLAR_ANCHOR.branch,
    });
    const days = Math.round((parseDate(isoDate) - parseDate(DAY_PILLAR_ANCHOR.isoDate)) / DAY_MS);

    return ganzhiFromIndex(anchor + days);
}
