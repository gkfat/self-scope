import {
    describe, expect, it,
} from 'vitest';
import {
    jieAround, solarTermsOfYear, sunLongitude, termAround,
} from './solarTerms';

const MINUTE_MS = 60 * 1000;

/** A published term time in Taiwan standard time (UTC+8), as a UTC instant. */
function cst(isoLocal: string): number {
    return Date.parse(`${isoLocal}:00+08:00`);
}

function termTime(year: number, name: string): number {
    const term = solarTermsOfYear(year).find((item) => item.name === name);

    if (!term) throw new Error(`Missing term ${name} ${year}`);

    return term.time.getTime();
}

describe('solarTermsOfYear', () => {
    // Term times as published by the Hong Kong Observatory / Central Weather Administration, minute precision.
    // 2019–2025 cover leap years (2020, 2024) and years whose 立春 falls on Feb 3 (2021, 2025).
    it.each([
        [
            2019,
            '立春',
            '2019-02-04T11:14',
        ],
        [
            2020,
            '立春',
            '2020-02-04T17:03',
        ],
        [
            2021,
            '立春',
            '2021-02-03T22:59',
        ],
        [
            2022,
            '立春',
            '2022-02-04T04:51',
        ],
        [
            2023,
            '立春',
            '2023-02-04T10:42',
        ],
        [
            2024,
            '立春',
            '2024-02-04T16:27',
        ],
        [
            2025,
            '立春',
            '2025-02-03T22:10',
        ],
        [
            2020,
            '驚蟄',
            '2020-03-05T10:57',
        ],
        [
            2024,
            '驚蟄',
            '2024-03-05T10:22',
        ],
        [
            2024,
            '清明',
            '2024-04-04T15:02',
        ],
        [
            2025,
            '清明',
            '2025-04-04T20:48',
        ],
    ])('%i %s is within a minute of %s', (year, name, published) => {
        expect(Math.abs(termTime(year, name) - cst(published))).toBeLessThanOrEqual(MINUTE_MS);
    });

    it('returns 24 terms in increasing time order, twelve of which start a month', () => {
        const terms = solarTermsOfYear(2024);
        const times = terms.map((term) => term.time.getTime());

        expect(terms).toHaveLength(24);
        expect(times).toEqual([...times].sort((a, b) => a - b));
        expect(terms.filter((term) => term.monthBranch !== null)).toHaveLength(12);
    });

    it('puts the Sun on each term longitude', () => {
        for (const term of solarTermsOfYear(2024)) {
            const diff = Math.abs(((sunLongitude(term.time) - term.longitude + 540) % 360) - 180);

            expect(diff).toBeLessThan(0.001);
        }
    });

    it('works across 1900 and far dates', () => {
        expect(solarTermsOfYear(1899)).toHaveLength(24);
        expect(solarTermsOfYear(1900)).toHaveLength(24);
        expect(solarTermsOfYear(2100)).toHaveLength(24);
    });

    it('returns the cached array for a repeated year', () => {
        expect(solarTermsOfYear(2023)).toBe(solarTermsOfYear(2023));
    });
});

describe('jieAround / termAround', () => {
    it('finds the 節 in force, with the previous and next ones', () => {
        const {
            current, previous, next, 
        } = jieAround(new Date(cst('1989-10-27T06:00')));

        expect(current.name).toBe('寒露');
        expect(previous.name).toBe('白露');
        expect(next.name).toBe('立冬');
    });

    it('treats the exact term instant as already in the new term', () => {
        const start = solarTermsOfYear(2024).find((term) => term.name === '立春');

        expect(jieAround(start!.time).current.name).toBe('立春');
        expect(jieAround(new Date(start!.time.getTime() - 1)).current.name).toBe('小寒');
    });

    it('crosses the calendar year (大雪 → 小寒 → 立春)', () => {
        expect(jieAround(new Date(cst('2023-12-31T12:00'))).current.name).toBe('大雪');
        expect(jieAround(new Date(cst('2024-01-10T12:00'))).current.name).toBe('小寒');
    });

    it('names the 中氣 too when asked for all 24 terms', () => {
        expect(termAround(new Date(cst('1989-10-27T06:00'))).current.name).toBe('霜降');
    });
});
