import type { MultiReportSystem } from '../report/systems';

/** What each system's own report is worth, in points: one, and more for the two that take more to work out. */
const SYSTEM_BASE_PRICE: Readonly<Record<MultiReportSystem, number>> = {
    ZODIAC: 1,
    BLOOD: 1,
    MBTI: 1,
    NUMEROLOGY: 1,
    MAYA_KIN: 1,
    HUMAN_DESIGN: 2,
    BAZI: 3,
};

/** The price of a combination is the sum of its systems times this, in tenths so that the rounding is exact. */
const MULTI_REPORT_WEIGHT_TENTHS = 12;
const TENTHS = 10;

/** No multi-dimension report costs more than this, however many systems it combines. */
const MAX_COST = 30;

/** The fewest systems one report combines. */
export const MULTI_REPORT_MIN_SYSTEMS = 2;

/**
 * Points a multi-dimension report costs (the AI reading is included), or null when the number of systems is not offered.
 * Price = the sum of the systems' own prices x 1.2, rounded down, never above the cap.
 */
export function multiReportCost(systems: readonly MultiReportSystem[]): number | null {
    const unique = [...new Set(systems)];

    if (unique.length < MULTI_REPORT_MIN_SYSTEMS) return null;

    const base = unique.reduce((total, system) => total + SYSTEM_BASE_PRICE[system], 0);

    return Math.min(MAX_COST, Math.floor((base * MULTI_REPORT_WEIGHT_TENTHS) / TENTHS));
}
