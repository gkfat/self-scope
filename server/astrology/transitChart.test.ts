import * as Astronomy from 'astronomy-engine';
import {
    describe, expect, it,
} from 'vitest';
import {
    computeBodyLongitudes, computeTransitChart, taipeiMidnightUtc,
} from './transitChart';
import {
    computeNatalChart, computeNatalLongitudes, placementFromLongitude,
} from './natalChart';
import { NATAL_BODIES } from '../../shared/constants/natal';

describe('taipeiMidnightUtc', () => {
    it('is 00:00 in Taipei (UTC+8), so 16:00 UTC the evening before', () => {
        expect(taipeiMidnightUtc('2026-10-28').toISOString()).toBe('2026-10-27T16:00:00.000Z');
        expect(taipeiMidnightUtc('2026-01-01').toISOString()).toBe('2025-12-31T16:00:00.000Z');
        expect(taipeiMidnightUtc('2028-03-01').toISOString()).toBe('2028-02-29T16:00:00.000Z');
    });

    it('rejects text that is not an ISO date', () => {
        expect(() => taipeiMidnightUtc('2026-10')).toThrow(RangeError);
        expect(() => taipeiMidnightUtc('20261028')).toThrow(RangeError);
    });
});

describe('computeTransitChart', () => {
    it('gives the same chart for the same Taipei date, cast for 00:00 there', () => {
        const chart = computeTransitChart('2026-10-28');

        expect(computeTransitChart('2026-10-28')).toEqual(chart);
        expect(chart.transitDate).toBe('2026-10-28');
        expect(chart.transitAt).toBe(Date.UTC(2026, 9, 27, 16));
    });

    it('moves on with the date: the Moon is a few degrees to a dozen on a day later, the outer planets barely', () => {
        const today = computeTransitChart('2026-10-28').longitudes;
        const tomorrow = computeTransitChart('2026-10-29').longitudes;
        const moved = (body: keyof typeof today) => ((tomorrow[body] - today[body]) % 360 + 360) % 360;

        expect(moved('MOON')).toBeGreaterThan(10);
        expect(moved('MOON')).toBeLessThan(16);
        expect(moved('SUN')).toBeGreaterThan(0.9);
        expect(moved('SUN')).toBeLessThan(1.1);
        expect(moved('PLUTO')).toBeLessThan(0.1);
    });

    it('has all ten bodies, each in 0 to 360 degrees, and its placements are those longitudes cut into signs', () => {
        const chart = computeTransitChart('2026-10-28');

        expect(Object.keys(chart.longitudes)).toEqual([...NATAL_BODIES]);

        for (const body of NATAL_BODIES) {
            expect(chart.longitudes[body]).toBeGreaterThanOrEqual(0);
            expect(chart.longitudes[body]).toBeLessThan(360);
            expect(chart.placements[body]).toEqual(placementFromLongitude(chart.longitudes[body]));
        }
    });

    it('puts the Sun at the equinox where the astronomy says it is: 0 degrees at 2024-03-20 03:06 UTC', () => {
        // The March equinox of 2024 is by definition the moment the Sun's ecliptic longitude is 0
        const longitude = computeBodyLongitudes(Astronomy.MakeTime(new Date(Date.UTC(2024, 2, 20, 3, 6))))['SUN'];
        const offFromZero = Math.min(longitude, 360 - longitude);

        expect(offFromZero).toBeLessThan(0.05);
    });

    it('puts the Sun at the December solstice where the astronomy says it is: 270 degrees at 2024-12-21 09:21 UTC', () => {
        const longitude = computeBodyLongitudes(Astronomy.MakeTime(new Date(Date.UTC(2024, 11, 21, 9, 21))))['SUN'];

        expect(Math.abs(longitude - 270)).toBeLessThan(0.05);
    });
});

describe('exact natal longitudes', () => {
    it('are the longitudes that computeNatalChart cuts into signs and degrees, so the chart output is unchanged', () => {
        // Albert Einstein, 1879-03-14 11:30 LMT, Ulm
        const moment = new Date(Date.UTC(1879, 2, 14, 10, 50, 4));
        const exact = computeNatalLongitudes(moment, 48.4, 9.99);
        const chart = computeNatalChart(moment, 48.4, 9.99);

        expect(placementFromLongitude(exact.ascendant)).toEqual(chart.ascendant);

        for (const body of NATAL_BODIES) expect(placementFromLongitude(exact.bodies[body]), body).toEqual(chart.bodies[body]);

        expect(chart.bodies.URANUS).toEqual({
            sign: 'virgo', degree: 1,
        });
    });
});
