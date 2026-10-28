import {
    BORDERLINE_MINUTES,
    BRANCHES,
    RAT_HOUR_START_STEM,
    STEMS,
    TIGER_MONTH_START_STEM,
    type Branch,
    type Stem,
} from '../../constants/bazi';
import { DAY_MS } from '../time';
import {
    dayPillarOf, parseDate,
} from './dayPillar';
import {
    branchIndex,
    stemIndex,
    yearGanzhi,
    type Ganzhi,
} from './ganzhi';
import {
    jieAround,
    solarTermsOfYear,
    type TermNeighbours,
} from './solarTerms';

export { dayPillarOf };

export type Pillar = Ganzhi;

export type BirthMoment = {
    /** Civil date at the birthplace in standard time (daylight saving removed), YYYY-MM-DD. */
    birthDate: string;
    /** Standard-time clock at the birthplace, HH:mm; null when unknown (no hour pillar). */
    birthTime: string | null;
    /** Standard-time offset of the birthplace from UTC in minutes; decides which civil date a term instant falls on. */
    standardOffsetMinutes: number;
    /**
     * The UTC instant of the birth. When the time is unknown the caller passes local noon,
     * which only decides the year and month pillars (see `termDay` for the cases where that is uncertain).
     */
    instant: Date;
};

export type BorderlineNote =
    | { kind: 'JIE'; term: string; minutes: number }
    | { kind: 'HOUR'; minutes: number };

export type TermDayNote = {
    /** The 節 that starts on the birth date. */
    term: string;
    /** True for 立春, which also changes the year pillar. */
    changesYear: boolean;
};

export type FourPillars = {
    /** The year the year pillar belongs to (the previous Gregorian year before 立春). */
    baziYear: number;
    year: Pillar;
    month: Pillar;
    day: Pillar;
    /** Null when the birth time is unknown. */
    hour: Pillar | null;
    /** True for 23:00–24:00, where the day pillar is kept and the hour stem follows the next day. */
    lateZi: boolean;
    /** The 節 in force at the birth and its neighbours. */
    jie: TermNeighbours;
    /** Within 30 minutes of a 節 or an hour boundary (only when the time is known). */
    borderline: BorderlineNote[];
    /** A 節 starts on the birth date and the time is unknown, so the month (or year) pillar may differ. */
    termDay: TermDayNote | null;
};

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const MINUTE_MS = 60 * 1000;
const LICHUN_INDEX = 2;

function parseTime(time: string): number {
    const match = TIME_PATTERN.exec(time);

    if (!match) throw new Error(`Invalid birth time: ${time}`);

    return Number(match[1]) * 60 + Number(match[2]);
}

/** The civil date (YYYY-MM-DD) an instant falls on at a place with the given offset from UTC. */
export function localDateOf(instant: Date, offsetMinutes: number): string {
    return new Date(instant.getTime() + offsetMinutes * MINUTE_MS).toISOString().slice(0, 10);
}

function nextDate(isoDate: string): string {
    return new Date(parseDate(isoDate) + DAY_MS).toISOString().slice(0, 10);
}

/** The year the pillar belongs to: the civil year, or the previous one before that year's 立春. */
function baziYearOf(moment: BirthMoment): number {
    const civilYear = Number(moment.birthDate.slice(0, 4));
    const lichun = solarTermsOfYear(civilYear)[LICHUN_INDEX];

    if (!lichun) throw new Error(`Missing 立春 for ${civilYear}`);

    return moment.instant.getTime() < lichun.time.getTime() ? civilYear - 1 : civilYear;
}

/** Month stem by 五虎遁 from the year stem; `monthBranch` decides how far past 寅 the month is. */
function monthPillarOf(yearStem: Stem, monthBranch: Branch): Pillar {
    const startStem = TIGER_MONTH_START_STEM[stemIndex(yearStem) % 5] as Stem;
    const monthsSinceYin = (branchIndex(monthBranch) - branchIndex('寅') + BRANCHES.length) % BRANCHES.length;

    return {
        stem: STEMS[(stemIndex(startStem) + monthsSinceYin) % STEMS.length] as Stem,
        branch: monthBranch,
    };
}

