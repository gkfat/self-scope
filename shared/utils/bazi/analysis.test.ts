import {
    describe, expect, it,
} from 'vitest';
import {
    ELEMENTS, STEMS, TEN_GODS, type Stem,
} from '../../constants/bazi';
import {
    analyzeChart,
    dominantElement,
    dominantGroup,
    missingElements,
    tenGodOf,
} from './analysis';
import { calculatePillars } from './pillars';

function chartOf(birthDate: string, birthTime: string | null) {
    return analyzeChart(calculatePillars({
        birthDate,
        birthTime,
        standardOffsetMinutes: 480,
        instant: new Date(`${birthDate}T${birthTime ?? '12:00'}:00+08:00`),
    }));
}

const sum = (counts: Record<string, number>) => Object.values(counts).reduce((total, n) => total + n, 0);

describe('tenGodOf', () => {
    it('maps every stem for a 庚 day master', () => {
        expect(STEMS.map((stem) => tenGodOf('庚', stem))).toEqual([
            '偏財', // 甲
            '正財', // 乙
            '七殺', // 丙
            '正官', // 丁
            '偏印', // 戊
            '正印', // 己
            '比肩', // 庚
            '劫財', // 辛
            '食神', // 壬
            '傷官', // 癸
        ]);
    });

    it('maps every stem for a 乙 (yin wood) day master', () => {
        expect(STEMS.map((stem) => tenGodOf('乙', stem))).toEqual([
            '劫財', // 甲
            '比肩', // 乙
            '傷官', // 丙
            '食神', // 丁
            '正財', // 戊
            '偏財', // 己
            '正官', // 庚
            '七殺', // 辛
            '正印', // 壬
            '偏印', // 癸
        ]);
    });

    it('gives each day master every one of the ten gods exactly once across the ten stems', () => {
        for (const me of STEMS) {
            const gods = STEMS.map((stem: Stem) => tenGodOf(me, stem));

            expect(new Set(gods)).toEqual(new Set(TEN_GODS));
        }
    });
});

describe('analyzeChart: reference chart 1989-10-27 06:00 (己巳 甲戌 庚申 己卯)', () => {
    const chart = chartOf('1989-10-27', '06:00');

    it('has a 庚 yang metal day master', () => {
        expect(chart.dayMaster).toEqual({
            stem: '庚', element: 'metal', polarity: 'YANG',
        });
    });

    it('counts eight elements without weighting', () => {
        expect(chart.elementCounts).toEqual({
            wood: 2, fire: 1, earth: 3, metal: 2, water: 0,
        });
        expect(sum(chart.elementCounts)).toBe(8);
    });

    it('lists the ten god of every stem and hidden stem, with the day master unmarked', () => {
        expect(chart.pillars.map((pillar) => pillar.stemTenGod)).toEqual([
            '正印',
            '偏財',
            null,
            '正印',
        ]);
        expect(chart.pillars[1]?.hiddenStems).toEqual([
            {
                stem: '戊', element: 'earth', role: 'MAIN', tenGod: '偏印',
            },
            {
                stem: '辛', element: 'metal', role: 'MIDDLE', tenGod: '劫財',
            },
            {
                stem: '丁', element: 'fire', role: 'RESIDUAL', tenGod: '正官',
            },
        ]);
    });

    it('sums the seven other characters into five groups', () => {
        expect(chart.groupCounts).toEqual({
            peer: 1, output: 0, wealth: 2, power: 1, resource: 3,
        });
        expect(sum(chart.tenGodCounts)).toBe(7);
        expect(sum(chart.groupCounts)).toBe(7);
    });

    it('picks the dominant element and group, and the missing element', () => {
        expect(dominantElement(chart.elementCounts)).toBe('earth');
        expect(dominantGroup(chart.groupCounts)).toBe('resource');
        expect(missingElements(chart.elementCounts)).toEqual(['water']);
    });
});

describe('analyzeChart: without a birth time', () => {
    it('counts six elements and five ten gods and has no hour pillar', () => {
        const chart = chartOf('1989-10-27', null);

        expect(chart.pillars.map((pillar) => pillar.position)).toEqual([
            'year',
            'month',
            'day',
        ]);
        expect(sum(chart.elementCounts)).toBe(6);
        expect(sum(chart.tenGodCounts)).toBe(5);
        expect(sum(chart.groupCounts)).toBe(5);
    });
});

describe('dominance rules', () => {
    it('needs three characters and a sole top', () => {
        const none = Object.fromEntries(ELEMENTS.map((element) => [element, 0])) as Record<(typeof ELEMENTS)[number], number>;

        expect(dominantElement({
            ...none, wood: 2, fire: 2,
        })).toBeNull();
        expect(dominantElement({
            ...none, wood: 3, fire: 3,
        })).toBeNull();
        expect(dominantElement({
            ...none, wood: 3, fire: 2,
        })).toBe('wood');
        expect(dominantGroup({
            peer: 2, output: 2, wealth: 1, power: 1, resource: 1,
        })).toBeNull();
        expect(dominantGroup({
            peer: 4, output: 1, wealth: 1, power: 1, resource: 0,
        })).toBe('peer');
    });

    it('lists every missing element', () => {
        expect(missingElements({
            wood: 4, fire: 0, earth: 4, metal: 0, water: 0,
        })).toEqual([
            'fire',
            'metal',
            'water',
        ]);
    });
});
