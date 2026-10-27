import type { ReportDimension } from '../schemas/firestore/detailedReport.schema';

/** What each dimension's own report is worth, in points; the multi-dimension price starts from their sum. */
const DIMENSION_BASE_PRICE: Readonly<Record<ReportDimension, number>> = {
    ZODIAC: 1,
    BLOOD: 1,
    MBTI: 1,
    NUMEROLOGY: 1,
    HUMAN_DESIGN: 2,
    BAZI: 3,
};

/**
 * Weight by the number of dimensions, in halves (2 = x1, 3 = x1.5 …): more dimensions cost more, and the weight stops
 * rising at five. Halves keep the arithmetic in whole numbers, so the final rounding is exact.
 */
const COUNT_WEIGHT_HALVES: Readonly<Record<number, number>> = {
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 5,
};

/** An analysis the model generates costs 1.5 times as much; both factors are written as halves. */
const GENERATED_WEIGHT_HALVES = 3;
const WRITTEN_WEIGHT_HALVES = 2;

/** No multi-dimension analysis costs more than this, however many dimensions it combines. */
const MAX_COST = 30;

/** Two factors in halves multiply to quarters. */
const QUARTERS = 4;

/** Whether this choice of dimensions is generated (it includes the human design or the BaZi chart) or written content. */
export function isGeneratedAnalysis(dimensions: readonly ReportDimension[]): boolean {
    return dimensions.includes('HUMAN_DESIGN') || dimensions.includes('BAZI');
}

/**
 * Points a multi-dimension analysis costs, or null when the number of dimensions is not offered.
 * Price = sum of the dimensions' own prices x weight of the dimension count x 1.5 when generated, rounded down,
 * and never above the cap.
 */
export function multiDimensionCost(dimensions: readonly ReportDimension[]): number | null {
    const unique = [...new Set(dimensions)];
    const countWeight = COUNT_WEIGHT_HALVES[unique.length];

    if (countWeight === undefined) return null;

    const base = unique.reduce((total, dimension) => total + DIMENSION_BASE_PRICE[dimension], 0);
    const generatedWeight = isGeneratedAnalysis(unique) ? GENERATED_WEIGHT_HALVES : WRITTEN_WEIGHT_HALVES;

    return Math.min(MAX_COST, Math.floor((base * countWeight * generatedWeight) / QUARTERS));
}
