/** The systems whose single-dimension report is built so far; the rest follow system by system. */
export const SINGLE_REPORT_SYSTEMS = [
    'ZODIAC',
    'BLOOD',
    'NUMEROLOGY',
    'MBTI',
] as const;

export type SingleReportSystem = typeof SINGLE_REPORT_SYSTEMS[number];
