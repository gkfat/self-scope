import {
    multiAnalysisOutputSchema, type MultiAnalysisOutput,
} from '../../shared/schemas/firestore/multiAnalysis.schema';
import {
    SINGLE_ANALYSIS_SECTIONS, singleAnalysisOutputSchema, type SingleAnalysisOutput,
} from '../../shared/schemas/firestore/singleAnalysis.schema';

/**
 * Checks on an AI reading before it is shown (FR-017, NFR-007, NFR-013).
 * `fatal` problems make the report unusable (it is failed and refunded);
 * `warnings` are only counted, so quality can be watched without blocking users.
 */
export type QualityFinding = {
    code: string;
    section?: string;
    detail: string;
};

export type QualityReport = {
    fatal: QualityFinding[];
    warnings: QualityFinding[];
};

/** Wording that reads as a diagnosis or medical claim. A heuristic net, not a guarantee. */
export const DIAGNOSTIC_PATTERN = /(診斷|確診|罹患|患有|病症|疾病|精神疾|人格障礙|憂鬱症|躁鬱|焦慮症|強迫症|過動症|自閉症|思覺失調|創傷後壓力|醫師建議|服用藥|藥物治療|心理治療)/;

/** Absolute wording that contradicts "this is only a reading of the data". */
export const OVERCONFIDENT_PATTERN = /(一定會|絕對(會|是|不)|必然|百分之百|肯定(會|是)|毫無疑問|永遠不會)/;

const MIN_CONTENT_LENGTH = 30;
const MIN_EVIDENCE_LENGTH = 4;

/** The same checks for the AI analysis of one system: the four sections in order, each long enough and with its evidence. */
export function assessSingleAnalysis(output: SingleAnalysisOutput): QualityReport {
    const fatal: QualityFinding[] = [];
    const warnings: QualityFinding[] = [];
    const expected = SINGLE_ANALYSIS_SECTIONS.map((section) => section.key as string);
    const actual = output.sections.map((section) => section.key as string);

    if (actual.length !== expected.length || expected.some((key, index) => actual[index] !== key)) {
        fatal.push({
            code: 'STRUCTURE', detail: `sections must be exactly ${expected.join(', ')} in order`,
        });

        return {
            fatal, warnings,
        };
    }

    for (const section of output.sections) {
        if ([...section.content].length < MIN_CONTENT_LENGTH) {
            fatal.push({
                code: 'TOO_SHORT', section: section.key, detail: 'content is too short to be a real analysis',
            });
        }

        if ([...section.evidence.trim()].length < MIN_EVIDENCE_LENGTH) {
            fatal.push({
                code: 'NO_EVIDENCE', section: section.key, detail: 'a section must say what it rests on',
            });
        }

        if (DIAGNOSTIC_PATTERN.test(`${section.content}\n${section.evidence}`)) {
            fatal.push({
                code: 'DIAGNOSTIC', section: section.key, detail: 'contains diagnosis or medical wording',
            });
        }

        if (OVERCONFIDENT_PATTERN.test(section.content)) {
            warnings.push({
                code: 'OVERCONFIDENT', section: section.key, detail: 'absolute wording',
            });
        }
    }

    return {
        fatal, warnings,
    };
}

/** Parse untrusted model output into the analysis shape; null when it does not fit. */
export function parseSingleAnalysisOutput(value: unknown): SingleAnalysisOutput | null {
    const parsed = singleAnalysisOutputSchema.safeParse(value);

    return parsed.success ? parsed.data : null;
}

/**
 * The checks on the AI's rewriting of a multi-dimension report: every part cites candidates, and only candidates that the
 * rules really found; every candidate gets its own insight; there is one overview. A part that cites nothing, or a
 * candidate that does not exist, makes the whole answer unusable.
 */
export function assessMultiAnalysis(output: MultiAnalysisOutput, candidateIds: readonly string[]): QualityReport {
    const fatal: QualityFinding[] = [];
    const warnings: QualityFinding[] = [];
    const known = new Set(candidateIds);

    if (output.sections.filter((section) => section.kind === 'overview').length !== 1) {
        fatal.push({
            code: 'STRUCTURE', detail: 'exactly one overview is expected',
        });
    }

    const insightIds = output.sections.filter((section) => section.kind === 'insight').flatMap((section) => section.candidateIds);

    for (const id of candidateIds) {
        if (insightIds.filter((cited) => cited === id).length !== 1) {
            fatal.push({
                code: 'STRUCTURE', detail: `candidate ${id} needs exactly one insight`,
            });
        }
    }

    output.sections.forEach((section, index) => {
        const label = `${section.kind}#${index}`;

        if (section.candidateIds.length === 0) {
            fatal.push({
                code: 'NO_CITATION', section: label, detail: 'a part has to cite the candidate it rests on',
            });
        }

        if (section.candidateIds.some((id) => !known.has(id))) {
            fatal.push({
                code: 'UNKNOWN_CITATION', section: label, detail: 'a part cites a candidate that was not found',
            });
        }

        if (section.kind === 'insight' && section.candidateIds.length !== 1) {
            fatal.push({
                code: 'STRUCTURE', section: label, detail: 'an insight is about exactly one candidate',
            });
        }

        if ([...section.content].length < MIN_CONTENT_LENGTH) {
            fatal.push({
                code: 'TOO_SHORT', section: label, detail: 'content is too short to be a real analysis',
            });
        }

        if ([...section.evidence.trim()].length < MIN_EVIDENCE_LENGTH) {
            fatal.push({
                code: 'NO_EVIDENCE', section: label, detail: 'a part must say what it rests on',
            });
        }

        if (DIAGNOSTIC_PATTERN.test(`${section.content}\n${section.evidence}`)) {
            fatal.push({
                code: 'DIAGNOSTIC', section: label, detail: 'contains diagnosis or medical wording',
            });
        }

        if (PERCENT_PATTERN.test(section.content)) {
            fatal.push({
                code: 'PERCENT', section: label, detail: 'shows a percentage, which says how strong something is and the report gives no such number',
            });
        }

        if (OVERCONFIDENT_PATTERN.test(section.content)) {
            warnings.push({
                code: 'OVERCONFIDENT', section: label, detail: 'absolute wording',
            });
        }
    });

    return {
        fatal, warnings,
    };
}

/** Parse untrusted model output into the multi-dimension analysis shape; null when it does not fit. */
export function parseMultiAnalysisOutput(value: unknown): MultiAnalysisOutput | null {
    const parsed = multiAnalysisOutputSchema.safeParse(value);

    return parsed.success ? parsed.data : null;
}

/** A report does not say how strong or how sure something is as a number or a share. */
const PERCENT_PATTERN = /(%|％|百分之)/;
