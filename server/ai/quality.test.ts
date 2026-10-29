import {
    describe, expect, it,
} from 'vitest';
import {
    assessMultiAnalysis, assessSingleAnalysis, parseMultiAnalysisOutput, parseSingleAnalysisOutput,
} from './quality';
import { SINGLE_ANALYSIS_SECTIONS } from '../../shared/schemas/firestore/singleAnalysis.schema';

describe('assessMultiAnalysis', () => {
    const ids = ['convergence-order', 'tension-logic-intuition'];
    const text = '依你的報告來看，你可能傾向把事情安排得清楚，也容易在雜亂的環境裡感到不自在。';
    const section = (kind: 'overview' | 'insight' | 'advice', candidateIds: string[], content = text) => ({
        kind, candidateIds, content, evidence: '依據規則找出的洞見與重點事實',
    });
    const good = () => ({
        sections: [
            section('overview', [ids[0] as string]),
            section('insight', [ids[0] as string]),
            section('insight', [ids[1] as string]),
            section('advice', [ids[1] as string]),
        ],
    });

    it('accepts an overview, one insight for each candidate, and advice, all citing candidates that were found', () => {
        expect(assessMultiAnalysis(good(), ids).fatal).toEqual([]);
    });

    it('rejects a part that cites no candidate', () => {
        const output = good();

        output.sections[3] = section('advice', []);

        expect(assessMultiAnalysis(output, ids).fatal.map((finding) => finding.code)).toContain('NO_CITATION');
    });

    it('rejects a part that cites a candidate that does not exist', () => {
        const output = good();

        output.sections[0] = section('overview', ['made-up']);

        expect(assessMultiAnalysis(output, ids).fatal.map((finding) => finding.code)).toContain('UNKNOWN_CITATION');
    });

    it('rejects a missing insight, a second insight for one candidate, and an insight about two', () => {
        const missing = { sections: good().sections.slice(0, 2).concat(good().sections.slice(3)) };
        const twice = { sections: [...good().sections, section('insight', [ids[0] as string])] };
        const two = { sections: [section('overview', [ids[0] as string]), section('insight', ids)] };

        for (const output of [
            missing,
            twice,
            two,
        ]) {
            expect(assessMultiAnalysis(output, ids).fatal.map((finding) => finding.code)).toContain('STRUCTURE');
        }
    });

    it('rejects diagnosis wording and a percentage, and only warns about absolute wording', () => {
        const diagnosis = good();
        const percent = good();
        const absolute = good();

        diagnosis.sections[1] = section('insight', [ids[0] as string], '你可能罹患憂鬱症，所以比較傾向把事情安排得清楚，也容易感到不自在。');
        percent.sections[1] = section('insight', [ids[0] as string], '你有八成的可能傾向把事情安排得清楚，信心約 80% 左右，也容易感到不自在。');
        absolute.sections[1] = section('insight', [ids[0] as string], '你一定會把事情安排得清楚，也容易在雜亂的環境裡感到不自在，這是你的特色。');

        expect(assessMultiAnalysis(diagnosis, ids).fatal.map((finding) => finding.code)).toContain('DIAGNOSTIC');
        expect(assessMultiAnalysis(percent, ids).fatal.map((finding) => finding.code)).toContain('PERCENT');
        expect(assessMultiAnalysis(absolute, ids).fatal).toEqual([]);
        expect(assessMultiAnalysis(absolute, ids).warnings.map((finding) => finding.code)).toContain('OVERCONFIDENT');
    });
});

describe('assessSingleAnalysis', () => {
    const text = '這是一段內容，說明你可能偏好先觀察再行動，並在熟悉的環境裡更能發揮所長。';
    const good = () => ({
        sections: SINGLE_ANALYSIS_SECTIONS.map((section) => ({
            key: section.key, content: text, evidence: '依據報告裡的事實與面向',
        })),
    });

    it('accepts the four sections in order, each with content and evidence', () => {
        expect(assessSingleAnalysis(good()).fatal).toEqual([]);
    });

    it('rejects a missing, repeated or reordered section', () => {
        const missing = { sections: good().sections.slice(1) };
        const reordered = { sections: [...good().sections].reverse() };

        for (const output of [missing, reordered]) {
            expect(assessSingleAnalysis(output).fatal.map((finding) => finding.code)).toEqual(['STRUCTURE']);
        }
    });

    it('rejects content that is too short, a section without evidence, and diagnosis wording', () => {
        const output = good();

        output.sections[0] = {
            key: output.sections[0]?.key as string, content: '太短', evidence: '依據報告',
        };
        output.sections[1] = {
            key: output.sections[1]?.key as string, content: text, evidence: '',
        };
        output.sections[2] = {
            key: output.sections[2]?.key as string, content: '你可能罹患憂鬱症，所以比較偏好先觀察再行動，也傾向在熟悉的環境裡發揮。', evidence: '依據報告裡的事實',
        };

        expect(assessSingleAnalysis(output).fatal.map((finding) => finding.code).sort()).toEqual([
            'DIAGNOSTIC',
            'NO_EVIDENCE',
            'TOO_SHORT',
        ]);
    });

    it('only warns about absolute wording', () => {
        const output = good();

        output.sections[0] = {
            key: output.sections[0]?.key as string, content: '你一定會先觀察再行動，也傾向在熟悉的環境裡更能發揮所長，這是你的特色。', evidence: '依據報告裡的事實',
        };

        expect(assessSingleAnalysis(output).fatal).toEqual([]);
        expect(assessSingleAnalysis(output).warnings.map((finding) => finding.code)).toEqual(['OVERCONFIDENT']);
    });
});

describe('parsing what the model returned', () => {
    it('gives null for an answer that does not fit the shape, for both kinds of reading', () => {
        expect(parseSingleAnalysisOutput({ sections: 'nope' })).toBeNull();
        expect(parseSingleAnalysisOutput({
            sections: [
                {
                    key: 'unknown', content: 'x', evidence: 'y', 
                },
            ], 
        })).toBeNull();
        expect(parseMultiAnalysisOutput({})).toBeNull();
        expect(parseMultiAnalysisOutput({
            sections: [
                {
                    kind: 'insight', candidateIds: ['a'], content: 'x', evidence: 'y', 
                },
            ], 
        })).not.toBeNull();
    });
});
