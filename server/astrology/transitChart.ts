import * as Astronomy from 'astronomy-engine';
import {
    bodyLongitude, placementFromLongitude, type Placement,
} from './natalChart';
import {
    NATAL_BODIES, type NatalBody,
} from '../../shared/constants/natal';

const HOUR_MS = 60 * 60 * 1000;
/** Taipei is UTC+8 all year (no daylight saving). */
const TAIPEI_OFFSET_MS = 8 * HOUR_MS;
const DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** The moment of 00:00 on a Taipei calendar date (`YYYY-MM-DD`), as a UTC instant. */
export function taipeiMidnightUtc(dateKey: string): Date {
    const match = DATE_KEY.exec(dateKey);

    if (!match) throw new RangeError(`Not an ISO date: ${dateKey}`);

    return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) - TAIPEI_OFFSET_MS);
}

/** Exact ecliptic longitudes (degrees, 0 to 360) of the ten bodies at a moment. */
export function computeBodyLongitudes(time: Astronomy.AstroTime): Record<NatalBody, number> {
    return Object.fromEntries(
        NATAL_BODIES.map((body) => [body, ((bodyLongitude(body, time) % 360) + 360) % 360]),
    ) as Record<NatalBody, number>;
}

export type TransitChart = {
    /** The Taipei date the chart belongs to */
    transitDate: string;
    /** The instant it is cast for: 00:00 on that date in Taipei, as epoch milliseconds */
    transitAt: number;
    /** Exact longitudes, for aspects */
    longitudes: Record<NatalBody, number>;
    /** The same, as sign and whole degree, for showing */
    placements: Record<NatalBody, Placement>;
};

/**
 * The sky on a Taipei date, always as it is at 00:00 there: one chart for the whole day, whenever it is asked for.
 * The Moon moves about 13 degrees a day, so by evening it is well away from where this chart has it.
 */
export function computeTransitChart(transitDate: string): TransitChart {
    const moment = taipeiMidnightUtc(transitDate);
    const longitudes = computeBodyLongitudes(Astronomy.MakeTime(moment));

    return {
        transitDate,
        transitAt: moment.getTime(),
        longitudes,
        placements: Object.fromEntries(
            NATAL_BODIES.map((body) => [body, placementFromLongitude(longitudes[body])]),
        ) as Record<NatalBody, Placement>,
    };
}
