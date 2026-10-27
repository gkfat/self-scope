import {
    SearchSunLongitude, SunPosition,
} from 'astronomy-engine';
import { SOLAR_TERMS } from '../../constants/bazi';
import type { Branch } from '../../constants/bazi';
import { DAY_MS } from '../time';

export type SolarTerm = {
    name: string;
    /** Position in the 24-term list of a Gregorian year (0 = 小寒). */
    index: number;
    longitude: number;
    /** The moment the Sun reaches the term's longitude. */
    time: Date;
    /** Month branch started by this term; null for the twelve 中氣. */
    monthBranch: Branch | null;
};

/** The window opens this many days before the approximate date and must contain the term. */
const SEARCH_LEAD_DAYS = 6;
const SEARCH_WINDOW_DAYS = 14;

const cache = new Map<number, SolarTerm[]>();

/** All 24 solar terms of a Gregorian year in time order. Cached per year. */
export function solarTermsOfYear(year: number): readonly SolarTerm[] {
    const cached = cache.get(year);

    if (cached) return cached;

    const terms = SOLAR_TERMS.map((def, index): SolarTerm => {
        const [month, day] = def.approx;
        const start = new Date(Date.UTC(year, month - 1, day) - SEARCH_LEAD_DAYS * DAY_MS);
        const found = SearchSunLongitude(def.longitude, start, SEARCH_WINDOW_DAYS);

        if (!found) {
            throw new Error(`Solar term not found: ${def.name} ${year}`);
        }

        return {
            name: def.name,
            index,
            longitude: def.longitude,
            time: found.date,
            monthBranch: def.monthBranch,
        };
    });

    cache.set(year, terms);

    return terms;
}

export type TermNeighbours = {
    /** The latest term at or before the instant. */
    current: SolarTerm;
    previous: SolarTerm;
    next: SolarTerm;
};

function neighbours(instant: Date, onlyJie: boolean): TermNeighbours {
    const year = instant.getUTCFullYear();
    const terms = [
        year - 1,
        year,
        year + 1,
    ]
        .flatMap((y) => solarTermsOfYear(y))
        .filter((term) => !onlyJie || term.monthBranch !== null);
    const at = instant.getTime();
    let currentIndex = -1;

    for (let i = 0; i < terms.length; i++) {
        if ((terms[i] as SolarTerm).time.getTime() <= at) currentIndex = i;
    }

    const current = terms[currentIndex];
    const previous = terms[currentIndex - 1];
    const next = terms[currentIndex + 1];

    if (!current || !previous || !next) {
        throw new Error(`Solar term lookup out of range: ${instant.toISOString()}`);
    }

    return {
        current, previous, next,
    };
}

/** The twelve 節 around an instant: the one in force (月令), the one before it, and the next one. */
export function jieAround(instant: Date): TermNeighbours {
    return neighbours(instant, true);
}

/** Same lookup across all 24 terms (節 and 中氣), for naming the term a birth falls in. */
export function termAround(instant: Date): TermNeighbours {
    return neighbours(instant, false);
}

/** The Sun's apparent ecliptic longitude at an instant, in degrees [0, 360). */
export function sunLongitude(instant: Date): number {
    return SunPosition(instant).elon;
}
