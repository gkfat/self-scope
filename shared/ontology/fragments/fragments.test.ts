import {
    describe, expect, it,
} from 'vitest';
import { TRAIT_AXES } from '../axes';
import { CONTEXT_VALUES } from '../context';
import { loadOntology } from '../ontology';
import {
    COVERAGE_TARGETS, FRAGMENT_TABLE,
} from './index';
import {
    FRAGMENT_VERSION, MAX_FRAGMENT_LENGTH, MIN_OBJECT_FRAGMENTS_PER_END,
    computeFragmentCoverage, findFragmentCoverageIssues, findFragmentIssues, findTextIssues,
    findTimeTemplateIssues, findTraitEnd, lookupFragment, timeTemplate, type FragmentTable,
} from './fragments';

const ontology = loadOntology();
const context = {
    endIds: ontology.endIds,
    contextKinds: new Map(CONTEXT_VALUES.map((value) => [value.id, value.kind] as const)),
};
const issuesOf = (table: FragmentTable) => findFragmentIssues(table, context).join('\n');

describe('lookupFragment', () => {
    const table: FragmentTable = {
        'A1.A': {
            'object:partner': '遇到摩擦時傾向先釐清事實與原因，再談感受。',
            'time:future': { text: '若一直不調整，可能越想越多而錯過時機；可以提早練習先行動。' },
        },
    };

    it('gives the written sentence of a pair', () => {
        expect(lookupFragment(table, 'A1.A', 'object:partner')).toEqual({ text: '遇到摩擦時傾向先釐清事實與原因，再談感受。' });
    });

    it('gives null for a pair with no sentence, and borrows nothing from a neighbour', () => {
        expect(lookupFragment(table, 'A1.A', 'object:family')).toBeNull();
        expect(lookupFragment(table, 'A1.A', 'domain:work')).toBeNull();
        expect(lookupFragment(table, 'A1.B', 'object:partner')).toBeNull();
        expect(lookupFragment(table, 'Z9.A', 'object:partner')).toBeNull();
    });

    it('prefers a written time sentence to the template, and uses the template when there is none', () => {
        expect(lookupFragment(table, 'A1.A', 'time:future')?.text).toMatch(/越想越多/);
        expect(lookupFragment(table, 'A1.A', 'time:present')?.text).toMatch(/日常裡，你傾向拆解事情/);
        expect(lookupFragment(table, 'A1.B', 'time:past')?.confirmQuestion).toMatch(/直覺感受/);
    });
});

describe('findFragmentIssues', () => {
    it('accepts a sound sentence', () => {
        expect(issuesOf({ 'A1.A': { 'object:partner': '遇到摩擦時傾向先釐清事實與原因，再談感受。' } })).toBe('');
    });

    it('turns away a key that names no end or no context value', () => {
        expect(issuesOf({ 'Z9.A': { 'object:partner': '遇到摩擦時傾向先釐清事實與原因，再談感受。' } })).toMatch(/Z9\.A: not an end of any axis/);
        expect(issuesOf({ 'A1.A': { 'object:alien': '遇到摩擦時傾向先釐清事實與原因，再談感受。' } })).toMatch(/object:alien: not a context value/);
    });

    it('turns away a text that is empty, too short or too long', () => {
        expect(issuesOf({ 'A1.A': { 'object:self': '' } })).toMatch(/empty or too short/);
        expect(issuesOf({ 'A1.A': { 'object:self': '太短' } })).toMatch(/empty or too short/);
        expect(issuesOf({ 'A1.A': { 'object:self': '長'.repeat(MAX_FRAGMENT_LENGTH + 1) } })).toMatch(/more than/);
    });

    it('turns away a past sentence without a confirmation question', () => {
        expect(issuesOf({ 'A1.A': { 'time:past': '你可能比較早就習慣把事情拆開來想。' } })).toMatch(/needs a confirmation question/);
        expect(issuesOf({
            'A1.A': {
                'time:past': {
                    text: '你可能比較早就習慣把事情拆開來想。', confirmQuestion: '回頭看，你是否常把事情拆開來想？',
                },
            },
        })).toBe('');
    });

    it('turns away a past sentence that is not a guess, even with a question', () => {
        expect(issuesOf({
            'A1.A': {
                'time:past': {
                    text: '你從小就習慣把事情拆開來想，所以老師很喜歡你。', confirmQuestion: '回頭看，你是否常把事情拆開來想？',
                },
            },
        })).toMatch(/has to be a guess/);
    });

    it('turns away a future sentence that predicts an event or states a certainty', () => {
        expect(issuesOf({ 'A1.A': { 'time:future': '你明年一定會換工作，因為你受不了拖延。' } })).toMatch(/tendency|certain/);
        expect(issuesOf({ 'A1.A': { 'time:future': '若不調整，你必定會錯過重要的機會，請提早準備。' } })).toMatch(/"必定" states the future as certain/);
        expect(issuesOf({ 'A1.A': { 'time:future': '若一直不調整，可能越想越多而錯過時機；可以提早練習先行動。' } })).toBe('');
    });

    it('turns away medical, legal and financial wording in any sentence', () => {
        expect(issuesOf({ 'A1.A': { 'object:self': '你的焦慮需要靠治療與藥物才能慢慢好起來。' } })).toMatch(/medical, legal or financial/);
        expect(issuesOf({ 'A1.A': { 'object:colleague': '你很會判斷哪一檔股票值得長期投資與持有。' } })).toMatch(/"股票"|"投資"/);
        expect(issuesOf({ 'A1.A': { 'object:family': '家裡有糾紛時你傾向先找法律依據來處理爭議。' } })).toMatch(/"法律"/);
    });
});

