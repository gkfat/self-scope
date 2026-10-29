import type { NatalChartResponse } from '../schemas/api/natalChart.schema';
import { ZODIACS } from '../schemas/common';
import { SIGN_RULERS } from './natal';

/**
 * A made-up chart that belongs to nobody, drawn blurred behind the invitation to fill in a birth time and city, so that
 * the card shows what the chart will look like. It is never shown sharp and never read as the member's own.
 */
export const SAMPLE_NATAL_CHART: NatalChartResponse = {
    ascendant: {
        sign: 'aries', degree: 12,
    },
    bodies: {
        SUN: {
            sign: 'leo', degree: 8,
        },
        MOON: {
            sign: 'cancer', degree: 20,
        },
        MERCURY: {
            sign: 'virgo', degree: 3,
        },
        VENUS: {
            sign: 'libra', degree: 14,
        },
        MARS: {
            sign: 'sagittarius', degree: 25,
        },
        JUPITER: {
            sign: 'gemini', degree: 9,
        },
        SATURN: {
            sign: 'capricorn', degree: 17,
        },
        URANUS: {
            sign: 'aquarius', degree: 2,
        },
        NEPTUNE: {
            sign: 'pisces', degree: 22,
        },
        PLUTO: {
            sign: 'scorpio', degree: 5,
        },
    },
    houses: ZODIACS.map((sign, index) => ({
        house: index + 1,
        sign,
        ruler: SIGN_RULERS[sign],
        bodies: [],
    })),
    aspects: [
        {
            body1: 'SUN', body2: 'MOON', type: 'SEXTILE', orb: 3.2,
        },
        {
            body1: 'SUN', body2: 'MARS', type: 'TRINE', orb: 1.4,
        },
        {
            body1: 'MOON', body2: 'SATURN', type: 'OPPOSITION', orb: 2.6,
        },
        {
            body1: 'VENUS', body2: 'PLUTO', type: 'SQUARE', orb: 4.1,
        },
        {
            body1: 'MERCURY', body2: 'URANUS', type: 'TRINE', orb: 2.2,
        },
    ],
    timeNote: null,
};
