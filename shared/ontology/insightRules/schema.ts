import { z } from 'zod';

/** The seven kinds of insight a rule can find across systems. */
export const INSIGHT_TYPES = [
    'convergence',
    'tension',
    'interaction',
    'blindspot',
    'context-difference',
    'object-gap',
    'time-extension',
] as const;

export const INSIGHT_TYPE_LABELS: Readonly<Record<typeof INSIGHT_TYPES[number], string>> = {
    'convergence': '收斂',
    'tension': '張力',
    'interaction': '軸間交互',
    'blindspot': '盲區',
    'context-difference': '情境差異',
    'object-gap': '對象落差',
    'time-extension': '時間延伸',
};

const endIdSchema = z.string().regex(/^[A-E][1-6]\.[AB]$/);

/**
 * One condition on a trait end: it holds when the member's terms point at the end from sources of at least
 * `minGroups` different source groups (1 means any source at all). A count of sources, never a strength.
 */
export const insightConditionSchema = z.object({
    end: endIdSchema,
    minGroups: z.number().int().min(1).max(3).default(1),
}).strict();

/**
 * What makes a rule fire, as data and not as code: every `all` condition holds and none of the `absent` ends is
 * pointed at by any source.
 */
export const insightWhenSchema = z.object({
    all: z.array(insightConditionSchema).min(1).max(4),
    absent: z.array(endIdSchema).max(3).default([]),
}).strict();

export const insightRuleSchema = z.object({
    id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    type: z.enum(INSIGHT_TYPES),
    when: insightWhenSchema,
    /**
     * When true the rule fires only if its conditions can be met by sources of different source groups: one tradition
     * saying the same thing twice is not two sources agreeing.
     */
    requiresIndependentSources: z.boolean(),
    /** When true the rule is about one system alone (a tension inside a system): every condition is met by the same system */
    withinSystem: z.boolean().default(false),
    /** Context values (time, object or domain) the insight is about; the kind depends on the type */
    contexts: z.array(z.string().regex(/^(time|object|domain):[a-z-]+$/)).max(4).default([]),
    /** What the insight says, tentatively; the AI later rewrites it for the member */
    template: z.string().min(20).max(240),
    /** What the member can check against their own life */
    hypothesis: z.string().min(8).max(120),
}).strict();

export type InsightType = typeof INSIGHT_TYPES[number];
export type InsightCondition = z.infer<typeof insightConditionSchema>;
export type InsightRule = z.infer<typeof insightRuleSchema>;
/** A rule as it is written in a data file: the defaults may be left out */
export type InsightRuleInput = z.input<typeof insightRuleSchema>;