describe('the time templates', () => {
    it('give a past guess with a question, a present tendency and a future that can be prepared for, for every end', () => {
        expect(findTimeTemplateIssues()).toEqual([]);
    });

    it('are built from the end itself', () => {
        const end = findTraitEnd('A1.A');

        expect(end?.name).toBe('分析邏輯');
        expect(timeTemplate(end!, 'time:future')?.text).toContain('想太多、遲遲不動');
        expect(timeTemplate(end!, 'time:past')?.text).toContain('可能');
        expect(timeTemplate(end!, 'object:self')).toBeNull();
    });

    it('stay within the length of a written sentence', () => {
        for (const axis of TRAIT_AXES) {
            for (const end of [axis.a, axis.b]) {
                for (const timeId of [
                    'time:past',
                    'time:present',
                    'time:future',
                ]) {
                    expect(timeTemplate(end, timeId)?.text.length ?? 0).toBeLessThanOrEqual(MAX_FRAGMENT_LENGTH);
                }
            }
        }
    });
});

describe('the coverage of fragments', () => {
    const coverageOf = (count: number): FragmentTable => ({
        'A1.A': Object.fromEntries([
            'self',
            'partner',
            'family',
            'friend',
        ].slice(0, count).map((name) => [`object:${name}`, '遇到摩擦時傾向先釐清事實與原因，再談感受。'])), 
    });

    it('counts object and domain sentences of every end', () => {
        const coverage = computeFragmentCoverage({
            'A1.A': {
                'object:self': '遇到摩擦時傾向先釐清事實與原因，再談感受。',
                'domain:work': '討論工作時會追問依據，常被當成把事情講清楚的人。',
                'time:future': '若一直不調整，可能越想越多而錯過時機。',
            },
        });

        expect(coverage['A1.A']).toEqual({
            object: 1, domain: 1,
        });
        expect(Object.keys(coverage)).toHaveLength(56);
    });

    it('lists an end short of the lower bound, with how many it has', () => {
        const issues = findFragmentCoverageIssues(computeFragmentCoverage(coverageOf(2)), {
            object: ['THINKING'], domain: [],
        }).join('\n');

        expect(issues).toMatch(/end A1\.A has 2 object sentences, at least 3/);
        expect(issues).toMatch(/end A6\.B has 0 object sentences/);
    });

    it('passes an end with enough, and asks only for the groups the phase has reached', () => {
        const issues = findFragmentCoverageIssues(computeFragmentCoverage(coverageOf(3)), {
            object: [], domain: [],
        });

        expect(issues).toEqual([]);
        expect(MIN_OBJECT_FRAGMENTS_PER_END).toBe(3);
    });
});

describe('the written fragments', () => {
    it('are sound: real ends, real context values, within the rules', () => {
        expect(findFragmentIssues(FRAGMENT_TABLE, context)).toEqual([]);
    });

    it('reach the lower bound in every group the phase has reached', () => {
        expect(findFragmentCoverageIssues(computeFragmentCoverage(FRAGMENT_TABLE), COVERAGE_TARGETS)).toEqual([]);
    });

    it('give every one of the 56 ends a sentence for each of the 10 objects and each of the 10 domains', () => {
        const coverage = computeFragmentCoverage(FRAGMENT_TABLE);

        expect(Object.keys(coverage)).toHaveLength(56);

        for (const [id, counts] of Object.entries(coverage)) {
            expect(counts, id).toEqual({
                object: 10, domain: 10,
            });
        }
    });

    it('have a version', () => {
        expect(FRAGMENT_VERSION).toMatch(/\S/);
    });

    it('never say a sentence twice', () => {
        const texts = Object.values(FRAGMENT_TABLE).flatMap((byContext) => Object.values(byContext).map((entry) => (typeof entry === 'string' ? entry : entry.text)));

        expect(new Set(texts).size).toBe(texts.length);
    });

    it('have the findTextIssues helper agree with the table check', () => {
        expect(findTextIssues({ text: '遇到摩擦時傾向先釐清事實與原因，再談感受。' }, 'object:partner', 'x')).toEqual([]);
    });
});
