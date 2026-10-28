import type { Zodiac } from '../schemas/common';

/**
 * Tropical zodiac by month/day.
 * Each entry is the first day of the sign: [month, day, sign].
 */
const ZODIAC_STARTS: ReadonlyArray<readonly [number, number, Zodiac]> = [
    [
        1,
        20,
        'aquarius',
    ],
    [
        2,
        19,
        'pisces',
    ],
    [
        3,
        21,
        'aries',
    ],
    [
        4,
        20,
        'taurus',
    ],
    [
        5,
        21,
        'gemini',
    ],
    [
        6,
        21,
        'cancer',
    ],
    [
        7,
        23,
        'leo',
    ],
    [
        8,
        23,
        'virgo',
    ],
    [
        9,
        23,
        'libra',
    ],
    [
        10,
        23,
        'scorpio',
    ],
    [
        11,
        22,
        'sagittarius',
    ],
    [
        12,
        22,
        'capricorn',
    ],
];

/**
 * Resolve the zodiac sign for a calendar date.
 * @param month 1-12
 * @param day 1-31
 */
export function zodiacFromMonthDay(month: number, day: number): Zodiac {
    for (let i = ZODIAC_STARTS.length - 1; i >= 0; i -= 1) {
        const [
            startMonth,
            startDay,
            sign,
        ] = ZODIAC_STARTS[i] as readonly [number, number, Zodiac];

        if (month > startMonth || (month === startMonth && day >= startDay)) {
            return sign;
        }
    }

    // Before Jan 20 belongs to capricorn (which began on Dec 22).
    return 'capricorn';
}

/**
 * Resolve the zodiac sign from an ISO date string (YYYY-MM-DD).
 * The caller must have validated the format first.
 *
 * Changing what this calculates: raise RULE_VERSIONS.ZODIAC in shared/utils/analysisBasis.ts.
 */
export function zodiacFromIsoDate(isoDate: string): Zodiac {
    const [
        , month,
        day,
    ] = isoDate.split('-').map(Number);

    return zodiacFromMonthDay(month as number, day as number);
}
