import {
    describe, expect, it,
} from 'vitest';
import {
    computeNatalChart, placementFromLongitude,
} from './natalChart';

describe('placementFromLongitude', () => {
    it.each([
        [
            0,
            'aries',
            0,
        ],
        [
            29.99,
            'aries',
            29,
        ],
        [
            30,
            'taurus',
            0,
        ],
        [
            282.5,
            'capricorn',
            12,
        ],
        [
            359.99,
            'pisces',
            29,
        ],
        [
            360,
            'aries',
            0,
        ],
        [
            -10,
            'pisces',
            20,
        ],
    ])('longitude %s is %s %s°', (longitude, sign, degree) => {
        expect(placementFromLongitude(longitude)).toEqual({
            sign, degree,
        });
    });
});

describe('computeNatalChart', () => {
    it('matches the published chart of Albert Einstein (1879-03-14 11:30 LMT, Ulm)', () => {
        // 11:30 local mean time at 9.99°E is 10:50:04 UTC
        const chart = computeNatalChart(new Date(Date.UTC(1879, 2, 14, 10, 50, 4)), 48.4, 9.99);

        expect(chart.ascendant).toEqual({
            sign: 'cancer', degree: 11,
        });
        expect(chart.bodies).toEqual({
            SUN: {
                sign: 'pisces', degree: 23,
            },
            MOON: {
                sign: 'sagittarius', degree: 14,
            },
            MERCURY: {
                sign: 'aries', degree: 3,
            },
            VENUS: {
                sign: 'aries', degree: 16,
            },
            MARS: {
                sign: 'capricorn', degree: 26,
            },
            JUPITER: {
                sign: 'aquarius', degree: 27,
            },
            SATURN: {
                sign: 'aries', degree: 4,
            },
        });
    });

    it('the same moment gives the same chart, and a different place gives a different ascendant', () => {
        const moment = new Date(Date.UTC(1990, 5, 15, 10));
        const taipei = computeNatalChart(moment, 25.033, 121.5654);
        const madrid = computeNatalChart(moment, 40.4168, -3.7038);

        expect(computeNatalChart(moment, 25.033, 121.5654)).toEqual(taipei);
        expect(taipei.bodies).toEqual(madrid.bodies);
        expect(taipei.ascendant).not.toEqual(madrid.ascendant);
    });
});
