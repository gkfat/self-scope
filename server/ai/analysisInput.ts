import { createHash } from 'node:crypto';
import {
    scoreDimensions, type AnswerInput,
} from '../../shared/utils/personalityScoring';
import type { AnalysisInput } from '../../shared/schemas/firestore/detailedReport.schema';
import type {
    ScoringRule, TestQuestion,
} from '../../shared/schemas/firestore/test.schema';
import type {
    BloodType, MbtiType, NumerologyNumber, Zodiac,
} from '../../shared/schemas/common';

type BuildAnalysisInputParams = {
    zodiac: Zodiac | null;
    bloodType: BloodType | null;
    mbti: MbtiType | null;
    numerology?: NumerologyNumber | null;
    /** The member's latest saved test; only given when MBTI is one of the chosen dimensions. */
    test: {
        testVersion: string;
        questions: readonly TestQuestion[];
        rule: ScoringRule;
        answers: readonly AnswerInput[];
    } | null;
    humanDesign: Record<string, unknown> | null;
    bazi?: Record<string, unknown> | null;
};

/**
 * Turn what we know about the member into the plain facts the model may use (FR-015).
 * Unknown blood type is left out entirely (RULE-002). `inputVersion` is a hash of the facts,
 * so two reports can be told apart by what they were made from.
 */
export function buildAnalysisInput(params: BuildAnalysisInputParams): AnalysisInput {
    const facts = {
        profile: {
            zodiac: params.zodiac,
            bloodType: params.bloodType && params.bloodType !== 'UNKNOWN' ? params.bloodType : null,
            mbti: params.mbti,
            numerology: params.numerology ?? null,
        },
        test: params.test
            ? {
                testVersion: params.test.testVersion,
                dimensions: scoreDimensions(params.test.questions, params.test.answers, params.test.rule),
            }
            : null,
        humanDesign: params.humanDesign,
        bazi: params.bazi ?? null,
    };

    const inputVersion = createHash('sha256').update(JSON.stringify(facts)).digest('hex').slice(0, 16);

    return {
        inputVersion, ...facts,
    };
}
