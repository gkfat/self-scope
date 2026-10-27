import { isRealDate } from '../schemas/common';

const MASTER_NUMBERS: readonly number[] = [
    11,
    22,
    33,
];

function digitSum(value: number): number {
    return String(value).split('').reduce((sum, digit) => sum + Number(digit), 0);
}

/** Add the digits until one digit is left, keeping the master numbers 11, 22 and 33. */
export function reduceNumber(value: number): number {
    let current = value;

    while (current > 9 && !MASTER_NUMBERS.includes(current)) {
        current = digitSum(current);
    }

    return current;
}

type DateParts = {
    year: number;
    month: number;
    day: number;
};

function partsOf(isoDate: string): DateParts {
    if (!isRealDate(isoDate)) {
        throw new Error(`not a real calendar date: ${isoDate}`);
    }

    const [
        year,
        month,
        day,
    ] = isoDate.split('-').map(Number);

    return {
        year: year as number, month: month as number, day: day as number,
    };
}

/** 生命靈數: year, month and day are reduced on their own, then added and reduced again. */
export function lifePathNumber(isoDate: string): number {
    const {
        year, month, day,
    } = partsOf(isoDate);

    return reduceNumber(reduceNumber(digitSum(year)) + reduceNumber(month) + reduceNumber(day));
}

/** 生日數: the day of the month, reduced. */
export function birthdayNumber(isoDate: string): number {
    return reduceNumber(partsOf(isoDate).day);
}

/** 個人流年: birth month and day with the given year. `year` is passed in so the function stays pure. */
export function personalYearNumber(isoDate: string, year: number): number {
    const {
        month, day,
    } = partsOf(isoDate);

    return reduceNumber(reduceNumber(month) + reduceNumber(day) + reduceNumber(digitSum(year)));
}

/** Age in whole years on `today` (an ISO date). */
export function ageOn(isoDate: string, today: string): number {
    const birth = partsOf(isoDate);
    const now = partsOf(today);
    const birthdayPassed = now.month > birth.month || (now.month === birth.month && now.day >= birth.day);

    return now.year - birth.year - (birthdayPassed ? 0 : 1);
}
