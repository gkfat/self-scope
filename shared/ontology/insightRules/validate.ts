import {
    ASSERTION_WORDS, FORBIDDEN_ADVICE_WORDS,
} from '../fragments/fragments';
import {
    insightRuleSchema, type InsightRule,
} from './schema';

/** A rule speaks tentatively: it has to say "might", "tends to", not "is". */
const HEDGE_WORDS: readonly string[] = [
    '可能',
    '傾向',
    '也許',
    '或許',
    '容易',
    '不一定',
];

type RuleContext = {
    /** Every end of every axis, e.g. "A1.A" */
    endIds: ReadonlySet<string>;
    /** Every context value, e.g. "time:future" */
    contextIds: ReadonlySet<string>;
};

/** The kind of context value each type is about; a type not listed takes none. */
const CONTEXT_KIND_OF_TYPE: Readonly<Partial<Record<InsightRule['type'], string>>> = {
    'context-difference': 'domain',
    'object-gap': 'object',
    'time-extension': 'time',
};

const axisOf = (end: string) => end.slice(0, 2);

/** Everything wrong with a list of insight rules, as plain sentences; empty when it is sound. */
export function findInsightRuleIssues(rules: readonly unknown[], context: RuleContext): string[] {
    const issues: string[] = [];
    const seen = new Set<string>();

    rules.forEach((raw, index) => {
        const label = (raw as { id?: unknown } | null)?.id;
        const name = typeof label === 'string' ? label : `#${index}`;
        const parsed = insightRuleSchema.safeParse(raw);

        if (!parsed.success) {
            for (const issue of parsed.error.issues) {
                const detail = issue.code === 'unrecognized_keys' ? `not allowed: ${issue.keys.join(', ')}` : `${issue.path.join('.')}: ${issue.message}`;

                issues.push(`rule ${name}: ${detail}`);
            }

            return;
        }

        const rule = parsed.data;

        if (seen.has(rule.id)) issues.push(`rule id ${rule.id} is used more than once`);
        seen.add(rule.id);

        for (const word of FORBIDDEN_ADVICE_WORDS) {
            if (rule.template.includes(word) || rule.hypothesis.includes(word)) issues.push(`rule ${rule.id}: "${word}" is medical, legal or financial wording`);
        }

        for (const word of ASSERTION_WORDS) {
            if (rule.template.includes(word)) issues.push(`rule ${rule.id}: "${word}" states something as certain`);
        }

        if (!HEDGE_WORDS.some((word) => rule.template.includes(word))) issues.push(`rule ${rule.id}: the template has to speak tentatively (${HEDGE_WORDS.join('、')})`);
        if (!rule.hypothesis.includes('？')) issues.push(`rule ${rule.id}: the hypothesis is a question the member can answer`);

        const referenced = [...rule.when.all.map((condition) => condition.end), ...rule.when.absent];

        for (const end of referenced) {
            if (!context.endIds.has(end)) issues.push(`rule ${rule.id}: ${end} is not an end of any axis`);
        }

        const conditionEnds = rule.when.all.map((condition) => condition.end);

        if (new Set(conditionEnds).size !== conditionEnds.length) issues.push(`rule ${rule.id}: the same end is a condition more than once`);

        const overlap = rule.when.absent.filter((end) => conditionEnds.includes(end));

        if (overlap.length > 0) issues.push(`rule ${rule.id}: ${overlap.join(', ')} is both required and required to be absent`);

        for (const contextId of rule.contexts) {
            if (!context.contextIds.has(contextId)) issues.push(`rule ${rule.id}: ${contextId} is not a context value`);
        }

        const contextKind = CONTEXT_KIND_OF_TYPE[rule.type];

        if (contextKind && rule.contexts.length === 0) issues.push(`rule ${rule.id}: a ${rule.type} rule names at least one ${contextKind} value`);
        if (contextKind && rule.contexts.some((id) => !id.startsWith(`${contextKind}:`))) issues.push(`rule ${rule.id}: a ${rule.type} rule is about ${contextKind} values only`);
        if (!contextKind && rule.contexts.length > 0) issues.push(`rule ${rule.id}: a ${rule.type} rule takes no context value`);

        // What each type needs to be that type
        if (rule.type === 'convergence' && !(rule.when.all.length === 1 && (rule.requiresIndependentSources || (rule.when.all[0]?.minGroups ?? 1) >= 2))) {
            issues.push(`rule ${rule.id}: a convergence rule is one end that independent sources point at`);
        }

        if (rule.type === 'tension') {
            const [first, second] = conditionEnds;
            const bothEndsOfOneAxis = conditionEnds.length === 2 && first !== undefined && second !== undefined && axisOf(first) === axisOf(second);

            if (!bothEndsOfOneAxis) issues.push(`rule ${rule.id}: a tension rule is the two ends of one axis`);
        }

        if (rule.type === 'interaction' && new Set(conditionEnds.map(axisOf)).size < 2) issues.push(`rule ${rule.id}: an interaction rule joins ends of at least two axes`);
        if (rule.type === 'blindspot' && rule.when.absent.length === 0) issues.push(`rule ${rule.id}: a blindspot rule names the end that nothing points at`);
        if (rule.withinSystem && rule.requiresIndependentSources) issues.push(`rule ${rule.id}: a rule about one system cannot need independent sources`);
        if (rule.withinSystem && rule.type !== 'tension') issues.push(`rule ${rule.id}: only a tension can be inside one system`);
    });

    return issues;
}
