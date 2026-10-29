import { SOURCE_GROUPS } from '../mapping';
import type {
    MappingEntry, MappingSystem,
} from '../schema';
import type {
    InsightRule, InsightType,
} from './schema';

/** One term of the member pointing at one end, with the system it comes from. */
export type InsightSource = {
    system: MappingSystem;
    term: string;
    axisEnd: string;
};

/** A rule that fired for this member: what it says, and the facts that made it fire. */
export type InsightCandidate = {
    ruleId: string;
    type: InsightType;
    template: string;
    hypothesis: string;
    contexts: string[];
    /** A tension the system itself makes (it points at both ends): marked apart from a tension between sources */
    withinSystem: boolean;
    /** Whether the sources behind it come from at least two source groups; "same source" otherwise. Never a number. */
    independent: boolean;
    sources: InsightSource[];
};

const groupOf = (source: InsightSource) => SOURCE_GROUPS[source.system];

/** True when each set can be given a group of its own, different from every other set's. */
function haveDistinctGroups(sets: ReadonlyArray<ReadonlySet<string>>, taken: ReadonlySet<string> = new Set()): boolean {
    const [first, ...rest] = sets;

    if (!first) return true;

    return [...first].some((group) => !taken.has(group) && haveDistinctGroups(rest, new Set([...taken, group])));
}

/**
 * The rules that fire for a member. Only the stable mapping counts (a state of today never feeds a rule), and a source
 * is a term of the member that the mapping points at an end. Deterministic: the same terms give the same candidates
 * in the order of the rules.
 */
export function evaluateInsightRules(
    rules: readonly InsightRule[],
    memberTerms: readonly string[],
    mappings: readonly MappingEntry[],
): InsightCandidate[] {
    const terms = new Set(memberTerms);
    const sourcesByEnd = new Map<string, InsightSource[]>();

    for (const entry of mappings) {
        if (entry.kind !== 'trait' || !terms.has(entry.term)) continue;

        const list = sourcesByEnd.get(entry.axisEnd) ?? [];

        list.push({
            system: entry.system, term: entry.term, axisEnd: entry.axisEnd,
        });
        sourcesByEnd.set(entry.axisEnd, list);
    }

    return rules.flatMap((rule): InsightCandidate[] => {
        const supports = rule.when.all.map((condition) => sourcesByEnd.get(condition.end) ?? []);

        if (rule.when.absent.some((end) => (sourcesByEnd.get(end) ?? []).length > 0)) return [];

        // Inside one system: every condition must be met by the same system, and only that system's terms count
        let used = supports;

        if (rule.withinSystem) {
            const system = [...new Set(supports.flat().map((source) => source.system))].find((candidate) => supports.every((list) => list.some((source) => source.system === candidate)));

            if (!system) return [];

            used = supports.map((list) => list.filter((source) => source.system === system));
        }

        const met = rule.when.all.every((condition, index) => new Set((used[index] ?? []).map(groupOf)).size >= condition.minGroups);

        if (!met) return [];

        const groupSets = used.map((list) => new Set(list.map(groupOf)));
        // One condition: the groups behind that end. Several: the conditions can be met by different groups.
        const independent = rule.when.all.length === 1 ? (groupSets[0]?.size ?? 0) >= 2 : haveDistinctGroups(groupSets);

        if (rule.requiresIndependentSources && !independent) return [];

        const seen = new Set<string>();
        const sources = used.flat().filter((source) => {
            const key = `${source.term}|${source.axisEnd}`;

            if (seen.has(key)) return false;
            seen.add(key);

            return true;
        });

        return [
            {
                ruleId: rule.id,
                type: rule.type,
                template: rule.template,
                hypothesis: rule.hypothesis,
                contexts: rule.contexts,
                withinSystem: rule.withinSystem,
                independent,
                sources,
            },
        ];
    });
}
