import {
    describe, expect, it,
} from 'vitest';
import { DAY_MS } from '../time';
import { ganzhiLabel } from './ganzhi';
import {
    calculateFlowYears,
    calculateLuckCycle,
    currentBaziYear,
    flowYearsOfStep,
    luckDirection,
    startAgeOf,
} from './luck';
import { calculatePillars } from './pillars';

const TAIPEI_OFFSET = 480;
/** The reference chart: 1989-10-27 06:00 Taipei, 己巳 甲戌 庚申 己卯. */
const REFERENCE = {
    date: '1989-10-27', time: '06:00',
};

function pillarsAt(date: string, time: string | null) {
    const instant = new Date(`${date}T${time ?? '12:00'}:00+08:00`);

    return {
        instant,
        pillars: calculatePillars({
            birthDate: date,
            birthTime: time,
            standardOffsetMinutes: TAIPEI_OFFSET,
            instant,
        }),
    };
}

/** An instant of Taipei local time. */
const taipei = (isoLocal: string) => new Date(`${isoLocal}+08:00`);

describe('luckDirection', () => {
    it('runs forward for yang-year men and yin-year women, backward for the others', () => {
        expect(luckDirection('甲', 'MALE')).toBe('FORWARD');
        expect(luckDirection('甲', 'FEMALE')).toBe('BACKWARD');
        expect(luckDirection('己', 'MALE')).toBe('BACKWARD');
        expect(luckDirection('己', 'FEMALE')).toBe('FORWARD');
    });
});

describe('startAgeOf', () => {
    it('counts three days as one year', () => {
        expect(startAgeOf(3 * DAY_MS).age).toEqual({
            years: 1, months: 0, days: 0,
        });
        expect(startAgeOf(6 * DAY_MS).age).toEqual({
            years: 2, months: 0, days: 0,
        });
    });

    it('counts one day as four months and two hours as ten days', () => {
        expect(startAgeOf(DAY_MS).age).toEqual({
            years: 0, months: 4, days: 0,
        });
        expect(startAgeOf(2 * 60 * 60 * 1000).age).toEqual({
            years: 0, months: 0, days: 10,
        });
    });

    it('stays just under the boundary one millisecond before three days', () => {
        const { age } = startAgeOf(3 * DAY_MS - 1);

        expect(age.years).toBe(0);
        expect(age.months).toBe(11);
        expect(age.days).toBe(29);
    });

    it('carries months over into years across a calendar year', () => {
        // 10 days = 3 years and 4 months
        expect(startAgeOf(10 * DAY_MS).age).toEqual({
            years: 3, months: 4, days: 0,
        });
    });
});

describe('luck cycle of the reference chart (1989-10-27 06:00, male)', () => {
    const {
        instant, pillars,
    } = pillarsAt(REFERENCE.date, REFERENCE.time);
    const now = taipei('2026-10-27T12:00:00');
    const cycle = calculateLuckCycle(pillars, instant, 'MALE', now)!;

    it('runs backward from the previous 節 for a yin-year man', () => {
        expect(cycle.direction).toBe('BACKWARD');
        expect(cycle.measuredToTerm).toBe('寒露');
    });

    it('starts at 6 years 2 months 12 days, around 1996-01-08 23:22', () => {
        expect(cycle.startAge).toEqual({
            years: 6, months: 2, days: 12,
        });
        // The reference site shows about 23:22; allow a few minutes for the second-level term time
        const expected = taipei('1996-01-08T23:22:00').getTime();

        expect(Math.abs(cycle.startsAt.getTime() - expected)).toBeLessThan(5 * 60 * 1000);
    });

    it('lists eight steps from 癸酉, going backward from the month pillar 甲戌', () => {
        expect(cycle.steps.map((step) => ganzhiLabel(step.pillar))).toEqual([
            '癸酉',
            '壬申',
            '辛未',
            '庚午',
            '己巳',
            '戊辰',
            '丁卯',
            '丙寅',
        ]);
    });

    it('gives the ages, years and ten gods of each step against the 庚 day master', () => {
        const [first, second] = cycle.steps;

        expect(first).toMatchObject({
            order: 1, startAge: 7, endAge: 16, startYear: 1996, endYear: 2005, tenGod: '傷官',
        });
        expect(second).toMatchObject({
            order: 2, startAge: 17, endAge: 26, startYear: 2006, endYear: 2015, tenGod: '食神',
        });
    });

    it('marks the step in force today (2026: 37 years old, the fourth step 庚午)', () => {
        expect(cycle.currentOrder).toBe(4);
        expect(ganzhiLabel(cycle.steps[3]!.pillar)).toBe('庚午');
    });

    it('has no current step before the first one starts', () => {
        const early = calculateLuckCycle(pillars, instant, 'MALE', taipei('1992-01-01T00:00:00'))!;

        expect(early.currentOrder).toBeNull();
    });

    it('switches step exactly at the start instant', () => {
        const second = cycle.steps[1]!;
        const justBefore = calculateLuckCycle(pillars, instant, 'MALE', new Date(second.startsAt.getTime() - 1))!;
        const atStart = calculateLuckCycle(pillars, instant, 'MALE', second.startsAt)!;

        expect(justBefore.currentOrder).toBe(1);
        expect(atStart.currentOrder).toBe(2);
    });
});

