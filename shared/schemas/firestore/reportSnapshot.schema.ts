import { z } from 'zod';
import { analysisBasisSchema } from '../analysisBasis.schema';
import {
    epochMsSchema, isoDateSchema,
} from '../common';
import { MAPPING_SYSTEMS } from '../../ontology/schema';

/**
 * What a sentence of a report is: a fact the system calculated, what the tradition of that system says about it,
 * what we (rules or the AI) concluded from several facts, or what the member said. Nothing yet produces the last one:
 * the member's own words are not kept (see add-report-snapshots), the kind is held in reserve.
 */
export const SNAPSHOT_SEGMENT_KINDS = [
    'FACT',
    'SYSTEM_INTERPRETATION',
    'AI_INFERENCE',
    'USER_STATEMENT',
] as const;

export const SNAPSHOT_KINDS = ['SINGLE', 'MULTI'] as const;

export const snapshotSystemSchema = z.enum(MAPPING_SYSTEMS);

/** Where a sentence comes from: a term of a system, or an axis end with the fragment that was used. */
export const snapshotSourceSchema = z.object({
    system: snapshotSystemSchema.optional(),
    term: z.string().min(1).optional(),
    axisEnd: z.string().regex(/^[A-E][1-6]\.[AB]$/).optional(),
    fragment: z.string().min(1).optional(),
}).strict().refine((source) => Object.values(source).some((value) => value !== undefined), 'a source names a system, a term, an axis end or a fragment');

export const snapshotSegmentSchema = z.object({
    /** The words as the member read them, in full */
    text: z.string().min(1),
    kind: z.enum(SNAPSHOT_SEGMENT_KINDS),
    sources: z.array(snapshotSourceSchema).min(1),
    /** Depends on when the report was made (a luck cycle, a year number): it does not change afterwards */
    timeSensitive: z.boolean(),
    /** The date (YYYY-MM-DD) a time-sensitive sentence was made for; null otherwise */
    asOf: isoDateSchema.nullable(),
    /** For a guess about the past: the question that lets the reader check it against their own life (the answer is not kept) */
    confirmQuestion: z.string().min(1).optional(),
}).superRefine((segment, ctx) => {
    if (segment.timeSensitive && segment.asOf === null) {
        ctx.addIssue({
            code: 'custom', path: ['asOf'], message: 'a time-sensitive sentence needs the date it was made for',
        });
    }
});

export const snapshotBlockSchema = z.object({
    key: z.string().min(1),
    title: z.string().min(1),
    segments: z.array(snapshotSegmentSchema).min(1),
});

/** The versions of everything the rule-made part of a report was made from, so any sentence can be traced to what produced it. */
export const snapshotVersionsSchema = z.object({
    ontology: z.string().min(1),
    mapping: z.string().min(1),
    fragments: z.string().min(1),
    templates: z.string().min(1),
});

/**
 * The AI's advanced analysis of a report, kept in a field of its own beside the rule-made `blocks`. It never replaces
 * them: the base report stays as it was made, and this is added to it (and replaced by a newer analysis, never the base).
 */
export const snapshotAiSchema = z.object({
    blocks: z.array(snapshotBlockSchema).min(1),
    modelName: z.string().min(1),
    promptVersion: z.string().min(1),
    generatedAt: epochMsSchema,
});

/**
 * The progress of the AI analysis of a report: the id is the client's Idempotency-Key, and a failure says why
 * (the points were given back). Kept on the report so that nothing else has to be stored or cleaned up.
 */
export const SNAPSHOT_AI_JOB_STATUSES = [
    'GENERATING',
    'COMPLETED',
    'FAILED',
] as const;

export const snapshotAiJobSchema = z.object({
    id: z.string().min(1),
    status: z.enum(SNAPSHOT_AI_JOB_STATUSES),
    failureReason: z.string().nullable(),
    createdAt: epochMsSchema,
});

const contentShape = {
    kind: z.enum(SNAPSHOT_KINDS),
    systems: z.array(snapshotSystemSchema).min(1),
    /** The one-line conclusion of where the member stands, e.g. "太陽天蠍座" */
    position: z.string().min(1),
    blocks: z.array(snapshotBlockSchema).min(1),
    versions: snapshotVersionsSchema,
    basis: z.array(analysisBasisSchema),
};

type ContentCheck = { kind: 'SINGLE' | 'MULTI'; systems: readonly unknown[] };

function checkSystemCount(value: ContentCheck, ctx: z.RefinementCtx) {
    const expected = value.kind === 'SINGLE' ? value.systems.length === 1 : value.systems.length >= 2;

    if (!expected) {
        ctx.addIssue({
            code: 'custom', path: ['systems'], message: value.kind === 'SINGLE' ? 'a single-dimension report is about one system' : 'a multi-dimension report is about at least two systems',
        });
    }
}

/** A report as it is handed over to be kept: everything but the times, which the service sets. */
export const reportSnapshotContentSchema = z.object(contentShape).superRefine(checkSystemCount);

/** users/{uid}/reportSnapshots/{snapshotId} */
export const reportSnapshotDocSchema = z.object({
    ...contentShape,
    /** The AI analysis, once the member has asked for it; null until then */
    ai: snapshotAiSchema.nullable().default(null),
    /** The latest request for that analysis; null when none was made */
    aiJob: snapshotAiJobSchema.nullable().default(null),
    generatedAt: epochMsSchema,
    /** generatedAt + 6 months; removed by the daily expiry job (no TTL) */
    expiresAt: epochMsSchema,
}).superRefine(checkSystemCount);

export type SnapshotSegmentKind = typeof SNAPSHOT_SEGMENT_KINDS[number];
export type SnapshotSegment = z.infer<typeof snapshotSegmentSchema>;
export type SnapshotBlock = z.infer<typeof snapshotBlockSchema>;
export type SnapshotVersions = z.infer<typeof snapshotVersionsSchema>;
export type SnapshotAiJob = z.infer<typeof snapshotAiJobSchema>;
export type SnapshotAi = z.infer<typeof snapshotAiSchema>;
export type ReportSnapshotContent = z.infer<typeof reportSnapshotContentSchema>;
export type ReportSnapshotDoc = z.infer<typeof reportSnapshotDocSchema>;
