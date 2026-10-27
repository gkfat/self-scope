import type { ReportDimension } from '../schemas/firestore/detailedReport.schema';

/** Without the human design the analysis is written content: 2 dimensions cost 1 point, 3 cost 3, 4 cost 5. */
const FIXED_CONTENT_COSTS: Readonly<Record<number, number>> = {
    2: 1,
    3: 3,
    4: 5,
};

/** With the human design the analysis is generated: 2 dimensions cost 3 points, 3 cost 5, 4 cost 8, 5 cost 13. */
const GENERATED_COSTS: Readonly<Record<number, number>> = {
    2: 3,
    3: 5,
    4: 8,
    5: 13,
};

/** Whether this choice of dimensions is generated (it includes the human design) or written content. */
export function isGeneratedAnalysis(dimensions: readonly ReportDimension[]): boolean {
    return dimensions.includes('HUMAN_DESIGN');
}

/** Points a multi-dimension analysis costs, or null when the number of dimensions is not offered. */
export function multiDimensionCost(dimensions: readonly ReportDimension[]): number | null {
    const table = isGeneratedAnalysis(dimensions) ? GENERATED_COSTS : FIXED_CONTENT_COSTS;

    return table[new Set(dimensions).size] ?? null;
}
