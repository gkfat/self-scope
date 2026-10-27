import { z } from 'zod';
import {
    BRANCHES,
    ELEMENTS,
    LIFE_STAGES,
    STEMS,
    STRENGTH_LEVELS,
    TEN_GODS,
    TEN_GOD_GROUPS,
} from '../../constants/bazi';
import { findCity } from '../../constants/cities';
import {
    genderSchema, isRealDate, isoDateSchema, timeOfDaySchema,
} from '../common';
import { fixedResultResponseSchema } from './fixedResult.schema';

/**
 * The birth data a chart is calculated from. Only the date is required: without a time there are three pillars,
 * without a place Asia/Taipei is used, and without a gender there are no luck cycles.
 */
export const baziRequestSchema = z.object({
    birthDate: isoDateSchema,
    birthTime: timeOfDaySchema.nullable().optional(),
    /** City code from the preset city list */
    birthPlace: z.string().min(1).nullable().optional(),
    gender: genderSchema.nullable().optional(),
}).superRefine((value, ctx) => {
    if (!isRealDate(value.birthDate)) {
        ctx.addIssue({
            code: 'custom', path: ['birthDate'], message: 'birthDate is not a real calendar date',
        });
    } else if (value.birthDate > new Date().toISOString().slice(0, 10)) {
        ctx.addIssue({
            code: 'custom', path: ['birthDate'], message: 'birthDate must not be in the future',
        });
    }

    if (value.birthPlace && !findCity(value.birthPlace)) {
        ctx.addIssue({
            code: 'custom', path: ['birthPlace'], message: 'birthPlace is not in the preset city list',
        });
    }
});

const stemSchema = z.enum(STEMS);
const branchSchema = z.enum(BRANCHES);
const elementSchema = z.enum(ELEMENTS);
const polaritySchema = z.enum(['YANG', 'YIN']);
const tenGodSchema = z.enum(TEN_GODS);
const tenGodGroupSchema = z.enum(TEN_GOD_GROUPS);
const positionSchema = z.enum([
    'year',
    'month',
    'day',
    'hour',
]);

export const pillarSchema = z.object({
    stem: stemSchema,
    branch: branchSchema,
});

const hiddenStemSchema = z.object({
    stem: stemSchema,
    element: elementSchema,
    role: z.enum([
        'MAIN',
        'MIDDLE',
        'RESIDUAL',
    ]),
    tenGod: tenGodSchema,
});

const chartPillarSchema = z.object({
    position: positionSchema,
    stem: stemSchema,
    branch: branchSchema,
    stemElement: elementSchema,
    branchElement: elementSchema,
    /** null for the day master itself */
    stemTenGod: tenGodSchema.nullable(),
    hiddenStems: z.array(hiddenStemSchema),
});

const elementCountsSchema = z.record(elementSchema, z.number().int().nonnegative());
const tenGodCountsSchema = z.record(tenGodSchema, z.number().int().nonnegative());
const groupCountsSchema = z.record(tenGodGroupSchema, z.number().int().nonnegative());

const lifeStageSchema = z.enum(LIFE_STAGES);

const relationSchema = z.object({
    kind: z.enum([
        'STEM_COMBINE',
        'BRANCH_COMBINE',
        'BRANCH_CLASH',
    ]),
    pair: z.string(),
    positions: z.tuple([positionSchema, positionSchema]),
});

const factsSchema = z.object({
    stages: z.array(z.object({
        position: positionSchema, stage: lifeStageSchema,
    })),
    ownStages: z.array(z.object({
        position: positionSchema, stage: lifeStageSchema,
    })),
    voids: z.array(z.object({
        position: positionSchema, branches: z.tuple([branchSchema, branchSchema]),
    })),
    dayVoid: z.object({
        branches: z.tuple([branchSchema, branchSchema]),
        positions: z.array(positionSchema),
    }),
    nayin: z.array(z.object({
        position: positionSchema, name: z.string(), element: elementSchema,
    })),
    mingGong: pillarSchema.nullable(),
    taiYuan: pillarSchema,
    zodiac: z.string(),
    yearPolarity: polaritySchema,
    solarTerm: z.string(),
    season: z.enum([
        '春',
        '夏',
        '秋',
        '冬',
    ]),
    relations: z.array(relationSchema),
});

const usefulGodsSchema = z.object({
    useful: tenGodGroupSchema,
    favorable: tenGodGroupSchema,
    avoid: z.array(tenGodGroupSchema),
});

