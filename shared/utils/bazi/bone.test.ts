import { Solar } from 'lunar-typescript';
import {
    describe, expect, it,
} from 'vitest';
import {
    BONE_DAY_QIAN,
    BONE_HOUR_QIAN,
    BONE_MAX_QIAN,
    BONE_MIN_QIAN,
    BONE_MONTH_QIAN,
    BONE_YEAR_QIAN,
    BRANCHES,
} from '../../constants/bazi';
import { calculateBoneWeight } from './bone';
import { ganzhiLabel } from './ganzhi';

describe('reference chart', () => {
    it('weighs 4 兩 1 錢 for 1989-10-27 卯 hour (lunar 己巳年九月廿八)', () => {
        const bone = calculateBoneWeight('1989-10-27', '卯');

        expect(ganzhiLabel(bone.lunarYear)).toBe('己巳');
        expect(bone.lunarMonth).toBe(9);
        expect(bone.lunarDay).toBe(28);
        expect(bone.leapMonth).toBe(false);
        expect(bone.parts).toEqual({
            year: 5, month: 18, day: 8, hour: 10,
        });
        expect(bone.totalQian).toBe(41);
        expect(bone.label).toBe('4 兩 1 錢');
        expect(bone.contentKey).toBe('bone_41');
    });

    it('writes a whole 兩 without 錢', () => {
        let whole = null;

        for (let day = 0; day < 400 && !whole; day++) {
            const date = new Date(Date.UTC(2000, 0, 1) + day * 86400000).toISOString().slice(0, 10);
            const bone = calculateBoneWeight(date, '子');

            if (bone.qian === 0) whole = bone;
        }

        expect(whole).not.toBeNull();
        expect(whole!.label).toBe(`${whole!.liang} 兩`);
        expect(whole!.contentKey).toBe(`bone_${whole!.liang * 10}`);
    });
});

describe('leap months', () => {
    it('counts a leap month as that month and says so', () => {
        // 2023-04-01 is 閏二月十一 of 癸卯年
        const bone = calculateBoneWeight('2023-04-01', '午');

        expect(bone.leapMonth).toBe(true);
        expect(bone.lunarMonth).toBe(2);
        expect(bone.lunarDay).toBe(11);
        expect(bone.parts.month).toBe(BONE_MONTH_QIAN[1]);
    });

    it('does not mark the month just before the leap month', () => {
        const bone = calculateBoneWeight('2023-03-21', '午');

        expect(bone.leapMonth).toBe(false);
        expect(bone.lunarMonth).toBe(2);
        expect(bone.lunarDay).toBe(30);
    });

    it('handles a leap month in another year (2020 閏四月)', () => {
        const bone = calculateBoneWeight('2020-05-23', '子');

        expect(bone.leapMonth).toBe(true);
        expect(bone.lunarMonth).toBe(4);
        expect(bone.lunarDay).toBe(1);
    });
});

describe('year changes at the lunar new year, not at 立春', () => {
    it('keeps the previous lunar year between 立春 (Feb 4) and the new year (Feb 10, 2024)', () => {
        // 立春 2024 is Feb 4, so the BaZi year is already 甲辰; 稱骨 still uses 癸卯 until 春節
        const before = calculateBoneWeight('2024-02-08', '午');
        const after = calculateBoneWeight('2024-02-10', '午');

        expect(ganzhiLabel(before.lunarYear)).toBe('癸卯');
        expect(before.lunarMonth).toBe(12);
        expect(before.lunarDay).toBe(29);
        expect(before.totalQian).toBe(12 + 5 + 16 + 10);
        expect(ganzhiLabel(after.lunarYear)).toBe('甲辰');
        expect(after.lunarMonth).toBe(1);
        expect(after.lunarDay).toBe(1);
    });

    it('uses the new lunar year even before 立春 when the new year came first (2023-01-22)', () => {
        // 春節 2023 is Jan 22 and 立春 is Feb 4: 稱骨 is already 癸卯 while the BaZi year is still 壬寅
        expect(ganzhiLabel(calculateBoneWeight('2023-01-22', '午').lunarYear)).toBe('癸卯');
    });
});

describe('weight tables', () => {
    it('has the expected number of entries', () => {
        expect(BONE_YEAR_QIAN).toHaveLength(60);
        expect(BONE_MONTH_QIAN).toHaveLength(12);
        expect(BONE_DAY_QIAN).toHaveLength(30);
        expect(BONE_HOUR_QIAN).toHaveLength(12);
        expect(BRANCHES).toHaveLength(12);
    });

    it('has positive weights below 2 兩', () => {
        for (const table of [
            BONE_YEAR_QIAN,
            BONE_MONTH_QIAN,
            BONE_DAY_QIAN,
            BONE_HOUR_QIAN,
        ]) {
            for (const weight of table) {
                expect(weight).toBeGreaterThanOrEqual(5);
                expect(weight).toBeLessThanOrEqual(19);
            }
        }
    });

    it('gives a total from 2 兩 1 錢 to 7 兩 1 錢, with all 51 values possible', () => {
        const sums = new Set<number>();

        for (const year of BONE_YEAR_QIAN) {
            for (const month of BONE_MONTH_QIAN) {
                for (const day of BONE_DAY_QIAN) {
                    for (const hour of BONE_HOUR_QIAN) sums.add(year + month + day + hour);
                }
            }
        }

        expect(Math.min(...sums)).toBe(BONE_MIN_QIAN);
        expect(Math.max(...sums)).toBe(BONE_MAX_QIAN);
        expect(sums.size).toBe(51);
        expect(BONE_MAX_QIAN - BONE_MIN_QIAN + 1).toBe(51);

        for (let total = BONE_MIN_QIAN; total <= BONE_MAX_QIAN; total++) {
            expect(sums.has(total)).toBe(true);
        }
    });
});

describe('lunar-typescript output is pinned', () => {
    // These conversions are the library's published behaviour that 稱骨 relies on; an upgrade that changes one must be reviewed
    it.each([
        [
            '1989-10-27',
            '己巳',
            9,
            28,
        ],
        [
            '2023-04-01',
            '癸卯',
            -2,
            11,
        ],
        [
            '2020-05-23',
            '庚子',
            -4,
            1,
        ],
        [
            '2025-07-25',
            '乙巳',
            -6,
            1,
        ],
        [
            '2024-02-10',
            '甲辰',
            1,
            1,
        ],
        [
            '2023-01-22',
            '癸卯',
            1,
            1,
        ],
        [
            '2000-01-01',
            '己卯',
            11,
            25,
        ],
    ])('%s is %s, month %i, day %i', (date, year, month, day) => {
        const [
            y,
            m,
            d,
        ] = date.split('-').map(Number) as [number, number, number];
        const lunar = Solar.fromYmd(y, m, d).getLunar();

        expect(lunar.getYearInGanZhi()).toBe(year);
        expect(lunar.getMonth()).toBe(month);
        expect(lunar.getDay()).toBe(day);
    });
});
