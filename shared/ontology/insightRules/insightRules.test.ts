import {
    describe, expect, it,
} from 'vitest';
import { loadOntology } from '../ontology';
import type { MappingEntry } from '../schema';
import { evaluateInsightRules } from './evaluate';
import { INSIGHT_RULE_EXAMPLES } from './examples';
import { STABLE_MAPPINGS } from '../mappings';
import { INSIGHT_TYPES } from './schema';
import {
    INSIGHT_RULES, INSIGHT_RULES_VERSION,
} from './index';
import {
    insightRuleSchema, type InsightRuleInput,
} from './schema';
import { findInsightRuleIssues } from './validate';

const ontology = loadOntology();
const context = {
    endIds: ontology.endIds, contextIds: new Set(ontology.context.map((value) => value.id)),
};

const rule = (overrides: Partial<InsightRuleInput> = {}): InsightRuleInput => ({
    id: 'test-rule',
    type: 'convergence',
    when: {
        all: [
            {
                end: 'A1.A', minGroups: 2, 
            },
        ], 
    },
    requiresIndependentSources: true,
    template: '兩個不同傳統都指向同一個傾向，可能是你比較穩定的特色。',
    hypothesis: '最近一次需要先想清楚才行動的事，是什麼？',
    ...overrides,
});

const entry = (system: MappingEntry['system'], term: string, axisEnd: string): MappingEntry => ({
    system, term, axisEnd, method: system === 'MBTI' || system === 'BAZI' || system === 'HUMAN_DESIGN' ? 'structural' : 'keyword', kind: system === 'TAROT' ? 'state' : 'trait',
});

const parse = (input: InsightRuleInput) => insightRuleSchema.parse(input);

describe('the shape of a rule', () => {
    it('accepts a sound rule', () => {
        expect(findInsightRuleIssues([rule()], context)).toEqual([]);
    });

    it('turns away a type that is not one of the seven', () => {
        expect(findInsightRuleIssues([rule({ type: 'prophecy' as never })], context).join('\n')).toMatch(/type/);
    });

    it('turns away a rule with a missing field or a field it does not know (a strength, say)', () => {
        const withoutTemplate: Record<string, unknown> = { ...rule() };

        delete withoutTemplate.template;

        expect(findInsightRuleIssues([withoutTemplate], context).join('\n')).toMatch(/template/);
        expect(findInsightRuleIssues([
            {
                ...rule(), strength: 3,
            },
        ], context).join('\n')).toMatch(/not allowed: strength/);
    });

    it('turns away two rules with the same id', () => {
        expect(findInsightRuleIssues([rule(), rule()], context).join('\n')).toMatch(/used more than once/);
    });

    it('turns away an end that does not exist, naming the rule', () => {
        const issues = findInsightRuleIssues([rule({ when: { all: [{ end: 'Z9.A' }] } })], context);

        expect(issues.join('\n')).toMatch(/rule test-rule: .*(Z9\.A|end)/);
    });

    it('turns away a context value that does not exist', () => {
        const issues = findInsightRuleIssues([
            rule({
                type: 'time-extension', contexts: ['time:someday'], requiresIndependentSources: false, when: { all: [{ end: 'A1.A' }] },
            }),
        ], context);

        expect(issues.join('\n')).toMatch(/time:someday is not a context value/);
    });

    it('holds each type to what it is', () => {
        const issues = findInsightRuleIssues([
            rule({
                id: 'tension-one-axis-needed', type: 'tension', when: { all: [{ end: 'A1.A' }, { end: 'B1.B' }] }, requiresIndependentSources: false,
            }),
            rule({
                id: 'interaction-one-axis', type: 'interaction', when: { all: [{ end: 'A1.A' }, { end: 'A1.B' }] }, requiresIndependentSources: false,
            }),
            rule({
                id: 'blind-without-absent', type: 'blindspot', when: { all: [{ end: 'A1.A' }] }, requiresIndependentSources: false,
            }),
            rule({
                id: 'time-without-context', type: 'time-extension', when: { all: [{ end: 'A1.A' }] }, requiresIndependentSources: false,
            }),
            rule({
                id: 'object-with-domain', type: 'object-gap', contexts: ['domain:work'], when: { all: [{ end: 'A1.A' }] }, requiresIndependentSources: false,
            }),
        ], context).join('\n');

        expect(issues).toMatch(/tension-one-axis-needed: a tension rule is the two ends of one axis/);
        expect(issues).toMatch(/interaction-one-axis: an interaction rule joins ends of at least two axes/);
        expect(issues).toMatch(/blind-without-absent: a blindspot rule names the end/);
        expect(issues).toMatch(/time-without-context: a time-extension rule names at least one time value/);
        expect(issues).toMatch(/object-with-domain: a object-gap rule is about object values only/);
    });

    it('turns away a rule that needs an end both present and absent', () => {
        const issues = findInsightRuleIssues([
            rule({
                type: 'blindspot', requiresIndependentSources: false, when: {
                    all: [{ end: 'A1.A' }], absent: ['A1.A'], 
                },
            }),
        ], context);

        expect(issues.join('\n')).toMatch(/both required and required to be absent/);
    });
});

