import { buildBirthMoment } from './birthMoment';
import {
    ELEMENTS,
    ELEMENT_LABELS,
    STRENGTH_LEVEL_LABELS,
    TEN_GOD_GROUPS,
    TEN_GOD_GROUP_LABELS,
} from '../../shared/constants/bazi';
import { findCity } from '../../shared/constants/cities';
import { BAZI_POLARITY_LABELS } from '../../shared/constants/baziLabels';
import { analyzeChart } from '../../shared/utils/bazi/analysis';
import { ganzhiLabel } from '../../shared/utils/bazi/ganzhi';
import { calculatePillars } from '../../shared/utils/bazi/pillars';
import { analyzeStrength } from '../../shared/utils/bazi/strength';

type BaziReportInput = {
    birthDate: string;
    birthTime: string;
    birthPlace: string | null;
};

export type BaziReportFacts = {
    dayMaster: string;
    pillars: { year: string; month: string; day: string; hour: string };
    elementCounts: Record<string, number>;
    tenGodGroupCounts: Record<string, number>;
    strength: string;
    pattern: string;
};

/**
 * The chart-level BaZi facts a report may use: day master, pillars, element and ten-god-group counts, strength and
 * pattern. No gender, luck cycles or stone weight go to the model. Written with Chinese labels, as the model reads them.
 */
export function buildBaziReportFacts(input: BaziReportInput): BaziReportFacts {
    const city = input.birthPlace ? findCity(input.birthPlace) : undefined;
    const moment = buildBirthMoment({
        birthDate: input.birthDate,
        birthTime: input.birthTime,
        timeZone: city?.timeZone,
    });
    const pillars = calculatePillars(moment);
    const analysis = analyzeChart(pillars);
    const strength = analyzeStrength(pillars);

    if (!pillars.hour) throw new Error('The BaZi report facts need a birth time');

    return {
        dayMaster: `${analysis.dayMaster.stem}${ELEMENT_LABELS[analysis.dayMaster.element]}（${BAZI_POLARITY_LABELS[analysis.dayMaster.polarity]}）`,
        pillars: {
            year: ganzhiLabel(pillars.year),
            month: ganzhiLabel(pillars.month),
            day: ganzhiLabel(pillars.day),
            hour: ganzhiLabel(pillars.hour),
        },
        elementCounts: Object.fromEntries(ELEMENTS.map((element) => [ELEMENT_LABELS[element], analysis.elementCounts[element]])),
        tenGodGroupCounts: Object.fromEntries(TEN_GOD_GROUPS.map((group) => [TEN_GOD_GROUP_LABELS[group], analysis.groupCounts[group]])),
        strength: STRENGTH_LEVEL_LABELS[strength.level],
        pattern: `${strength.pattern.key}格`,
    };
}
