import type {
    Stem, TenGod,
} from '../../constants/bazi';
import type { Gender } from '../../schemas/common';
import {
    DAY_MS, addMonths,
} from '../time';
import { tenGodOf } from './analysis';
import {
    shiftGanzhi,
    stemPolarity,
    yearGanzhi,
    type Ganzhi,
} from './ganzhi';
import type { FourPillars } from './pillars';
import { solarTermsOfYear } from './solarTerms';

export type LuckDirection = 'FORWARD' | 'BACKWARD';

/** The age at which the first luck cycle starts, as years, months and days of the traditional conversion. */
export type StartAge = {
    years: number;
    months: number;
    days: number;
};

export type LuckStep = {
    /** 1-based position among the eight steps. */
    order: number;
    pillar: Ganzhi;
    /** Ten god of the step's stem against the day stem. */
    tenGod: TenGod;
    /** Nominal age (虛歲, counting the birth year as 1) the step starts at, and the age it ends at. */
    startAge: number;
    endAge: number;
    /** Gregorian years the step covers, by the local calendar of the birthplace. */
    startYear: number;
    endYear: number;
    /** The instant the step starts at. */
    startsAt: Date;
};

export type LuckCycle = {
    direction: LuckDirection;
    /** The 節 the span to the start of the first step was measured to. */
    measuredToTerm: string;
    startAge: StartAge;
    /** The instant the first step starts at (起運). */
    startsAt: Date;
    steps: LuckStep[];
    /** 1-based order of the step in force at `now`; null before the first step starts. */
    currentOrder: number | null;
};

export type FlowYear = {
    year: number;
    pillar: Ganzhi;
    /** Ten god of the year's stem against the day stem. */
    tenGod: TenGod;
};

export const LUCK_STEP_COUNT = 8;
export const LUCK_STEP_YEARS = 10;
/** Flow years listed from the current one: this year and the next four. */
export const FLOW_YEAR_COUNT = 5;

const MINUTE_MS = 60 * 1000;
/** Time zone used to decide "today" and the current year when none is given: Taipei, UTC+8. */
const DEFAULT_NOW_OFFSET_MINUTES = 480;
/** 3 days of life span count for 1 year, so one day counts for 4 months: 120 days of a 30-day-month calendar. */
const LIFE_DAYS_PER_DAY = 120;
const DAYS_PER_YEAR = 360;
const DAYS_PER_MONTH = 30;
const LICHUN_INDEX = 2;
/** Nominal age counts a person as 1 at birth, so it is the elapsed whole years plus one. */
const NOMINAL_AGE_OFFSET = 1;

export function luckDirection(yearStem: Stem, gender: Gender): LuckDirection {
    const yang = stemPolarity(yearStem) === 'YANG';

    return (yang && gender === 'MALE') || (!yang && gender === 'FEMALE') ? 'FORWARD' : 'BACKWARD';
}

/** Convert the span between birth and the measured 節 into the age the first step starts at. */
export function startAgeOf(spanMs: number): { age: StartAge; remainderMs: number } {
    const lifeDays = (spanMs / DAY_MS) * LIFE_DAYS_PER_DAY;
    const years = Math.floor(lifeDays / DAYS_PER_YEAR);
    const afterYears = lifeDays - years * DAYS_PER_YEAR;
    const months = Math.floor(afterYears / DAYS_PER_MONTH);
    const afterMonths = afterYears - months * DAYS_PER_MONTH;
    const days = Math.floor(afterMonths);

    return {
        age: {
            years, months, days,
        },
        remainderMs: (afterMonths - days) * DAY_MS,
    };
}

/** Add years and months on the birthplace's clock (months clamp to the month end), then days and a fraction of a day. */
function addToBirth(instant: Date, offsetMinutes: number, age: StartAge, remainderMs: number): Date {
    const local = instant.getTime() + offsetMinutes * MINUTE_MS;
    const moved = addMonths(local, age.years * 12 + age.months) + age.days * DAY_MS + remainderMs;

    return new Date(moved - offsetMinutes * MINUTE_MS);
}

