import type { AnalysisBasis } from '../schemas/analysisBasis.schema';
import type { MappingSystem } from '../ontology/schema';

/** A fact the system itself worked out, in the system's own words: "上升：天蠍座", "日主：甲木". */
export type ReportFact = {
    label: string;
    value: string;
    /** The mapping term this fact is, when it is one: only a fact with a term can ground an inference */
    term?: string;
};

/** What the tradition of the system says about a fact, taken from the reviewed fixed readings. */
export type ReportInterpretation = {
    title: string;
    text: string;
    term?: string;
};

/** Something that depends on the date it was made for: a luck cycle, a year number. */
export type ReportTimeFact = {
    text: string;
    /** YYYY-MM-DD the sentence was made for */
    asOf: string;
    term?: string;
    /** A reading the tradition gives of the time (not a calculated fact) */
    reading?: boolean;
};

/**
 * What a system hands to the report: where the member stands, the facts and their readings, the terms the mapping
 * works on, and the things the report must say about its limits. A system writes only this; the order of the blocks,
 * the grounding of every inference and the map of effects are the same for all of them.
 */
export type SystemReportInput = {
    system: MappingSystem;
    /** The one-line conclusion, e.g. "太陽天蠍座" */
    position: string;
    facts: readonly ReportFact[];
    interpretations: readonly ReportInterpretation[];
    /** Terms of the system for this member (from the `*TermsOf` functions) */
    traits: readonly string[];
    timeFacts?: readonly ReportTimeFact[];
    /** Advice from the reviewed fixed readings */
    advice: readonly string[];
    /** What is missing or limits the report, e.g. that a birth time would add the houses */
    notes?: readonly string[];
    disclaimer: string;
    basis: readonly AnalysisBasis[];
};