const strengthSchema = z.object({
    score: z.number().min(0).max(100),
    level: z.enum(STRENGTH_LEVELS),
    side: z.enum([
        'STRONG',
        'WEAK',
        'BALANCED',
    ]),
    phases: z.record(elementSchema, z.enum([
        '旺',
        '相',
        '休',
        '囚',
        '死',
    ])),
    pattern: z.object({
        key: z.string(),
        tenGod: tenGodSchema,
        group: tenGodGroupSchema,
    }),
    /** null when the chart is balanced */
    useful: usefulGodsSchema.nullable(),
});

const boneSchema = z.object({
    lunarYear: pillarSchema,
    lunarMonth: z.number().int().min(1).max(12),
    lunarDay: z.number().int().min(1).max(30),
    leapMonth: z.boolean(),
    totalQian: z.number().int(),
    liang: z.number().int(),
    qian: z.number().int(),
    label: z.string(),
});

const luckStepSchema = z.object({
    order: z.number().int().min(1),
    pillar: pillarSchema,
    tenGod: tenGodSchema,
    startAge: z.number().int(),
    endAge: z.number().int(),
    startYear: z.number().int(),
    endYear: z.number().int(),
    /** ISO instant */
    startsAt: z.string(),
});

const flowYearSchema = z.object({
    year: z.number().int(),
    pillar: pillarSchema,
    tenGod: tenGodSchema,
});

const luckSchema = z.object({
    direction: z.enum(['FORWARD', 'BACKWARD']),
    measuredToTerm: z.string(),
    startAge: z.object({
        years: z.number().int(),
        months: z.number().int(),
        days: z.number().int(),
    }),
    /** ISO instant of 起運 */
    startsAt: z.string(),
    steps: z.array(luckStepSchema),
    /** null before the first step starts */
    currentOrder: z.number().int().nullable(),
    /** The ten flow years of each step, keyed by the step's order */
    stepYears: z.record(z.string(), z.array(flowYearSchema)),
});

const borderlineSchema = z.discriminatedUnion('kind', [
    z.object({
        kind: z.literal('JIE'), term: z.string(), minutes: z.number(),
    }), z.object({
        kind: z.literal('HOUR'), minutes: z.number(),
    }),
]);

const interpretationSchema = z.object({
    dayMaster: fixedResultResponseSchema,
    /** The clearly strongest element, when there is one */
    strongElement: fixedResultResponseSchema.nullable(),
    missingElements: z.array(fixedResultResponseSchema),
    dominantGroup: fixedResultResponseSchema.nullable(),
    month: fixedResultResponseSchema,
    strength: fixedResultResponseSchema,
    pattern: fixedResultResponseSchema,
    /** null when the chart is balanced */
    usefulGods: fixedResultResponseSchema.nullable(),
    bone: fixedResultResponseSchema.nullable(),
    /** The ten-god theme of the luck step in force today */
    currentLuck: fixedResultResponseSchema.nullable(),
});

export const baziResponseSchema = z.object({
    /** The zone the chart was calculated in, and whether it was assumed because no place was given */
    timeZone: z.string(),
    timeZoneAssumed: z.boolean(),
    /** Whether the birth time was given; without it there are only three pillars */
    hasTime: z.boolean(),
    baziYear: z.number().int(),
    pillars: z.object({
        year: pillarSchema,
        month: pillarSchema,
        day: pillarSchema,
        hour: pillarSchema.nullable(),
    }),
    dayMaster: z.object({
        stem: stemSchema, element: elementSchema, polarity: polaritySchema,
    }),
    chart: z.array(chartPillarSchema),
    elementCounts: elementCountsSchema,
    tenGodCounts: tenGodCountsSchema,
    groupCounts: groupCountsSchema,
    facts: factsSchema,
    strength: strengthSchema,
    bone: boneSchema.nullable(),
    lateZi: z.boolean(),
    borderline: z.array(borderlineSchema),
    /** A 節 starts on the birth date and the time is unknown, so the month (or year) pillar may differ */
    termDay: z.object({
        term: z.string(), changesYear: z.boolean(),
    }).nullable(),
    /** Why there is no luck cycle: a gender, or a birth time, is missing; OK when it is there */
    luckStatus: z.enum([
        'OK',
        'NEEDS_GENDER',
        'NEEDS_TIME',
    ]),
    luck: luckSchema.nullable(),
    /** This year (立春 changes the year) and the next four; needs a gender */
    flowYears: z.array(flowYearSchema).nullable(),
    interpretation: interpretationSchema,
});

export type BaziRequest = z.infer<typeof baziRequestSchema>;
export type BaziResponse = z.infer<typeof baziResponseSchema>;