/** Hour branch index (子 = 0) of a minute of the day; 23:00–00:59 is 子. */
function hourBranchIndex(minuteOfDay: number): number {
    return Math.floor(((Math.floor(minuteOfDay / 60) + 1) % 24) / 2);
}

/** Hour stem by 五鼠遁 from the stem of the day the hour belongs to. */
function hourPillarOf(dayStem: Stem, branchIdx: number): Pillar {
    const startStem = RAT_HOUR_START_STEM[stemIndex(dayStem) % 5] as Stem;

    return {
        stem: STEMS[(stemIndex(startStem) + branchIdx) % STEMS.length] as Stem,
        branch: BRANCHES[branchIdx] as Branch,
    };
}

/** Minutes from a minute of the day to the nearest hour boundary (odd hours: 23:00, 01:00, 03:00 …). */
function minutesToHourBoundary(minuteOfDay: number): number {
    const sinceBoundary = (minuteOfDay + 60) % 120;

    return Math.min(sinceBoundary, 120 - sinceBoundary);
}

function borderlineNotes(moment: BirthMoment, jie: TermNeighbours): BorderlineNote[] {
    if (moment.birthTime === null) return [];

    const notes: BorderlineNote[] = [];
    const at = moment.instant.getTime();

    for (const term of [jie.current, jie.next]) {
        const minutes = Math.abs(term.time.getTime() - at) / MINUTE_MS;

        if (minutes <= BORDERLINE_MINUTES) {
            notes.push({
                kind: 'JIE',
                term: term.name,
                minutes: Math.round(minutes),
            });
        }
    }

    const hourMinutes = minutesToHourBoundary(parseTime(moment.birthTime));

    if (hourMinutes <= BORDERLINE_MINUTES) {
        notes.push({
            kind: 'HOUR',
            minutes: hourMinutes,
        });
    }

    return notes;
}

function termDayNote(moment: BirthMoment, birthYear: number): TermDayNote | null {
    if (moment.birthTime !== null) return null;

    // A 節 near the new year can fall on the birth date in the adjacent Gregorian year's list
    const terms = [
        birthYear - 1,
        birthYear,
        birthYear + 1,
    ].flatMap((year) => solarTermsOfYear(year));
    const match = terms.find((term) => (
        term.monthBranch !== null && localDateOf(term.time, moment.standardOffsetMinutes) === moment.birthDate
    ));

    if (!match) return null;

    return {
        term: match.name,
        changesYear: match.index === LICHUN_INDEX,
    };
}

/** The four pillars for a birth moment, under the fixed rules in `BAZI_RULES`. */
/** Changing what this calculates: raise RULE_VERSIONS.BAZI in shared/utils/analysisBasis.ts. */
export function calculatePillars(moment: BirthMoment): FourPillars {
    const birthYear = Number(moment.birthDate.slice(0, 4));
    const day = dayPillarOf(moment.birthDate);
    const baziYear = baziYearOf(moment);
    const year = yearGanzhi(baziYear);
    const jie = jieAround(moment.instant);
    const monthBranch = jie.current.monthBranch;

    if (!monthBranch) throw new Error(`Not a month-starting term: ${jie.current.name}`);

    const month = monthPillarOf(year.stem, monthBranch);

    if (moment.birthTime === null) {
        return {
            baziYear,
            year,
            month,
            day,
            hour: null,
            lateZi: false,
            jie,
            borderline: [],
            termDay: termDayNote(moment, birthYear),
        };
    }

    const minuteOfDay = parseTime(moment.birthTime);
    const lateZi = minuteOfDay >= 23 * 60;
    // The day pillar stays; only the hour stem looks at the next day's stem in the late 子 hour
    const hourDay = lateZi ? dayPillarOf(nextDate(moment.birthDate)) : day;

    return {
        baziYear,
        year,
        month,
        day,
        hour: hourPillarOf(hourDay.stem, hourBranchIndex(minuteOfDay)),
        lateZi,
        jie,
        borderline: borderlineNotes(moment, jie),
        termDay: null,
    };
}
