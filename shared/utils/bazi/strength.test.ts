import {
    describe, expect, it,
} from 'vitest';
import {
    ELEMENTS,
    HIDDEN_STEM_SHARES,
    HIDDEN_STEMS,
    PATTERN_KEYS,
    PATTERN_OF_TEN_GOD,
    STRENGTH_LEVELS,
    STRENGTH_WEIGHTS,
    TEN_GODS,
    TEN_GOD_GROUPS,
    USEFUL_GODS,
    BRANCHES,
} from '../../constants/bazi';
import { calculatePillars } from './pillars';
import {
    analyzeStrength, elementPhases, strengthLevelOf,
} from './strength';

function strengthAt(birthDate: string, birthTime: string | null) {
    return analyzeStrength(calculatePillars({
        birthDate,
        birthTime,
        standardOffsetMinutes: 480,
        instant: new Date(`${birthDate}T${birthTime ?? '12:00'}:00+08:00`),
    }));
}

describe('reference chart 1989-10-27 06:00 (己巳 甲戌 庚申 己卯)', () => {
    const result = strengthAt('1989-10-27', '06:00');

    it('scores about 68 and judges 身強', () => {
        expect(result.score).toBe(67.6);
        expect(result.level).toBe('strong');
        expect(result.side).toBe('STRONG');
    });

    it('shows where the score comes from', () => {
        const points = Object.fromEntries(result.parts.map((part) => [part.source, part.points]));

        expect(points).toEqual({
            yearStem: 8,
            monthStem: 0,
            hourStem: 12,
            yearBranch: 3.2,
            monthBranch: 36,
            dayBranch: 8.4,
            hourBranch: 0,
        });
    });

    it('gives the pattern 偏印格 in the 印 group', () => {
        expect(result.pattern).toEqual({
            key: '偏印', tenGod: '偏印', group: 'resource',
        });
    });

    it('uses 財, favours 食傷 and avoids 比劫', () => {
        expect(result.useful).toEqual({
            useful: 'wealth', favorable: 'output', avoid: ['peer'],
        });
    });

    it('gives 土旺 金相 火休 木囚 水死 for a 戌 month', () => {
        expect(result.phases).toEqual({
            earth: '旺', metal: '相', fire: '休', wood: '囚', water: '死',
        });
    });
});

describe('strength levels', () => {
    it.each([
        [100, 'taiwang'],
        [75, 'taiwang'],
        [74.9, 'strong'],
        [55, 'strong'],
        [54.9, 'balanced'],
        [45, 'balanced'],
        [44.9, 'weak'],
        [30, 'weak'],
        [29.9, 'taiwei'],
        [0, 'taiwei'],
    ])('score %f is %s', (score, level) => {
        expect(strengthLevelOf(score)).toBe(level);
    });
});

describe('element phases', () => {
    it('gives each element a different phase for every month element', () => {
        for (const month of ELEMENTS) {
            const phases = elementPhases(month);

            expect(new Set(Object.values(phases)).size).toBe(5);
            expect(phases[month]).toBe('旺');
        }
    });

    it('gives 木 month: 木旺 火相 水休 金囚 土死', () => {
        expect(elementPhases('wood')).toEqual({
            wood: '旺', fire: '相', water: '休', metal: '囚', earth: '死',
        });
    });
});

describe('balanced charts', () => {
    it('list no useful gods', () => {
        // Walk forward from a fixed date until a balanced chart turns up, so the test stays deterministic
        let found = null;

        for (let day = 0; day < 4000 && !found; day++) {
            const date = new Date(Date.UTC(2000, 0, 1) + day * 86400000).toISOString().slice(0, 10);
            const result = strengthAt(date, '10:00');

            if (result.level === 'balanced') found = result;
        }

        expect(found).not.toBeNull();
        expect(found!.side).toBe('BALANCED');
        expect(found!.useful).toBeNull();
        expect(found!.score).toBeGreaterThanOrEqual(45);
        expect(found!.score).toBeLessThan(55);
    });
});

describe('unknown birth time', () => {
    it('scales the score to the characters that are known and stays within 0 to 100', () => {
        const result = strengthAt('1989-10-27', null);

        expect(result.parts).toHaveLength(5);
        expect(result.parts.reduce((total, part) => total + part.weight, 0)).toBe(80);
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
        // 8 + 0 + 3.2 + 36 + 8.4 = 55.6 of 80 -> 69.5
        expect(result.score).toBe(69.5);
    });
});

describe('table completeness', () => {
    it('has weights adding to 100', () => {
        expect(Object.values(STRENGTH_WEIGHTS).reduce((total, weight) => total + weight, 0)).toBe(100);
    });

    it('has hidden-stem shares adding to ten for every branch', () => {
        for (const branch of BRANCHES) {
            const shares = HIDDEN_STEM_SHARES[HIDDEN_STEMS[branch].length as 1 | 2 | 3];

            expect(shares).toHaveLength(HIDDEN_STEMS[branch].length);
            expect(shares.reduce((total, share) => total + share, 0)).toBe(10);
        }
    });

    it('has five levels and ten patterns, one pattern per ten god', () => {
        expect(STRENGTH_LEVELS).toHaveLength(5);
        expect(PATTERN_KEYS).toHaveLength(10);
        expect(TEN_GODS.map((god) => PATTERN_OF_TEN_GOD[god]).sort()).toEqual([...PATTERN_KEYS].sort());
    });

    it('has a useful-gods row for each side and group (ten rows), with no group both liked and avoided', () => {
        for (const side of ['strong', 'weak'] as const) {
            for (const group of TEN_GOD_GROUPS) {
                const row = USEFUL_GODS[side][group];

                expect(row).toBeDefined();
                expect(row.avoid.length).toBeGreaterThan(0);
                expect(row.avoid).not.toContain(row.useful);
                expect(row.avoid).not.toContain(row.favorable);
                expect(new Set(row.avoid).size).toBe(row.avoid.length);
            }
        }
    });
});
