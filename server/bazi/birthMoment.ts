import { DEFAULT_BAZI_TIME_ZONE } from '../../shared/constants/bazi';
import type { BirthMoment } from '../../shared/utils/bazi/pillars';
import {
    localTimeToUtc, offsetAt,
} from '../humanDesign/localTime';

const MINUTE_MS = 60 * 1000;
const NOON = '12:00';

export type BirthInput = {
    /** YYYY-MM-DD */
    birthDate: string;
    /** HH:mm, or null when unknown */
    birthTime: string | null;
    /** IANA zone of the birthplace; Asia/Taipei when the place is unknown */
    timeZone?: string;
};

/**
 * Offset (ms) of the zone's standard time in the year of the instant: the smaller of its January and July offsets,
 * which drops the daylight-saving hour (Taiwan used UTC+9 in summer 1946–1979).
 */
function standardOffsetMs(instant: Date, timeZone: string): number {
    const year = instant.getUTCFullYear();

    return Math.min(
        offsetAt(Date.UTC(year, 0, 1), timeZone),
        offsetAt(Date.UTC(year, 6, 1), timeZone),
    );
}

/**
 * Turn a birthplace wall-clock time into what the pillars need: the exact UTC instant (for the solar terms) and the
 * standard-time date and time (for the day and hour pillars). An unknown time is placed at local noon, which only
 * decides the year and month pillars.
 */
export function buildBirthMoment(input: BirthInput): BirthMoment {
    const timeZone = input.timeZone ?? DEFAULT_BAZI_TIME_ZONE;
    const instant = localTimeToUtc(input.birthDate, input.birthTime ?? NOON, timeZone);
    const offset = standardOffsetMs(instant, timeZone);
    const standard = new Date(instant.getTime() + offset).toISOString();

    return {
        birthDate: standard.slice(0, 10),
        birthTime: input.birthTime === null ? null : standard.slice(11, 16),
        standardOffsetMinutes: offset / MINUTE_MS,
        instant,
    };
}
