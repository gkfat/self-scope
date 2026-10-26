import {
    describe, expect, it,
} from 'vitest';
import {
    assessReport, parseReportOutput,
} from './quality';
import {
    REPORT_SECTIONS, type AiReportOutput,
} from '../../shared/schemas/firestore/detailedReport.schema';

const body = (index: number) => `這是第 ${index} 段的內容，說明你可能偏好先觀察再行動，並在熟悉的環境裡更能發揮。`;

function goodReport(): AiReportOutput {
    return {
        sections: REPORT_SECTIONS.map((section, index) => ({
            key: section.key,
            content: body(index),
            evidence: '依據你的 MBTI 結果與外向內向傾向',
            evidenceKind: index % 2 === 0 ? 'OBSERVED' : 'INFERRED',
        })),
    };
}

describe('assessReport', () => {
    it('accepts a well-formed report', () => {
        expect(assessReport(goodReport())).toEqual({
            fatal: [], warnings: [],
        });
    });

    it('rejects a report with a missing, extra or misordered section', () => {
        const missing = goodReport();
        missing.sections.pop();
        expect(assessReport(missing).fatal[0]?.code).toBe('STRUCTURE');

        const swapped = goodReport();
        [swapped.sections[0], swapped.sections[1]] = [swapped.sections[1], swapped.sections[0]] as AiReportOutput['sections'];
        expect(assessReport(swapped).fatal[0]?.code).toBe('STRUCTURE');
    });

    it('rejects sections that are too short or cite nothing', () => {
        const report = goodReport();
        report.sections[2] = {
            ...report.sections[2]!, content: '太短', evidence: '',
        };

        const codes = assessReport(report).fatal.map((finding) => finding.code);

        expect(codes).toContain('TOO_SHORT');
        expect(codes).toContain('NO_EVIDENCE');
    });

    it.each([
        '這樣的人格特質可能代表憂鬱症的傾向，建議留意。',
        '你被診斷為焦慮的機率很高，需要醫師建議。',
        '這是一種人格障礙的表現，可能需要藥物治療。',
    ])('rejects diagnostic wording: %s', (sentence) => {
        const report = goodReport();
        report.sections[1] = {
            ...report.sections[1]!, content: `${body(1)}${sentence}`,
        };

        expect(assessReport(report).fatal.map((finding) => finding.code)).toContain('DIAGNOSTIC');
    });

    it('also catches diagnostic wording hidden in the evidence field', () => {
        const report = goodReport();
        report.sections[3] = {
            ...report.sections[3]!, evidence: '依據他可能罹患的症狀',
        };

        expect(assessReport(report).fatal.map((finding) => finding.code)).toContain('DIAGNOSTIC');
    });

    it('only warns about overconfident wording, so a report is not thrown away for it', () => {
        const report = goodReport();
        report.sections[4] = {
            ...report.sections[4]!, content: `${body(4)}你一定會在感情中遇到合適的人。`,
        };

        const result = assessReport(report);

        expect(result.fatal).toEqual([]);
        expect(result.warnings.map((finding) => finding.code)).toContain('OVERCONFIDENT');
    });

    it('warns when the same sentence is repeated in two sections', () => {
        const report = goodReport();
        const repeated = '你在做決定時傾向先蒐集足夠的資訊再行動。';
        report.sections[1] = {
            ...report.sections[1]!, content: `${body(1)}${repeated}`,
        };
        report.sections[5] = {
            ...report.sections[5]!, content: `${body(5)}${repeated}`,
        };

        expect(assessReport(report).warnings.map((finding) => finding.code)).toContain('REPEATED');
    });

    it('warns when every section claims the same kind of evidence', () => {
        const report = goodReport();
        report.sections = report.sections.map((section) => ({
            ...section, evidenceKind: 'INFERRED' as const,
        }));

        expect(assessReport(report).warnings.map((finding) => finding.code)).toContain('UNIFORM_EVIDENCE_KIND');
    });
});

describe('parseReportOutput', () => {
    it('accepts the report shape and rejects anything else', () => {
        expect(parseReportOutput(goodReport())).not.toBeNull();
        expect(parseReportOutput({ sections: [{ key: 'overview' }] })).toBeNull();
        expect(parseReportOutput({
            sections: [
                {
                    key: 'not-a-section', content: 'x', evidence: 'y', evidenceKind: 'OBSERVED',
                },
            ], 
        })).toBeNull();
        expect(parseReportOutput('text')).toBeNull();
        expect(parseReportOutput(null)).toBeNull();
    });
});
