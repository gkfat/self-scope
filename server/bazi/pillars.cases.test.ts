import {
    describe, expect, it,
} from 'vitest';
import { ganzhiLabel } from '../../shared/utils/bazi/ganzhi';
import { calculatePillars } from '../../shared/utils/bazi/pillars';
import { buildBirthMoment } from './birthMoment';

/**
 * Known charts: birthplace wall-clock time -> year / month / day / hour pillars.
 *
 * Source: the 1989-10-27 06:00 reference chart was checked by the user on suanming.com.tw. The other cases are
 * cross-checked against lunar-typescript 1.8.6 (an independent implementation with its own solar-term tables),
 * fed with the standard-time clock worked out by hand per case (Beijing-time clock for the year and month pillars,
 * the birthplace's standard clock for the day and hour pillars). 1900-01-01 = 甲戌, 1970-01-01 = 辛巳 and
 * 2000-01-01 = 戊午 days match the published calendars.
 * Still to do (design.md open question): confirmation of the cases by someone fluent in BaZi.
 */
const CASES: ReadonlyArray<readonly [string, string, string, string, string]> = [
    [
        'Asia/Taipei',
        '1989-10-27',
        '06:00',
        '己巳 甲戌 庚申 己卯',
        'reference',
    ],
    [
        'Asia/Taipei',
        '2024-02-04',
        '16:26',
        '癸卯 乙丑 戊戌 庚申',
        'lichun-before',
    ],
    [
        'Asia/Taipei',
        '2024-02-04',
        '16:28',
        '甲辰 丙寅 戊戌 庚申',
        'lichun-after',
    ],
    [
        'Asia/Taipei',
        '2021-02-03',
        '22:58',
        '庚子 己丑 壬午 辛亥',
        'lichun-before-feb3',
    ],
    [
        'Asia/Taipei',
        '2021-02-03',
        '23:00',
        '辛丑 庚寅 壬午 壬子',
        'lichun-after-late-zi',
    ],
    [
        'Asia/Taipei',
        '2000-02-04',
        '20:39',
        '己卯 丁丑 壬辰 庚戌',
        'lichun-before',
    ],
    [
        'Asia/Taipei',
        '2000-02-04',
        '20:41',
        '庚辰 戊寅 壬辰 庚戌',
        'lichun-after',
    ],
    [
        'Asia/Taipei',
        '1989-02-04',
        '04:26',
        '戊辰 乙丑 乙未 戊寅',
        'lichun-before',
    ],
    [
        'Asia/Taipei',
        '1989-02-04',
        '04:28',
        '己巳 丙寅 乙未 戊寅',
        'lichun-after',
    ],
    [
        'Asia/Taipei',
        '2024-03-05',
        '10:21',
        '甲辰 丙寅 戊辰 丁巳',
        'jingzhe-before',
    ],
    [
        'Asia/Taipei',
        '2024-03-05',
        '10:24',
        '甲辰 丁卯 戊辰 丁巳',
        'jingzhe-after',
    ],
    [
        'Asia/Taipei',
        '2024-04-04',
        '15:01',
        '甲辰 丁卯 戊戌 庚申',
        'qingming-before',
    ],
    [
        'Asia/Taipei',
        '2024-04-04',
        '15:03',
        '甲辰 戊辰 戊戌 庚申',
        'qingming-after',
    ],
    [
        'Asia/Taipei',
        '2023-12-07',
        '12:00',
        '癸卯 癸亥 己亥 庚午',
        'daxue-before',
    ],
    [
        'Asia/Taipei',
        '2023-12-07',
        '18:00',
        '癸卯 甲子 己亥 癸酉',
        'daxue-after',
    ],
    [
        'Asia/Taipei',
        '2024-01-06',
        '04:00',
        '癸卯 甲子 己巳 丙寅',
        'xiaohan-before',
    ],
    [
        'Asia/Taipei',
        '2024-01-06',
        '05:00',
        '癸卯 乙丑 己巳 丁卯',
        'xiaohan-after',
    ],
    [
        'Asia/Taipei',
        '2000-01-01',
        '23:30',
        '己卯 丙子 戊午 甲子',
        'late-zi',
    ],
    [
        'Asia/Taipei',
        '2000-01-01',
        '00:30',
        '己卯 丙子 戊午 壬子',
        'early-zi',
    ],
    [
        'Asia/Taipei',
        '1999-12-31',
        '23:59',
        '己卯 丙子 丁巳 壬子',
        'late-zi-last-minute',
    ],
    [
        'Asia/Taipei',
        '2000-01-01',
        '00:00',
        '己卯 丙子 戊午 壬子',
        'midnight',
    ],
    [
        'Asia/Taipei',
        '2000-01-01',
        '12:00',
        '己卯 丙子 戊午 戊午',
        'noon',
    ],
    [
        'Asia/Taipei',
        '2024-02-29',
        '08:30',
        '甲辰 丙寅 癸亥 丙辰',
        'leap-day',
    ],
    [
        'Asia/Taipei',
        '2000-02-29',
        '13:00',
        '庚辰 戊寅 丁巳 丁未',
        'leap-day-2000',
    ],
    [
        'Asia/Taipei',
        '1996-02-29',
        '03:15',
        '丙子 庚寅 丙申 庚寅',
        'leap-day-1996',
    ],
    [
        'Asia/Taipei',
        '1900-01-01',
        '12:00',
        '己亥 丙子 甲戌 庚午',
        '1900',
    ],
    [
        'Asia/Taipei',
        '1975-07-01',
        '12:00',
        '乙卯 壬午 戊申 戊午',
        'dst-1975',
    ],
    [
        'Asia/Taipei',
        '1975-12-01',
        '12:00',
        '乙卯 丁亥 辛巳 甲午',
        'no-dst-1975',
    ],
    [
        'Asia/Taipei',
        '1946-06-15',
        '08:00',
        '丙戌 甲午 庚申 庚辰',
        'dst-1946',
    ],
    [
        'Asia/Taipei',
        '1979-07-15',
        '09:30',
        '己未 辛未 癸未 丙辰',
        'dst-1979',
    ],
    [
        'Asia/Taipei',
        '1974-07-01',
        '06:00',
        '甲寅 庚午 癸卯 乙卯',
        'dst-1974',
    ],
    [
        'Asia/Taipei',
        '1975-07-01',
        '00:30',
        '乙卯 壬午 丁未 壬子',
        'dst-rolls-back-a-day',
    ],
    [
        'Asia/Shanghai',
        '1988-07-01',
        '12:00',
        '戊辰 戊午 丁巳 丙午',
        'china-dst-1988',
    ],
    [
        'Asia/Tokyo',
        '2020-01-01',
        '00:30',
        '己亥 丙子 癸卯 壬子',
        'tokyo-new-year',
    ],
    [
        'America/New_York',
        '2020-07-01',
        '09:00',
        '庚子 壬午 乙巳 庚辰',
        'new-york-edt',
    ],
    [
        'Europe/London',
        '1996-07-01',
        '12:00',
        '丙子 甲午 己亥 庚午',
        'london-bst',
    ],
    [
        'Asia/Taipei',
        '2024-06-21',
        '03:45',
        '甲辰 庚午 丙辰 庚寅',
        'misc',
    ],
    [
        'Asia/Taipei',
        '1970-01-01',
        '00:00',
        '己酉 丙子 辛巳 戊子',
        'epoch',
    ],
    [
        'Asia/Taipei',
        '2050-05-05',
        '11:11',
        '庚午 庚辰 乙酉 壬午',
        'future',
    ],
];

