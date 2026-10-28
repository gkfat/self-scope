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

    it('gives twelve houses and the aspects, in the shape the schema promises', () => {
        const chart = service.calculate(request);

        expect(chart.houses).toHaveLength(12);
        expect(chart.houses[0]?.sign).toBe(chart.ascendant.sign);
        expect(chart.houses.flatMap((house) => house.bodies)).toHaveLength(10);
        expect(chart.aspects.every((aspect) => aspect.orb <= 8)).toBe(true);
        expect(natalChartResponseSchema.safeParse(chart).success).toBe(true);
    });

    it('leaves the signs and the ascendant exactly as they were before the houses and aspects were added', () => {
        const chart = service.calculate({
            birthDate: '1995-03-25', birthTime: '14:30', birthPlace: 'tw-taipei',
        });
        const again = service.calculate({
            birthDate: '1995-03-25', birthTime: '14:30', birthPlace: 'tw-taipei',
        });

        expect(chart.bodies).toEqual(again.bodies);
        expect(chart.bodies.SUN).toEqual({
            sign: 'aries', degree: 4,
        });
        expect(chart.houses[0]?.sign).toBe(chart.ascendant.sign);
    });

    it('does not guess a house without a birth time or a city: the request is turned away', () => {
        expect(natalChartRequestSchema.safeParse({
            birthDate: '1995-03-25', birthPlace: 'tw-taipei',
        }).success).toBe(false);
        expect(natalChartRequestSchema.safeParse({
            birthDate: '1995-03-25', birthTime: '14:30',
        }).success).toBe(false);
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