function localYearOf(instant: Date, offsetMinutes: number): number {
    return new Date(instant.getTime() + offsetMinutes * MINUTE_MS).getUTCFullYear();
}

/**
 * The luck cycles (大運): direction by year-stem polarity and gender, start age by the span to the next (forward) or
 * the last (backward) 節, then eight ten-year steps beginning with the pillar next to the month pillar.
 * Null when the birth time is unknown, since the start age needs the exact moment.
 */
export function calculateLuckCycle(
    pillars: FourPillars,
    instant: Date,
    gender: Gender,
    now: Date,
    offsetMinutes: number = DEFAULT_NOW_OFFSET_MINUTES,
): LuckCycle | null {
    if (pillars.hour === null) return null;

    const direction = luckDirection(pillars.year.stem, gender);
    const term = direction === 'FORWARD' ? pillars.jie.next : pillars.jie.current;
    const span = Math.abs(term.time.getTime() - instant.getTime());
    const {
        age, remainderMs,
    } = startAgeOf(span);
    const startsAt = addToBirth(instant, offsetMinutes, age, remainderMs);
    const sign = direction === 'FORWARD' ? 1 : -1;
    const startYear = localYearOf(startsAt, offsetMinutes);
    const steps: LuckStep[] = Array.from({ length: LUCK_STEP_COUNT }, (_, index) => {
        const pillar = shiftGanzhi(pillars.month, sign * (index + 1));
        const startAge = age.years + NOMINAL_AGE_OFFSET + index * LUCK_STEP_YEARS;

        return {
            order: index + 1,
            pillar,
            tenGod: tenGodOf(pillars.day.stem, pillar.stem),
            startAge,
            endAge: startAge + LUCK_STEP_YEARS - 1,
            startYear: startYear + index * LUCK_STEP_YEARS,
            endYear: startYear + index * LUCK_STEP_YEARS + LUCK_STEP_YEARS - 1,
            startsAt: addToBirth(startsAt, offsetMinutes, {
                years: index * LUCK_STEP_YEARS, months: 0, days: 0,
            }, 0),
        };
    });
    const started = steps.filter((step) => step.startsAt.getTime() <= now.getTime());

    return {
        direction,
        measuredToTerm: term.name,
        startAge: age,
        startsAt,
        steps,
        currentOrder: started.length > 0 ? (started[started.length - 1] as LuckStep).order : null,
    };
}

/** The BaZi year number (the previous Gregorian year before 立春) in force at an instant. */
export function currentBaziYear(now: Date, offsetMinutes: number = DEFAULT_NOW_OFFSET_MINUTES): number {
    const civilYear = localYearOf(now, offsetMinutes);
    const lichun = solarTermsOfYear(civilYear)[LICHUN_INDEX];

    if (!lichun) throw new Error(`Missing 立春 for ${civilYear}`);

    return now.getTime() < lichun.time.getTime() ? civilYear - 1 : civilYear;
}

function flowYearOf(year: number, dayStem: Stem): FlowYear {
    const pillar = yearGanzhi(year);

    return {
        year,
        pillar,
        tenGod: tenGodOf(dayStem, pillar.stem),
    };
}

/** This year's pillar (立春 changes the year) and the next four, with their ten gods against the day stem. */
export function calculateFlowYears(
    dayStem: Stem,
    now: Date,
    offsetMinutes: number = DEFAULT_NOW_OFFSET_MINUTES,
): FlowYear[] {
    const first = currentBaziYear(now, offsetMinutes);

    return Array.from({ length: FLOW_YEAR_COUNT }, (_, index) => flowYearOf(first + index, dayStem));
}

/** The ten flow years a luck step covers. */
export function flowYearsOfStep(step: LuckStep, dayStem: Stem): FlowYear[] {
    return Array.from({ length: LUCK_STEP_YEARS }, (_, index) => flowYearOf(step.startYear + index, dayStem));
}
