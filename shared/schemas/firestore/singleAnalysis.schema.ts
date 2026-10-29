import { z } from 'zod';
import { snapshotSystemSchema } from './reportSnapshot.schema';

/** The sections of the AI analysis of one system, in the order they are shown. */
export const SINGLE_ANALYSIS_SECTIONS = [
    {
        key: 'overview', title: '整體畫像',
    },
    {
        key: 'strengths', title: '可能的優勢',
    },
    {
        key: 'watchouts', title: '要留意的地方',
    },
    {
        key: 'practice', title: '可以試試的做法',
    },
] as const;

const sectionKeySchema = z.enum(SINGLE_ANALYSIS_SECTIONS.map((section) => section.key) as [string, ...string[]]);

/**
 * Everything the model may know: the facts the system worked out and the facets the rules found, as sentences of the
 * member's own report. It holds no free text from the member, so nothing in it can carry instructions.
 */
export const singleAnalysisInputSchema = z.object({
    system: snapshotSystemSchema,
    position: z.string().min(1),
    facts: z.array(z.string().min(1)),
    facets: z.array(z.string().min(1)),
    notes: z.array(z.string().min(1)),
});

/** What the model returns (length rules are checked after parsing). */
export const singleAnalysisOutputSchema = z.object({
    sections: z.array(z.object({
        key: sectionKeySchema,
        content: z.string(),
        /** Which of the given facts or facets the statements rest on, in plain words */
        evidence: z.string(),
    })),
});

export type SingleAnalysisInput = z.infer<typeof singleAnalysisInputSchema>;
export type SingleAnalysisOutput = z.infer<typeof singleAnalysisOutputSchema>;
