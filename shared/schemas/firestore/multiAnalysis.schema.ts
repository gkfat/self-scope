import { z } from 'zod';
import { snapshotSystemSchema } from './reportSnapshot.schema';

/** The kinds of part the AI writes for a multi-dimension report; an insight is about exactly one candidate. */
export const MULTI_ANALYSIS_SECTION_KINDS = [
    'overview',
    'insight',
    'advice',
] as const;

export const MULTI_ANALYSIS_KIND_TITLES: Readonly<Record<typeof MULTI_ANALYSIS_SECTION_KINDS[number], string>> = {
    overview: '整體畫像',
    insight: '洞見',
    advice: '建議與反思',
};

/** What the rules found, as the model gets it: an id to cite, the rule's own wording and the facts behind it. */
export const multiCandidateSchema = z.object({
    id: z.string().min(1),
    /** The rule's sentence, with its kind and whether its sources are independent */
    text: z.string().min(1),
    /** What the member can check against their life */
    hypothesis: z.string().min(1),
    /** The terms (facts) that made the rule fire */
    sources: z.array(z.string().min(1)),
});

/**
 * Everything the model may know: the systems, where the member stands in each, the facts picked out, and the candidates
 * the insight rules found. It holds no free text from the member, so nothing in it can carry instructions.
 */
export const multiAnalysisInputSchema = z.object({
    systems: z.array(snapshotSystemSchema).min(2),
    positions: z.array(z.string().min(1)).min(2),
    facts: z.array(z.string().min(1)),
    candidates: z.array(multiCandidateSchema).min(1),
    notes: z.array(z.string().min(1)),
});

/** What the model returns; the checks on length and on what is cited come after parsing. */
export const multiAnalysisOutputSchema = z.object({
    sections: z.array(z.object({
        kind: z.enum(MULTI_ANALYSIS_SECTION_KINDS),
        /** The candidates this part rests on, by id */
        candidateIds: z.array(z.string()),
        content: z.string(),
        /** Which of the given facts or candidates it rests on, in plain words */
        evidence: z.string(),
    })),
});

export type MultiCandidate = z.infer<typeof multiCandidateSchema>;
export type MultiAnalysisInput = z.infer<typeof multiAnalysisInputSchema>;
export type MultiAnalysisOutput = z.infer<typeof multiAnalysisOutputSchema>;
