import {
    describe, expect, it,
} from 'vitest';
import {
    BRANCHES,
    BRANCH_CLASHES,
    BRANCH_COMBINES,
    BRANCH_ZODIAC,
    LIFE_STAGES,
    LIFE_STAGE_START,
    NAYIN_ELEMENT_OF_CHAR,
    NAYIN_NAMES,
    SEASON_OF_BRANCH,
    STEMS,
    STEM_COMBINES,
} from '../../constants/bazi';
import {
    computeFacts,
    lifeStageOf,
    mingGongOf,
    nayinOf,
    taiYuanOf,
    voidBranchesOf,
} from './facts';
import {
    branchIndex, ganzhiFromIndex, ganzhiLabel,
} from './ganzhi';
import { calculatePillars } from './pillars';

function factsOf(birthDate: string, birthTime: string | null) {
    const instant = new Date(`${birthDate}T${birthTime ?? '12:00'}:00+08:00`);
    const pillars = calculatePillars({
        birthDate,
        birthTime,
        standardOffsetMinutes: 480,
        instant,
    });

    return computeFacts(pillars, instant);
}

describe('reference chart 1989-10-27 06:00 (己巳 甲戌 庚申 己卯)', () => {
    const facts = factsOf('1989-10-27', '06:00');

    it('gives the 地勢 of the day master in each branch', () => {
        expect(facts.stages.map((item) => item.stage)).toEqual([
            '長生',
            '衰',
            '臨官',
            '胎',
        ]);
    });

    it('gives the 自坐 of each pillar stem in its own branch', () => {
        expect(facts.ownStages.map((item) => item.stage)).toEqual([
            '帝旺',
            '養',
            '臨官',
            '病',
        ]);
    });

    it('gives each pillar its own 旬空 and finds none of the other branches in the day pillar\'s', () => {
        expect(facts.voids.map((item) => item.branches.join(''))).toEqual([
            '戌亥',
            '申酉',
            '子丑',
            '申酉',
        ]);
        expect(facts.dayVoid).toEqual({
            branches: ['子', '丑'], positions: [],
        });
    });

    it('gives the 納音 of the four pillars', () => {
        expect(facts.nayin.map((item) => item.name)).toEqual([
            '大林木',
            '山頭火',
            '石榴木',
            '城頭土',
        ]);
        expect(facts.nayin.map((item) => item.element)).toEqual([
            'wood',
            'fire',
            'wood',
            'earth',
        ]);
    });

    it('gives 命宮 戊辰 and 胎元 乙丑', () => {
        expect(ganzhiLabel(facts.mingGong!)).toBe('戊辰');
        expect(ganzhiLabel(facts.taiYuan)).toBe('乙丑');
    });

    it('gives the zodiac, yin year, term and season at birth', () => {
        expect(facts.zodiac).toBe('蛇');
        expect(facts.yearPolarity).toBe('YIN');
        expect(facts.solarTerm).toBe('霜降');
        expect(facts.season).toBe('秋');
    });

    it('lists the combinations and no clash', () => {
        expect(facts.relations).toEqual([
            {
                kind: 'STEM_COMBINE', pair: '甲己', positions: ['year', 'month'],
            },
            {
                kind: 'BRANCH_COMBINE', pair: '巳申', positions: ['year', 'day'],
            },
            {
                kind: 'STEM_COMBINE', pair: '甲己', positions: ['month', 'hour'],
            },
            {
                kind: 'BRANCH_COMBINE', pair: '卯戌', positions: ['month', 'hour'],
            },
        ]);
    });
});

describe('without a birth time', () => {
    it('has no 命宮 and no hour entries, but still has 胎元', () => {
        const facts = factsOf('1989-10-27', null);

        expect(facts.mingGong).toBeNull();
        expect(ganzhiLabel(facts.taiYuan)).toBe('乙丑');
        expect(facts.stages).toHaveLength(3);
        expect(facts.nayin).toHaveLength(3);
    });
});

describe('a clash and the day-void rule', () => {
    it('lists a 六合 between two pillars', () => {
        // 2024-02-29 08:30 is 甲辰 丙寅 癸亥 丙辰: 寅 and 亥 combine, and no branches clash
        const facts = factsOf('2024-02-29', '08:30');

        expect(facts.relations.some((item) => item.kind === 'BRANCH_COMBINE' && item.pair === '寅亥')).toBe(true);
        expect(facts.relations.some((item) => item.kind === 'BRANCH_CLASH')).toBe(false);
    });

    it('lists a 六沖 between two pillars', () => {
        // 2000-01-01 12:00 is 己卯 丙子 戊午 戊午: the 子 month clashes with both 午
        const clashes = factsOf('2000-01-01', '12:00').relations.filter((item) => item.kind === 'BRANCH_CLASH');

        expect(clashes).toEqual([
            {
                kind: 'BRANCH_CLASH', pair: '子午', positions: ['month', 'day'],
            }, {
                kind: 'BRANCH_CLASH', pair: '子午', positions: ['month', 'hour'],
            },
        ]);
    });

    it('marks the pillars whose branch is in the day pillar\'s void', () => {
        // 2000-01-01 12:00 is 己卯 丙子 戊午 戊午; 戊午 sits in the 甲寅 span whose void is 子丑
        const facts = factsOf('2000-01-01', '12:00');

        expect(facts.dayVoid.branches).toEqual(['子', '丑']);
        expect(facts.dayVoid.positions).toEqual(['month']);
    });
});