describe('how a rule speaks', () => {
    it('turns away a template that states something as certain, or medical wording, or a hypothesis that is no question', () => {
        const issues = findInsightRuleIssues([
            rule({
                id: 'certain', template: '你一定會成為很有條理的人，這是注定的事情，不會改變。',
            }),
            rule({
                id: 'medical', template: '你可能有焦慮症的傾向，需要找人談一談看看狀況。',
            }),
            rule({
                id: 'no-question', hypothesis: '回想最近一次需要先想清楚的事。',
            }),
        ], context).join('\n');

        expect(issues).toMatch(/certain: "注定" states something as certain/);
        expect(issues).toMatch(/certain: the template has to speak tentatively/);
        expect(issues).toMatch(/medical: "焦慮症" is medical/);
        expect(issues).toMatch(/no-question: the hypothesis is a question/);
    });
});

describe('the rules that are written', () => {
    it('are sound, and the version is a non-empty string', () => {
        expect(findInsightRuleIssues(INSIGHT_RULES, context)).toEqual([]);
        expect(INSIGHT_RULES_VERSION).not.toBe('');
    });
});

describe('when a rule fires', () => {
    // MBTI and the zodiac are different source groups; two zodiac-type signs are the same group (HOROSCOPE is state)
    const mappings = [
        entry('MBTI', 'mbti:ENFP', 'A1.A'),
        entry('ZODIAC', 'zodiac:gemini', 'A1.A'),
        entry('ZODIAC', 'zodiac:aquarius', 'A1.A'),
        entry('BLOOD', 'blood:A', 'A1.B'),
        entry('ZODIAC', 'zodiac:virgo', 'A1.B'),
        entry('BAZI', 'bazi:x', 'A1.A'),
        entry('BAZI', 'bazi:y', 'A1.B'),
        entry('MBTI', 'mbti:ENFP', 'B1.A'),
        entry('TAROT', 'tarot:0:upright', 'A1.A'),
    ];
    const run = (rules: InsightRuleInput[], terms: string[]) => evaluateInsightRules(rules.map(parse), terms, mappings);

    it('does not fire a convergence when the sources are of one source group', () => {
        expect(run([rule()], ['zodiac:gemini', 'zodiac:aquarius'])).toEqual([]);
    });

    it('fires a convergence for sources of two different groups, and says they are independent', () => {
        const [candidate] = run([rule()], ['mbti:ENFP', 'zodiac:gemini']);

        expect(candidate).toMatchObject({
            ruleId: 'test-rule', independent: true,
        });
        expect(candidate?.sources.map((source) => source.system).sort()).toEqual(['MBTI', 'ZODIAC']);
    });

    it('fires a rule that does not need independence on one group, and labels it as the same source', () => {
        const [candidate] = run([
            rule({
                requiresIndependentSources: false, when: { all: [{ end: 'A1.A' }] },
            }),
        ], ['zodiac:gemini', 'zodiac:aquarius']);

        expect(candidate?.independent).toBe(false);
    });

    it('fires a tension when two independent sources lean to opposite ends of one axis', () => {
        const tension = rule({
            id: 'tension-a1', type: 'tension', requiresIndependentSources: true, when: { all: [{ end: 'A1.A' }, { end: 'A1.B' }] },
        });

        expect(run([tension], ['mbti:ENFP', 'blood:A'])).toHaveLength(1);
    });

    it('does not take one tradition saying both ends for a tension between sources', () => {
        const tension = rule({
            id: 'tension-a1', type: 'tension', requiresIndependentSources: true, when: { all: [{ end: 'A1.A' }, { end: 'A1.B' }] },
        });

        expect(run([tension], ['zodiac:gemini', 'zodiac:virgo'])).toEqual([]);
    });

    it('fires a tension inside one system as such, and never for two systems', () => {
        const within = rule({
            id: 'tension-inside', type: 'tension', requiresIndependentSources: false, withinSystem: true, when: { all: [{ end: 'A1.A' }, { end: 'A1.B' }] },
        });

        expect(run([within], ['bazi:x', 'bazi:y'])).toHaveLength(1);
        expect(run([within], ['mbti:ENFP', 'blood:A'])).toEqual([]);
    });

    it('fires a blindspot only while nothing points at the absent end', () => {
        const blind = rule({
            id: 'blind-a1b', type: 'blindspot', requiresIndependentSources: false, when: {
                all: [{ end: 'A1.A' }], absent: ['A1.B'],
            },
        });

        expect(run([blind], ['mbti:ENFP'])).toHaveLength(1);
        expect(run([blind], ['mbti:ENFP', 'blood:A'])).toEqual([]);
    });

    it('fires an interaction only when both ends are there', () => {
        const interaction = rule({
            id: 'inter', type: 'interaction', requiresIndependentSources: false, when: { all: [{ end: 'A1.A' }, { end: 'B1.A' }] },
        });

        expect(run([interaction], ['mbti:ENFP'])).toHaveLength(1);
        expect(run([interaction], ['zodiac:gemini'])).toEqual([]);
    });

    it('never counts a state system as a source', () => {
        expect(run([rule()], ['mbti:ENFP', 'tarot:0:upright'])).toEqual([]);
    });

    it('gives the same candidates in the same order for the same terms', () => {
        const rules = [rule({ id: 'one' }), rule({ id: 'two' })];

        expect(run(rules, ['mbti:ENFP', 'zodiac:gemini']).map((c) => c.ruleId)).toEqual(['one', 'two']);
        expect(run(rules, ['zodiac:gemini', 'mbti:ENFP'])).toEqual(run(rules, ['mbti:ENFP', 'zodiac:gemini']));
    });
});

