import {
    describe, expect, it,
} from 'vitest';
import {
    BRANCHES, STEMS,
} from '../../constants/bazi';
import {
    branchElement,
    branchPolarity,
    ganzhiFromIndex,
    ganzhiIndex,
    ganzhiLabel,
    shiftGanzhi,
    stemElement,
    stemPolarity,
    yearGanzhi,
} from './ganzhi';

describe('sexagenary cycle', () => {
    it('starts at 甲子 and ends at 癸亥', () => {
        expect(ganzhiLabel(ganzhiFromIndex(0))).toBe('甲子');
        expect(ganzhiLabel(ganzhiFromIndex(59))).toBe('癸亥');
    });

    it('has 60 distinct pairs, each mapping back to its own index', () => {
        const labels = new Set<string>();

        for (let i = 0; i < 60; i++) {
            const pair = ganzhiFromIndex(i);

            labels.add(ganzhiLabel(pair));
            expect(ganzhiIndex(pair)).toBe(i);
        }

        expect(labels.size).toBe(60);
    });

    it('wraps in both directions', () => {
        expect(ganzhiLabel(ganzhiFromIndex(60))).toBe('甲子');
        expect(ganzhiLabel(ganzhiFromIndex(-1))).toBe('癸亥');
        expect(ganzhiLabel(shiftGanzhi({
            stem: '癸', branch: '亥',
        }, 1))).toBe('甲子');
        expect(ganzhiLabel(shiftGanzhi({
            stem: '甲', branch: '子',
        }, -2))).toBe('壬戌');
    });

    it('rejects a stem and branch of different parity', () => {
        expect(() => ganzhiIndex({
            stem: '甲', branch: '丑',
        })).toThrow();
    });

    it.each([
        [1984, '甲子'],
        [1989, '己巳'],
        [2000, '庚辰'],
        [2024, '甲辰'],
        [1900, '庚子'],
    ])('year %i is %s', (year, label) => {
        expect(ganzhiLabel(yearGanzhi(year))).toBe(label);
    });
});

describe('elements and polarity', () => {
    it('maps every stem and branch to an element', () => {
        expect(STEMS.map(stemElement)).toEqual([
            'wood',
            'wood',
            'fire',
            'fire',
            'earth',
            'earth',
            'metal',
            'metal',
            'water',
            'water',
        ]);
        expect(BRANCHES.map(branchElement)).toEqual([
            'water',
            'earth',
            'wood',
            'wood',
            'earth',
            'fire',
            'fire',
            'earth',
            'metal',
            'metal',
            'earth',
            'water',
        ]);
    });

    it('alternates yang and yin', () => {
        expect(stemPolarity('甲')).toBe('YANG');
        expect(stemPolarity('癸')).toBe('YIN');
        expect(branchPolarity('子')).toBe('YANG');
        expect(branchPolarity('亥')).toBe('YIN');
    });
});
