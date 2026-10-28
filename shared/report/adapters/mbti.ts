import { MBTI_AXES } from '../../constants/mbtiGuide';
import { mbtiTermsOf } from '../../ontology/mappings/mbti';
import type { MbtiType } from '../../schemas/common';
import { buildMbtiBasis } from '../../utils/analysisBasis';
import type { DimensionScore } from '../../utils/personalityScoring';
import {
    adviceOfBody, readingsOfBody, type FixedContentBody,
} from './common';
import type { SystemReportInput } from '../types';

/** How clear-cut a leaning is, as a share of the most the pair could lean. */
export function mbtiStrengthWord(ratio: number): string {
    if (ratio === 0) return '兩邊接近';
    if (ratio < 0.34) return '稍微偏向';
    if (ratio < 0.67) return '偏向';

    return '明顯偏向';
}

/**
 * The MBTI report of the member's latest result. The strength of each pair comes from the scores of that result;
 * without them (a type that is stored but whose attempt is gone) the report names the sides and says nothing about
 * how clear they are. The report always says this MBTI is a questionnaire of our own, not the official instrument.
 */
export function mbtiReportInput(params: {
    type: MbtiType;
    dimensions: Record<string, DimensionScore> | null;
    testVersion: string | null;
    body: FixedContentBody;
}): SystemReportInput {
    const terms = mbtiTermsOf(params.type);

    return {
        system: 'MBTI',
        position: params.type,
        facts: MBTI_AXES.map((axis, index) => {
            const letter = params.type[index] ?? '';
            const side = letter === axis.first.letter ? axis.first : axis.second;
            const score = params.dimensions?.[axis.key];
            const strength = score && score.maxScore > 0 ? `，${mbtiStrengthWord(Math.min(1, Math.abs(score.score) / score.maxScore))}` : '';

            return {
                label: axis.title, value: `${side.label}（${side.letter}）${strength}`, term: terms[index],
            };
        }),
        interpretations: readingsOfBody(params.body),
        traits: terms,
        advice: adviceOfBody(params.body),
        disclaimer: params.body.disclaimer,
        basis: params.testVersion ? [buildMbtiBasis(params.testVersion)] : [],
    };
}