describe('the rules that are written, one by one', () => {
    it('are 30 to 60, every type among them with 4 to 8 rules', () => {
        expect(INSIGHT_RULES.length).toBeGreaterThanOrEqual(30);
        expect(INSIGHT_RULES.length).toBeLessThanOrEqual(60);

        for (const type of INSIGHT_TYPES) {
            const count = INSIGHT_RULES.filter((item) => item.type === type).length;

            expect(count, type).toBeGreaterThanOrEqual(4);
            expect(count, type).toBeLessThanOrEqual(12);
        }
    });

    it('each has an example, and no example is left over for a rule that is gone', () => {
        expect(Object.keys(INSIGHT_RULE_EXAMPLES).sort()).toEqual(INSIGHT_RULES.map((item) => item.id).sort());
    });

    for (const item of INSIGHT_RULES) {
        it(`${item.id}: fires for its example, and for no smaller set of it`, () => {
            const terms = INSIGHT_RULE_EXAMPLES[item.id] ?? [];

            expect(evaluateInsightRules([item], terms, STABLE_MAPPINGS).map((c) => c.ruleId)).toEqual([item.id]);

            for (const term of terms) {
                expect(evaluateInsightRules([item], terms.filter((other) => other !== term), STABLE_MAPPINGS), `without ${term}`).toEqual([]);
            }
        });
    }

    it('say "same source" for a rule that does not need independence and has only one group behind it', () => {
        const blind = INSIGHT_RULES.find((item) => item.type === 'blindspot');
        const terms = blind ? (INSIGHT_RULE_EXAMPLES[blind.id] ?? []) : [];

        expect(evaluateInsightRules(blind ? [blind] : [], terms, STABLE_MAPPINGS)[0]?.independent).toBe(false);
    });
});
