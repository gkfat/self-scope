import { z } from 'zod';

/** The systems whose results come with a calculation basis (blood type is a stated fact, not a calculation). */
export const ANALYSIS_SYSTEMS = [
    'ZODIAC',
    'BAZI',
    'NATAL_CHART',
    'HUMAN_DESIGN',
    'NUMEROLOGY',
    'MAYA_KIN',
    'HOROSCOPE',
    'MBTI',
    'TAROT',
    'RUNE',
] as const;

export const analysisSystemSchema = z.enum(ANALYSIS_SYSTEMS);

/** Flat values only: no nested objects and no free text from the user. */
export const basisInputsSchema = z.record(
    z.string(),
    z.union([
        z.string(),
        z.number(),
        z.boolean(),
        z.null(),
    ]),
);

/** What a result was calculated from and by which version of the rules. */
export const analysisBasisSchema = z.object({
    system: analysisSystemSchema,
    method: z.string().min(1),
    ruleVersion: z.string().min(1),
    inputs: basisInputsSchema,
});

export type AnalysisSystem = z.infer<typeof analysisSystemSchema>;
export type BasisInputs = z.infer<typeof basisInputsSchema>;
export type AnalysisBasis = z.infer<typeof analysisBasisSchema>;
