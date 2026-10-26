import {
    describe, expect, it,
} from 'vitest';
import { calculateHumanDesign } from './calculate';
import type { HumanDesignActivation } from '../../shared/schemas/firestore/humanDesign.schema';

/** "gate.line" in the order Sun, Earth, Moon, North Node, South Node, Mercury … Pluto. */
const asList = (activations: HumanDesignActivation[]) => activations.map((a) => `${a.gate}.${a.line}`);

describe('chart 1973-03-03 05:15 Paris (published example)', () => {
    const chart = calculateHumanDesign('1973-03-03', '05:15', 'Europe/Paris');

    it('matches the published gates and lines', () => {
        expect(asList(chart.personality)).toEqual([
            '63.2',
            '64.2',
            '49.2',
            '54.1',
            '53.1',
            '25.1',
            '55.4',
            '38.5',
            '60.6',
            '35.3',
            '32.2',
            '9.2',
            '46.6',
        ]);
        expect(asList(chart.design)).toEqual([
            '5.4',
            '35.4',
            '26.5',
            '54.2',
            '53.2',
            '14.2',
            '1.2',
            '1.1',
            '38.3',
            '45.1',
            '32.2',
            '34.6',
            '18.1',
        ]);
    });

    it('matches the published type, profile, authority and definition', () => {
        expect(chart).toMatchObject({
            type: 'PROJECTOR', profile: '2/4', authority: 'SPLENIC', definition: 'SINGLE',
        });
        expect(chart.incarnationCross).toEqual({
            angle: 'RIGHT_ANGLE', gates: [
                63,
                64,
                5,
                35,
            ],
        });
    });
});

describe('chart 1990-06-15 12:00 Madrid (Jovian Archive result, UTC 10:00)', () => {
    const chart = calculateHumanDesign('1990-06-15', '12:00', 'Europe/Madrid');

    it('matches the official gates and lines', () => {
        expect(asList(chart.personality)).toEqual([
            '12.2',
            '11.2',
            '63.4',
            '19.1',
            '33.1',
            '20.6',
            '2.6',
            '21.2',
            '53.1',
            '61.4',
            '58.5',
            '38.5',
            '1.3',
        ]);
        expect(asList(chart.design)).toEqual([
            '36.4',
            '6.4',
            '14.3',
            '13.3',
            '7.3',
            '36.2',
            '19.3',
            '41.3',
            '15.4',
            '61.3',
            '58.6',
            '38.6',
            '1.5',
        ]);
    });

    it('matches the official type, authority, profile and definition', () => {
        expect(chart).toMatchObject({
            type: 'MANIFESTING_GENERATOR', authority: 'SACRAL', profile: '2/4', definition: 'SINGLE',
        });
        expect(chart.incarnationCross).toEqual({
            angle: 'RIGHT_ANGLE', gates: [
                12,
                11,
                36,
                6,
            ],
        });
        expect(chart.channels).toEqual(expect.arrayContaining([[2, 14], [13, 33]]));
    });
});

describe('chart 1996-10-27 01:30 London (Jovian Archive result, first 01:30 = UTC 00:30)', () => {
    const chart = calculateHumanDesign('1996-10-27', '01:30', 'Europe/London');

    it('matches the official gates and lines', () => {
        expect(asList(chart.personality)).toEqual([
            '28.2',
            '27.2',
            '24.2',
            '18.5',
            '17.5',
            '50.4',
            '6.5',
            '29.4',
            '38.3',
            '25.4',
            '60.5',
            '61.5',
            '34.2',
        ]);
        expect(asList(chart.design)).toEqual([
            '31.5',
            '41.5',
            '38.2',
            '48.1',
            '21.1',
            '4.5',
            '45.6',
            '15.4',
            '38.1',
            '17.4',
            '41.1',
            '61.6',
            '34.1',
        ]);
    });

    it('matches the official type, authority, profile and definition', () => {
        expect(chart).toMatchObject({
            type: 'MANIFESTING_GENERATOR', authority: 'SACRAL', profile: '2/5', definition: 'TRIPLE_SPLIT',
        });
        expect(chart.incarnationCross).toEqual({
            angle: 'RIGHT_ANGLE', gates: [
                28,
                27,
                31,
                41,
            ],
        });
        expect(chart.channels).toEqual(expect.arrayContaining([
            [21, 45],
            [24, 61],
            [27, 50],
            [28, 38],
        ]));
    });
});
