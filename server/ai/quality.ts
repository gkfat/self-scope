import {
    REPORT_SECTIONS, aiReportOutputSchema,
    type AiReportOutput,
} from '../../shared/schemas/firestore/detailedReport.schema';

/**
 * Checks on a report before it is shown (FR-017, NFR-007, NFR-013).
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
const DIAGNOSTIC_PATTERN = /(診斷|確診|罹患|患有|病症|疾病|精神疾|人格障礙|憂鬱症|躁鬱|焦慮症|強迫症|過動症|自閉症|思覺失調|創傷後壓力|醫師建議|服用藥|藥物治療|心理治療)/;

/** Absolute wording that contradicts "this is only a reading of the data". */
const OVERCONFIDENT_PATTERN = /(一定會|絕對(會|是|不)|必然|百分之百|肯定(會|是)|毫無疑問|永遠不會)/;

const MIN_CONTENT_LENGTH = 30;
const MIN_EVIDENCE_LENGTH = 4;

function sentences(text: string): string[] {
    return text
        .split(/[。！？!?\n]/)
        .map((sentence) => sentence.trim())
        .filter((sentence) => sentence.length >= 12);
}

export function assessReport(output: AiReportOutput): QualityReport {
    const fatal: QualityFinding[] = [];
    const warnings: QualityFinding[] = [];
    const expected = REPORT_SECTIONS.map((section) => section.key);
    const actual = output.sections.map((section) => section.key);

    if (actual.length !== expected.length || expected.some((key, index) => actual[index] !== key)) {
        fatal.push({
            code: 'STRUCTURE',
            detail: `sections must be exactly ${expected.join(', ')} in order`,
        });

        return {
            fatal, warnings,
        };
    }

    const seen = new Map<string, string>();

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

        const text = `${section.content}\n${section.evidence}`;

        if (DIAGNOSTIC_PATTERN.test(text)) {
            fatal.push({
                code: 'DIAGNOSTIC', section: section.key, detail: 'contains diagnosis or medical wording',
            });
        }

        if (OVERCONFIDENT_PATTERN.test(section.content)) {
            warnings.push({
                code: 'OVERCONFIDENT', section: section.key, detail: 'absolute wording',
            });
        }

        for (const sentence of sentences(section.content)) {
            const first = seen.get(sentence);

            if (first && first !== section.key) {
                warnings.push({
                    code: 'REPEATED', section: section.key, detail: `same sentence as ${first}`,
                });
            } else if (!first) {
                seen.set(sentence, section.key);
            }
        }
    }

    // Reading everything as fact, or everything as guesswork, both suggest the model ignored the instruction.
    const kinds = new Set(output.sections.map((section) => section.evidenceKind));

    if (kinds.size === 1) {
        warnings.push({
            code: 'UNIFORM_EVIDENCE_KIND', detail: `every section is ${[...kinds][0]}`,
        });
    }

    return {
        fatal, warnings,
    };
}

/** Parse untrusted model output into the report shape; null when it does not fit. */
export function parseReportOutput(value: unknown): AiReportOutput | null {
    const parsed = aiReportOutputSchema.safeParse(value);

    return parsed.success ? parsed.data : null;
}