describe('four pillars of known charts', () => {
    it('covers at least 30 charts', () => {
        expect(CASES.length).toBeGreaterThanOrEqual(30);
    });

    it.each(CASES)('%s %s %s -> %s (%s)', (timeZone, birthDate, birthTime, expected) => {
        const moment = buildBirthMoment({
            birthDate, birthTime, timeZone,
        });
        const pillars = calculatePillars(moment);
        const actual = [
            pillars.year,
            pillars.month,
            pillars.day,
            pillars.hour,
        ].map((pillar) => (pillar ? ganzhiLabel(pillar) : '-')).join(' ');

        expect(actual).toBe(expected);
    });
});

describe('buildBirthMoment', () => {
    it('uses Asia/Taipei when the place is unknown', () => {
        const moment = buildBirthMoment({
            birthDate: '1995-03-25', birthTime: '14:30',
        });

        expect(moment.instant.toISOString()).toBe('1995-03-25T06:30:00.000Z');
        expect(moment.standardOffsetMinutes).toBe(480);
    });

    it('removes the daylight-saving hour for the day and hour pillars but keeps the true instant', () => {
        const moment = buildBirthMoment({
            birthDate: '1975-07-01', birthTime: '00:30', timeZone: 'Asia/Taipei',
        });

        expect(moment.instant.toISOString()).toBe('1975-06-30T15:30:00.000Z');
        expect(moment.birthDate).toBe('1975-06-30');
        expect(moment.birthTime).toBe('23:30');
    });

    it('places an unknown time at local noon and returns no standard clock', () => {
        const moment = buildBirthMoment({
            birthDate: '1989-10-27', birthTime: null,
        });

        expect(moment.instant.toISOString()).toBe('1989-10-27T04:00:00.000Z');
        expect(moment.birthTime).toBeNull();
    });
});