describe('table completeness', () => {
    it('gives every stem twelve distinct life stages around the twelve branches', () => {
        expect(Object.keys(LIFE_STAGE_START)).toHaveLength(10);

        for (const stem of STEMS) {
            const stages = BRANCHES.map((branch) => lifeStageOf(stem, branch));

            expect(new Set(stages).size).toBe(12);
            expect(lifeStageOf(stem, LIFE_STAGE_START[stem])).toBe('長生');
        }
    });

    it('runs yang stems forward and yin stems backward', () => {
        expect(LIFE_STAGES.map((_, i) => lifeStageOf('庚', BRANCHES[(branchIndex('巳') + i) % 12]!))).toEqual([...LIFE_STAGES]);
        expect(LIFE_STAGES.map((_, i) => lifeStageOf('乙', BRANCHES[(branchIndex('午') - i + 12) % 12]!))).toEqual([...LIFE_STAGES]);
        // 乙 reaches 臨官 at 卯 and 帝旺 at 寅
        expect(lifeStageOf('乙', '卯')).toBe('臨官');
        expect(lifeStageOf('乙', '寅')).toBe('帝旺');
    });

    it('has thirty distinct 納音 whose last character is an element', () => {
        expect(NAYIN_NAMES).toHaveLength(30);
        expect(new Set(NAYIN_NAMES).size).toBe(30);

        for (const name of NAYIN_NAMES) {
            expect(NAYIN_ELEMENT_OF_CHAR[name.slice(-1)]).toBeDefined();
        }

        expect(nayinOf(ganzhiFromIndex(0)).name).toBe('海中金');
        expect(nayinOf(ganzhiFromIndex(1)).name).toBe('海中金');
        expect(nayinOf(ganzhiFromIndex(59)).name).toBe('大海水');
    });

    it('leaves exactly two branches empty in every ten-day span', () => {
        for (let span = 0; span < 6; span++) {
            const used = new Set<string>();

            for (let i = 0; i < 10; i++) {
                used.add(ganzhiFromIndex(span * 10 + i).branch);
            }

            const [first, second] = voidBranchesOf(ganzhiFromIndex(span * 10));

            expect(used.size).toBe(10);
            expect(used.has(first)).toBe(false);
            expect(used.has(second)).toBe(false);

            for (let i = 0; i < 10; i++) {
                expect(voidBranchesOf(ganzhiFromIndex(span * 10 + i))).toEqual([first, second]);
            }
        }
    });

    it('uses each stem once in the combine table, each branch once in the combine and the clash tables', () => {
        expect(STEM_COMBINES.flat().sort()).toEqual([...STEMS].sort());
        expect(BRANCH_COMBINES.flat().sort()).toEqual([...BRANCHES].sort());
        expect(BRANCH_CLASHES.flat().sort()).toEqual([...BRANCHES].sort());

        for (const [a, b] of BRANCH_CLASHES) {
            expect(Math.abs(branchIndex(a) - branchIndex(b))).toBe(6);
        }
    });

    it('has a zodiac animal and a season for every branch, three branches per season', () => {
        expect(Object.keys(BRANCH_ZODIAC)).toHaveLength(12);
        expect(new Set(Object.values(BRANCH_ZODIAC)).size).toBe(12);

        const bySeason = new Map<string, number>();

        for (const season of Object.values(SEASON_OF_BRANCH)) {
            bySeason.set(season, (bySeason.get(season) ?? 0) + 1);
        }

        expect([...bySeason.values()]).toEqual([
            3,
            3,
            3,
            3,
        ]);
    });
});

describe('formulas', () => {
    it('derives 胎元 from the month pillar', () => {
        expect(ganzhiLabel(taiYuanOf({
            stem: '甲', branch: '戌',
        }))).toBe('乙丑');
        expect(ganzhiLabel(taiYuanOf({
            stem: '癸', branch: '丑',
        }))).toBe('甲辰');
    });

    it('derives 命宮 from the year stem, month branch and hour branch', () => {
        expect(ganzhiLabel(mingGongOf('己', '戌', '卯'))).toBe('戊辰');
        // 寅 month and 寅 hour: 1 + 1 = 2, so position 12 = 丑
        expect(mingGongOf('甲', '寅', '寅').branch).toBe('丑');
        // 丑 month (12) and 丑 hour (12): 24, so 26 - 24 = position 2 = 卯
        expect(mingGongOf('甲', '丑', '丑').branch).toBe('卯');
    });
});
