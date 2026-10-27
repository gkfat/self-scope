import {
    describe, expect, it,
} from 'vitest';
import { NatalChartService } from './natalChart.service';
import {
    natalChartRequestSchema, natalChartResponseSchema,
} from '../../shared/schemas/api/natalChart.schema';
import { ValidationError } from '../../shared/types/errors';

const request = {
    birthDate: '1996-10-27', birthTime: '01:30', birthPlace: 'gb-london',
};

describe('NatalChartService', () => {
    const service = new NatalChartService();

    it('works out the signs for a moment and a city', () => {
        const chart = service.calculate(request);

        // 1996-10-27: the Sun is in Scorpio, and the chart has every body and an ascendant
        expect(chart.bodies.SUN.sign).toBe('scorpio');
        expect(Object.keys(chart.bodies)).toEqual([
            'SUN',
            'MOON',
            'MERCURY',
            'VENUS',
            'MARS',
            'JUPITER',
            'SATURN',
            'URANUS',
            'NEPTUNE',
            'PLUTO',
        ]);
        expect(natalChartResponseSchema.safeParse(chart).success).toBe(true);
        expect(chart.ascendant.sign).toBeTruthy();
    });

    it('says so when the entered time happened twice, and not otherwise', () => {
        expect(service.calculate(request).timeNote).toBe('AMBIGUOUS');
        expect(service.calculate({
            ...request, birthDate: '1996-06-15',
        }).timeNote).toBeNull();
    });

    it('gives a different ascendant for the same date in another city', () => {
        const london = service.calculate(request);
        const taipei = service.calculate({
            ...request, birthPlace: 'tw-taipei',
        });

        expect(london.ascendant).not.toEqual(taipei.ascendant);
    });

    it('rejects a city that is not in the list', () => {
        expect(() => service.calculate({
            ...request, birthPlace: 'nowhere',
        })).toThrow(ValidationError);
    });
});

describe('natalChartRequestSchema', () => {
    it('needs date, time and city together', () => {
        expect(natalChartRequestSchema.safeParse(request).success).toBe(true);
        expect(natalChartRequestSchema.safeParse({
            birthDate: '1996-10-27', birthTime: '01:30',
        }).success).toBe(false);
        expect(natalChartRequestSchema.safeParse({
            ...request, birthDate: '2999-01-01',
        }).success).toBe(false);
        expect(natalChartRequestSchema.safeParse({
            ...request, birthPlace: 'nowhere',
        }).success).toBe(false);
    });
});