describe('the four direction cases', () => {
    // 1984-06-15 12:00 is 甲子 庚午 (yang year, month 午 after 芒種 and before 小暑); 1989 is 己巳 (yin year)
    const yang = pillarsAt('1984-06-15', '12:00');
    const yin = pillarsAt('1989-10-27', '06:00');
    const now = taipei('2026-10-27T12:00:00');

    it('yang man: forward from the month pillar, measured to the next 節', () => {
        const cycle = calculateLuckCycle(yang.pillars, yang.instant, 'MALE', now)!;

        expect(cycle.direction).toBe('FORWARD');
        expect(cycle.measuredToTerm).toBe(yang.pillars.jie.next.name);
        expect(cycle.measuredToTerm).toBe('小暑');
        expect(ganzhiLabel(cycle.steps[0]!.pillar)).toBe('辛未');
    });

    it('yang woman: backward from the month pillar, measured to the previous 節', () => {
        const cycle = calculateLuckCycle(yang.pillars, yang.instant, 'FEMALE', now)!;

        expect(cycle.direction).toBe('BACKWARD');
        expect(cycle.measuredToTerm).toBe(yang.pillars.jie.current.name);
        expect(cycle.measuredToTerm).toBe('芒種');
        expect(ganzhiLabel(cycle.steps[0]!.pillar)).toBe('己巳');
    });

    it('yin man: backward', () => {
        expect(calculateLuckCycle(yin.pillars, yin.instant, 'MALE', now)!.direction).toBe('BACKWARD');
    });

    it('yin woman: forward from the month pillar 甲戌 to 乙亥', () => {
        const cycle = calculateLuckCycle(yin.pillars, yin.instant, 'FEMALE', now)!;

        expect(cycle.direction).toBe('FORWARD');
        expect(cycle.measuredToTerm).toBe('立冬');
        expect(ganzhiLabel(cycle.steps[0]!.pillar)).toBe('乙亥');
    });
});

describe('no output without what it needs', () => {
    it('gives no luck cycle when the birth time is unknown', () => {
        const {
            instant, pillars, 
        } = pillarsAt(REFERENCE.date, null);

        expect(calculateLuckCycle(pillars, instant, 'MALE', taipei('2026-10-27T12:00:00'))).toBeNull();
    });
});

describe('flow years', () => {
    it('changes year at 立春, not on January 1', () => {
        // 立春 2024 is 2024-02-04 16:26 Taipei
        expect(currentBaziYear(taipei('2024-01-15T12:00:00'))).toBe(2023);
        expect(currentBaziYear(taipei('2024-02-04T16:00:00'))).toBe(2023);
        expect(currentBaziYear(taipei('2024-02-04T17:00:00'))).toBe(2024);
        expect(currentBaziYear(taipei('2024-12-31T12:00:00'))).toBe(2024);
    });

    it('lists this year and the next four with their ten gods against the day stem', () => {
        const years = calculateFlowYears('庚', taipei('2026-10-27T12:00:00'));

        expect(years.map((item) => item.year)).toEqual([
            2026,
            2027,
            2028,
            2029,
            2030,
        ]);
        expect(years.map((item) => ganzhiLabel(item.pillar))).toEqual([
            '丙午',
            '丁未',
            '戊申',
            '己酉',
            '庚戌',
        ]);
        expect(years.map((item) => item.tenGod)).toEqual([
            '七殺',
            '正官',
            '偏印',
            '正印',
            '比肩',
        ]);
    });

    it('uses the previous year before 立春', () => {
        const years = calculateFlowYears('庚', taipei('2026-01-20T12:00:00'));

        expect(years[0]?.year).toBe(2025);
        expect(ganzhiLabel(years[0]!.pillar)).toBe('乙巳');
    });

    it('expands a step into its ten years', () => {
        const {
            instant, pillars, 
        } = pillarsAt(REFERENCE.date, REFERENCE.time);
        const cycle = calculateLuckCycle(pillars, instant, 'MALE', taipei('2026-10-27T12:00:00'))!;
        const years = flowYearsOfStep(cycle.steps[0]!, '庚');

        expect(years).toHaveLength(10);
        expect(years[0]?.year).toBe(1996);
        expect(years[9]?.year).toBe(2005);
        expect(ganzhiLabel(years[0]!.pillar)).toBe('丙子');
        expect(years[0]?.tenGod).toBe('七殺');
    });
});
