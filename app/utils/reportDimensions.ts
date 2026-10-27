import {
    BLOOD_TYPE_LABELS, ZODIAC_LABELS,
} from '../../shared/constants/zodiacLabels';
import { HUMAN_DESIGN_TYPE_LABELS } from '../../shared/constants/humanDesignLabels';
import type { ReportDimension } from '../../shared/schemas/firestore/detailedReport.schema';

/** What a stored analysis was made from: a written-content one has no human design field */
export type CombinationLike = {
    zodiac: string | null;
    mbti: string | null;
    bloodType: string | null;
    humanDesignType?: string | null;
    numerology?: string | null;
    /** Day-master stem of the BaZi chart, for reports that used it */
    baziDayMaster?: string | null;
};

export type DimensionMeta = {
    value: ReportDimension;
    label: string;
    icon: string;
    tone: string;
};

/** The same icon and color each dimension has on the self-reports screen */
export const DIMENSION_META: DimensionMeta[] = [
    {
        value: 'ZODIAC', label: '星座', icon: 'mdi-star-four-points-outline', tone: '#b7791f',
    },
    {
        value: 'BLOOD', label: '血型', icon: 'mdi-water-outline', tone: '#c94f4f',
    },
    {
        value: 'MBTI', label: 'MBTI', icon: 'mdi-head-cog-outline', tone: '#2f5d8a',
    },
    {
        value: 'HUMAN_DESIGN', label: '人類圖', icon: 'mdi-vector-triangle', tone: '#2e7d5b',
    },
    {
        value: 'NUMEROLOGY', label: '生命靈數', icon: 'mdi-numeric', tone: '#7a5aa6',
    },
    {
        value: 'BAZI', label: '八字', icon: 'mdi-yin-yang', tone: '#8c5e34',
    },
];

/** The dimensions a stored combination was made from, in display order */
export function dimensionsOf(combination: CombinationLike): ReportDimension[] {
    const dimensions: ReportDimension[] = [];

    if (combination.zodiac !== null) dimensions.push('ZODIAC');
    if (combination.bloodType !== null) dimensions.push('BLOOD');
    if (combination.mbti !== null) dimensions.push('MBTI');
    if ((combination.humanDesignType ?? null) !== null) dimensions.push('HUMAN_DESIGN');
    if ((combination.numerology ?? null) !== null) dimensions.push('NUMEROLOGY');
    if ((combination.baziDayMaster ?? null) !== null) dimensions.push('BAZI');

    return dimensions;
}

function resultOf(value: ReportDimension, combination: CombinationLike): string {
    switch (value) {
    case 'ZODIAC':
        return ZODIAC_LABELS[combination.zodiac as keyof typeof ZODIAC_LABELS] ?? combination.zodiac ?? '';
    case 'BLOOD':
        return BLOOD_TYPE_LABELS[combination.bloodType as keyof typeof BLOOD_TYPE_LABELS] ?? combination.bloodType ?? '';
    case 'MBTI':
        return combination.mbti ?? '';
    case 'NUMEROLOGY':
        return combination.numerology ? `數字 ${combination.numerology}` : '';
    case 'BAZI':
        return combination.baziDayMaster ? `${combination.baziDayMaster}日主` : '';
    case 'HUMAN_DESIGN':
        return HUMAN_DESIGN_TYPE_LABELS[combination.humanDesignType as keyof typeof HUMAN_DESIGN_TYPE_LABELS] ?? combination.humanDesignType ?? '';
    }
}

/** Each dimension of the combination with what this person has in it, e.g. 星座 → 天蠍座 */
export function dimensionPartsOf(combination: CombinationLike): Array<DimensionMeta & { result: string }> {
    return dimensionsOf(combination).flatMap((value) => {
        const meta = DIMENSION_META.find((item) => item.value === value);

        return meta ? [
            {
                ...meta, result: resultOf(value, combination),
            },
        ] : [];
    });
}

/** "星座 × 血型" */
export function combinationLabel(combination: CombinationLike): string {
    return dimensionPartsOf(combination).map((part) => part.label).join(' × ');
}

/** "天蠍座 × O 型" */
export function combinationResult(combination: CombinationLike): string {
    return dimensionPartsOf(combination).map((part) => part.result).join(' × ');
}
