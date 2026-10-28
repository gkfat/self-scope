import { z } from 'zod';

/** The five groups the 28 axes are sorted into; the axis id starts with the letter of its group. */
export const TRAIT_GROUPS = [
    'THINKING',
    'ACTION',
    'EMOTION',
    'RELATION',
    'VALUE',
] as const;

export const TRAIT_GROUP_LABELS: Readonly<Record<typeof TRAIT_GROUPS[number], string>> = {
    THINKING: '思考與認知',
    ACTION: '行動與節奏',
    EMOTION: '情緒與表達',
    RELATION: '人際與關係',
    VALUE: '價值與動機',
};

/** The letter an axis id starts with, per group */
export const TRAIT_GROUP_LETTERS: Readonly<Record<typeof TRAIT_GROUPS[number], string>> = {
    THINKING: 'A',
    ACTION: 'B',
    EMOTION: 'C',
    RELATION: 'D',
    VALUE: 'E',
};

export const traitEndSchema = z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    /** What this end looks like when it is overdone */
    overuse: z.string().min(1),
});

/** One bipolar axis: two ends, A and B, neither better than the other. */
export const traitAxisSchema = z.object({
    id: z.string().regex(/^[A-E][1-6]$/),
    group: z.enum(TRAIT_GROUPS),
    a: traitEndSchema,
    b: traitEndSchema,
});

export const CONTEXT_KINDS = [
    'time',
    'object',
    'domain',
] as const;

/** One value of a context axis. Context axes are not bipolar: any trait end can be looked at in any value. */
export const contextValueSchema = z.object({
    id: z.string().regex(/^(time|object|domain):[a-z-]+$/),
    kind: z.enum(CONTEXT_KINDS),
    name: z.string().min(1),
    description: z.string().min(1),
});

/** Systems whose terms are mapped onto the trait axes. */
export const MAPPING_SYSTEMS = [
    'ZODIAC',
    'BLOOD',
    'MBTI',
    'NUMEROLOGY',
    'MAYA_KIN',
    'BAZI',
    'HUMAN_DESIGN',
    'TAROT',
    'RUNE',
    'HOROSCOPE',
] as const;

/** Systems that describe how things are today, not a lasting trait: they never feed the stable trait mapping. */
export const STATE_SYSTEMS = [
    'TAROT',
    'RUNE',
    'HOROSCOPE',
] as const;

export const MAPPING_METHODS = ['structural', 'keyword'] as const;

export const MAPPING_KINDS = ['trait', 'state'] as const;

/**
 * One term of a system pointing at one end of a trait axis. Deliberately without a strength or a confidence: the
 * mapping says which end a term speaks to, not how much (`strict` turns any extra field away).
 */
export const mappingEntrySchema = z.object({
    system: z.enum(MAPPING_SYSTEMS),
    term: z.string().min(1),
    axisEnd: z.string().regex(/^[A-E][1-6]\.[AB]$/),
    method: z.enum(MAPPING_METHODS),
    kind: z.enum(MAPPING_KINDS),
}).strict();

export type TraitGroup = typeof TRAIT_GROUPS[number];
export type TraitEnd = z.infer<typeof traitEndSchema>;
export type TraitAxis = z.infer<typeof traitAxisSchema>;
export type ContextKind = typeof CONTEXT_KINDS[number];
export type ContextValue = z.infer<typeof contextValueSchema>;
export type MappingSystem = typeof MAPPING_SYSTEMS[number];
export type MappingEntry = z.infer<typeof mappingEntrySchema>;
