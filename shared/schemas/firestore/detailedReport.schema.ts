import { z } from 'zod';
import {
    bloodTypeSchema, epochMsSchema, mbtiTypeSchema, numerologySchema, zodiacSchema,
} from '../common';

/** The eight sections, in the order they are shown (plan 6.3). */
export const REPORT_SECTIONS = [
    {
        key: 'overview', title: '個人概況摘要',
    },
    {
        key: 'patterns', title: '主要行為與偏好模式',
    },
    {
        key: 'crossObservations', title: '不同測驗之間的交叉觀察',
    },
    {
        key: 'strengthsAndBlindSpots', title: '優勢與可能盲點',
    },
    {
        key: 'relationships', title: '感情與人際溝通建議',
    },
    {
        key: 'workAndDecisions', title: '工作與決策風格',
    },
    {
        key: 'growthActions', title: '可執行的成長行動',
    },
    {
        key: 'basisAndLimits', title: '分析依據、限制與免責說明',
    },
] as const;

export const REPORT_SECTION_KEYS = REPORT_SECTIONS.map((section) => section.key);

const sectionKeySchema = z.enum(REPORT_SECTION_KEYS as [string, ...string[]]);

/** Whether a statement comes straight from the data we gave the model or is its own reading of it. */
export const evidenceKindSchema = z.enum(['OBSERVED', 'INFERRED']);

/** What the model returns for one section. */
export const aiSectionSchema = z.object({
    key: sectionKeySchema,
    content: z.string(),
    /** Which provided fact the statements rest on, in plain words. */
    evidence: z.string(),
    evidenceKind: evidenceKindSchema,
});

/** What the model returns overall (kept free of length rules: those are checked after parsing). */
export const aiReportOutputSchema = z.object({ sections: z.array(aiSectionSchema) });

export const dimensionResultSchema = z.object({
    /** Summed answer lean toward `firstLetter` (positive) or `secondLetter` (negative). */
    score: z.number(),
    /** Largest possible absolute score for this dimension. */
    maxScore: z.number(),
    leaning: z.string().length(1),
});

/**
 * Everything the model may know about the member, as plain facts.
 * It holds no free text from the user, so nothing in it can carry instructions (NFR-001).
 */
export const analysisInputSchema = z.object({
    /** Hash of the facts below: tells apart reports made from different data (FR-015). */
    inputVersion: z.string(),
    profile: z.object({
        /** Each is null when that dimension was not chosen for this report */
        zodiac: zodiacSchema.nullable(),
        bloodType: bloodTypeSchema.exclude(['UNKNOWN']).nullable(),
        mbti: mbtiTypeSchema.nullable(),
        numerology: numerologySchema.nullable().default(null),
    }),
    /** Per-dimension leanings from the member's latest saved test, when there is one. */
    test: z.object({
        testVersion: z.string(),
        dimensions: z.record(z.string(), dimensionResultSchema),
    }).nullable(),
    humanDesign: z.record(z.string(), z.unknown()).nullable(),
    /** Chart-level BaZi facts when that dimension was chosen; reports made before it was offered have none */
    bazi: z.record(z.string(), z.unknown()).nullable().default(null),
});

/** The dimensions a multi-dimension analysis can combine; a report needs at least two. */
export const REPORT_DIMENSIONS = [
    'ZODIAC',
    'BLOOD',
    'MBTI',
    'HUMAN_DESIGN',
    'NUMEROLOGY',
    'BAZI',
] as const;

export const reportDimensionSchema = z.enum(REPORT_DIMENSIONS);

/** What a report was made from; a dimension that was not chosen is null. */
export const reportCombinationSchema = z.object({
    zodiac: zodiacSchema.nullable(),
    mbti: mbtiTypeSchema.nullable(),
    bloodType: bloodTypeSchema.exclude(['UNKNOWN']).nullable(),
    humanDesignType: z.string().nullable(),
    /** Life path number; reports made before it was offered have none */
    numerology: numerologySchema.nullable().default(null),
    /** The day-master stem of the BaZi chart; reports made before it was offered have none */
    baziDayMaster: z.string().nullable().default(null),
});

export const REPORT_STATUSES = [
    'GENERATING',
    'COMPLETED',
    'FAILED',
] as const;

export const reportStatusSchema = z.enum(REPORT_STATUSES);

export const reportSectionSchema = aiSectionSchema.extend({ title: z.string() });

/** users/{uid}/detailedReports/{reportId}; the id is the client's Idempotency-Key. */
export const detailedReportDocSchema = z.object({
    combinationKey: reportCombinationSchema,
    input: analysisInputSchema,
    status: reportStatusSchema,
    sections: z.array(reportSectionSchema),
    disclaimer: z.string().nullable(),
    modelName: z.string().nullable(),
    promptVersion: z.string().nullable(),
    /** The report this one replaces when it came from a regeneration (the old one is kept). */
    supersedesReportId: z.string().nullable(),
    failureReason: z.string().nullable(),
    createdAt: epochMsSchema,
    completedAt: epochMsSchema.nullable(),
    /** completedAt + 6 months (RULE-030) */
    expiresAt: epochMsSchema.nullable(),
    downloadCount: z.number().int().nonnegative(),
    lastDownloadedAt: epochMsSchema.nullable(),
});

/** aiUsageRecords/{id}: cost bookkeeping that survives account deletion without the user id. */
export const aiUsageRecordSchema = z.object({
    userId: z.string().nullable(),
    reportId: z.string(),
    modelName: z.string(),
    inputTokens: z.number().int().nonnegative(),
    outputTokens: z.number().int().nonnegative(),
    estimatedCost: z.number().nonnegative(),
    createdAt: epochMsSchema,
});

export type AiSection = z.infer<typeof aiSectionSchema>;
export type AiReportOutput = z.infer<typeof aiReportOutputSchema>;
export type AnalysisInput = z.infer<typeof analysisInputSchema>;
export type DetailedReportDoc = z.infer<typeof detailedReportDocSchema>;
export type ReportDimension = z.infer<typeof reportDimensionSchema>;
export type ReportStatus = z.infer<typeof reportStatusSchema>;
export type AiUsageRecord = z.infer<typeof aiUsageRecordSchema>;
