import {
    describe, expect, it,
} from 'vitest';
import {
    ganzhiLabel, ganzhiFromIndex, ganzhiIndex,
} from './ganzhi';
import {
    calculatePillars, dayPillarOf, localDateOf, type BirthMoment,
} from './pillars';

const TAIPEI_OFFSET = 480;

/** A Taipei (UTC+8, no daylight saving) birth moment from its wall clock; a null time is placed at local noon. */
function taipei(birthDate: string, birthTime: string | null): BirthMoment {
    return {
        birthDate,
        birthTime,
        standardOffsetMinutes: TAIPEI_OFFSET,
        instant: new Date(`${birthDate}T${birthTime ?? '12:00'}:00+08:00`),
    };
}

describe('dayPillarOf', () => {
    it('counts the sexagenary cycle from the anchor day in both directions', () => {
        expect(ganzhiLabel(dayPillarOf('2000-01-01'))).toBe('戊午');
        expect(ganzhiLabel(dayPillarOf('2000-01-02'))).toBe('己未');
        expect(ganzhiLabel(dayPillarOf('1999-12-31'))).toBe('丁巳');
        expect(ganzhiLabel(dayPillarOf('1970-01-01'))).toBe('辛巳');
        expect(ganzhiLabel(dayPillarOf('1900-01-01'))).toBe('甲戌');
    });

    it('repeats every 60 days', () => {
        const a = ganzhiIndex(dayPillarOf('2024-03-01'));
        const b = ganzhiIndex(dayPillarOf('2024-04-30'));

        expect(a).toBe(b);
        expect(ganzhiFromIndex(a)).toEqual(dayPillarOf('2024-03-01'));
    });

    it('rejects dates that do not exist', () => {
        expect(() => dayPillarOf('2023-02-29')).toThrow();
        expect(() => dayPillarOf('2023-13-01')).toThrow();
        expect(() => dayPillarOf('not-a-date')).toThrow();
    });
});

describe('localDateOf', () => {
    it('shifts the instant by the offset before taking the date', () => {
        const instant = new Date('2024-02-04T16:00:00Z');

        expect(localDateOf(instant, 480)).toBe('2024-02-05');
        expect(localDateOf(instant, 0)).toBe('2024-02-04');
        expect(localDateOf(instant, -300)).toBe('2024-02-04');
    });
});

describe('reference chart 1989-10-27 06:00', () => {
    it('gives 己巳 / 甲戌 / 庚申 / 己卯 and no notices', () => {
        const pillars = calculatePillars(taipei('1989-10-27', '06:00'));

        expect([
            pillars.year,
            pillars.month,
            pillars.day,
            pillars.hour,
        ].map((p) => (p ? ganzhiLabel(p) : '-'))).toEqual([
            '己巳',
            '甲戌',
            '庚申',
            '己卯',
        ]);
        expect(pillars.baziYear).toBe(1989);
        expect(pillars.lateZi).toBe(false);
        expect(pillars.borderline).toEqual([]);
        expect(pillars.termDay).toBeNull();
    });
});

describe('late 子 hour', () => {
    it('keeps the day pillar and takes the hour stem from the next day', () => {
        const late = calculatePillars(taipei('2000-01-01', '23:30'));
        const early = calculatePillars(taipei('2000-01-01', '00:30'));

        expect(late.lateZi).toBe(true);
        expect(ganzhiLabel(late.day)).toBe('戊午');
        expect(ganzhiLabel(late.hour!)).toBe('甲子');
        expect(early.lateZi).toBe(false);
        expect(ganzhiLabel(early.day)).toBe('戊午');
        expect(ganzhiLabel(early.hour!)).toBe('壬子');
    });
});

describe('unknown birth time', () => {
    it('gives three pillars and no hour pillar or hour borderline', () => {
        const pillars = calculatePillars(taipei('1989-10-27', null));

        expect(pillars.hour).toBeNull();
        expect([
            pillars.year,
            pillars.month,
            pillars.day,
        ].map(ganzhiLabel)).toEqual([
            '己巳',
            '甲戌',
            '庚申',
        ]);
        expect(pillars.borderline).toEqual([]);
        expect(pillars.termDay).toBeNull();
    });

    it('warns when a 節 starts on the birth date', () => {
        // 驚蟄 2024 is 2024-03-05 10:22 Taipei time
        const pillars = calculatePillars(taipei('2024-03-05', null));

        expect(pillars.termDay).toEqual({
            term: '驚蟄', changesYear: false,
        });
    });

    it('says a 立春 date also changes the year', () => {
        expect(calculatePillars(taipei('2024-02-04', null)).termDay).toEqual({
            term: '立春', changesYear: true,
        });
    });

    it('does not warn on a 中氣 date (春分 does not change the month)', () => {
        // 春分 2024 is 2024-03-20 11:06 Taipei time
        expect(calculatePillars(taipei('2024-03-20', null)).termDay).toBeNull();
    });

    it('does not warn when the time is known, since the instant decides', () => {
        expect(calculatePillars(taipei('2024-03-05', '15:00')).termDay).toBeNull();
    });
});

describe('borderline notice', () => {
    it('flags a birth within 30 minutes of a 節', () => {
        // 驚蟄 2024: 10:22:28
        const before = calculatePillars(taipei('2024-03-05', '10:00'));
        const after = calculatePillars(taipei('2024-03-05', '10:40'));

        expect(before.borderline).toContainEqual({
            kind: 'JIE', term: '驚蟄', minutes: 22,
        });
        expect(after.borderline).toContainEqual({
            kind: 'JIE', term: '驚蟄', minutes: 18,
        });
    });

    it('flags a birth within 30 minutes of an hour boundary, including 23:00 and the 子 / 丑 line', () => {
        expect(calculatePillars(taipei('1989-10-27', '06:50')).borderline).toContainEqual({
            kind: 'HOUR', minutes: 10,
        });
        expect(calculatePillars(taipei('1989-10-27', '22:45')).borderline).toContainEqual({
            kind: 'HOUR', minutes: 15,
        });
        expect(calculatePillars(taipei('1989-10-27', '00:50')).borderline).toContainEqual({
            kind: 'HOUR', minutes: 10,
        });
    });

    it('treats exactly 30 minutes as borderline and 31 minutes as clear', () => {
        expect(calculatePillars(taipei('1989-10-27', '06:30')).borderline.some((n) => n.kind === 'HOUR')).toBe(true);
        expect(calculatePillars(taipei('1989-10-27', '06:29')).borderline.some((n) => n.kind === 'HOUR')).toBe(false);
    });

    it('shows nothing in the middle of an hour and far from any 節', () => {
        // 05:59 / 06:00 is 卯 hour's centre (05:00-07:00); 06:00 is 60 minutes from both lines
        expect(calculatePillars(taipei('1989-10-27', '06:00')).borderline).toEqual([]);
    });
});
