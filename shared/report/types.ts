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
    /** Shown first, in an overview of its own, instead of among the facts it reads (the reading of the sign itself) */
    overview?: boolean;
    /** Shown first, as a quote at the head of the overview of a draw (a state system) */
    lead?: boolean;
    /** The heading of the group of readings it is shown in, ahead of the others (a reading with none is shown among the facts) */
    group?: string;
    /** The label of the fact this reads ("太陽星座"): the reading is then shown inside that fact's card */
    factLabel?: string;
};

/**
 * What we conclude from several facts of the system at once (where the bodies gather, the mix of elements): shown among
 * the conclusions of the report, marked as ours, always with the facts it rests on.
 */
export type ReportInference = {
    /** What was found, in a few words (it cannot hold a colon: the text is told from it at the first one) */
    title: string;
    text: string;
    /** The part of the report it is shown in, under a heading of its own (otherwise with the conclusions about the traits) */
    group?: { key: string; title: string };
    /** What kind of sentence it is: our own conclusion (the default), or the tradition's words gathered from its readings */
    kind?: 'SYSTEM_INTERPRETATION' | 'AI_INFERENCE';
    /** What it rests on: the labels of the facts, or a plain description of them */
    basedOn: readonly string[];
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
    /** Conclusions drawn from the facts together, by rule (not by the tradition of the system) */
    inferences?: readonly ReportInference[];
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
