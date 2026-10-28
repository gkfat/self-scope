import {
    MAPPING_SYSTEMS, STATE_SYSTEMS, mappingEntrySchema,
    type MappingEntry, type MappingSystem,
} from './schema';

/** Raise whenever a mapping entry is added, removed or pointed at another end; it is stored with every report (basis). */
export const MAPPING_VERSION = 'mapping-v1';

/**
 * Systems of one tradition share a source group. Two systems of the same group saying the same thing are one source
 * saying it twice, not two sources agreeing, and a report must not present it as independent support.
 */
export const SOURCE_GROUPS: Readonly<Record<MappingSystem, string>> = {
    ZODIAC: 'western-astrology',
    HOROSCOPE: 'western-astrology',
    BAZI: 'chinese-metaphysics',
    HUMAN_DESIGN: 'human-design',
    MBTI: 'questionnaire',
    NUMEROLOGY: 'numerology',
    MAYA_KIN: 'dreamspell',
    BLOOD: 'blood-type-folklore',
    TAROT: 'tarot',
    RUNE: 'rune',
};

/** MBTI, human design and BaZi are mapped by rules over their structure; the rest by what a term is known to stand for. */
export const METHOD_BY_SYSTEM: Readonly<Record<MappingSystem, MappingEntry['method']>> = {
    MBTI: 'structural',
    HUMAN_DESIGN: 'structural',
    BAZI: 'structural',
    ZODIAC: 'keyword',
    BLOOD: 'keyword',
    NUMEROLOGY: 'keyword',
    MAYA_KIN: 'keyword',
    TAROT: 'keyword',
    RUNE: 'keyword',
    HOROSCOPE: 'keyword',
};

export const isStateSystem = (system: MappingSystem): boolean => (STATE_SYSTEMS as readonly string[]).includes(system);

/** The terms each system really has (its enumerations and constants), which a mapping entry may refer to. */
export type TermRegistry = Readonly<Partial<Record<MappingSystem, readonly string[]>>>;

type MappingContext = {
    /** Every end of every axis, e.g. "A1.A" */
    endIds: ReadonlySet<string>;
    terms: TermRegistry;
};

/** Everything wrong with a list of mapping entries, as plain sentences; empty when it is sound. */
export function findMappingIssues(entries: readonly unknown[], context: MappingContext): string[] {
    const issues: string[] = [];
    const seen = new Set<string>();

    entries.forEach((raw, index) => {
        const parsed = mappingEntrySchema.safeParse(raw);
        const label = (raw as Partial<MappingEntry> | null)?.term ?? `#${index}`;

        if (!parsed.success) {
            for (const issue of parsed.error.issues) {
                // Extra fields (a strength, a confidence) are reported by name
                const detail = issue.code === 'unrecognized_keys' ? `not allowed: ${issue.keys.join(', ')}` : `${issue.path.join('.')}: ${issue.message}`;

                issues.push(`mapping ${label}: ${detail}`);
            }

            return;
        }

        const entry = parsed.data;
        const key = `${entry.system}|${entry.term}|${entry.axisEnd}`;

        if (seen.has(key)) issues.push(`mapping ${entry.system} ${entry.term} -> ${entry.axisEnd} is listed more than once`);
        seen.add(key);

        if (!context.endIds.has(entry.axisEnd)) {
            issues.push(`mapping ${entry.system} ${entry.term}: ${entry.axisEnd} is not an end of any axis`);
        }

        if (!context.terms[entry.system]?.includes(entry.term)) {
            issues.push(`mapping ${entry.system} ${entry.term}: not a term of ${entry.system}`);
        }

        if (entry.method !== METHOD_BY_SYSTEM[entry.system]) {
            issues.push(`mapping ${entry.system} ${entry.term}: ${entry.system} is mapped by the ${METHOD_BY_SYSTEM[entry.system]} method`);
        }

        const expectedKind = isStateSystem(entry.system) ? 'state' : 'trait';

        if (entry.kind !== expectedKind) {
            issues.push(`mapping ${entry.system} ${entry.term}: ${entry.system} entries are of kind ${expectedKind}`);
        }
    });

    return issues;
}

/** What must hold for entries that feed the stable trait mapping: none of them is a state. */
export function findStableMappingIssues(entries: readonly MappingEntry[]): string[] {
    return entries
        .filter((entry) => entry.kind === 'state' || isStateSystem(entry.system))
        .map((entry) => `mapping ${entry.system} ${entry.term}: ${entry.system} describes a state of today and cannot be part of the stable trait mapping`);
}

export type SystemCoverage = {
    total: number;
    mapped: number;
    unmapped: string[];
};

export type CoverageReport = {
    /** Trait systems only: a state system is never mapped onto the stable axes */
    perSystem: Partial<Record<MappingSystem, SystemCoverage>>;
    /** Share of the terms of all trait systems that have at least one mapping */
    overall: number;
    /** How many mapping entries point at each end */
    endSources: Readonly<Record<string, number>>;
    /** Ends no trait mapping points at */
    uncoveredEnds: string[];
};

/** How much of each system's vocabulary is mapped, and how many sources each end of an axis has. */
export function computeCoverage(entries: readonly MappingEntry[], terms: TermRegistry, endIds: ReadonlySet<string>): CoverageReport {
    const traitEntries = entries.filter((entry) => entry.kind === 'trait');
    const perSystem: Partial<Record<MappingSystem, SystemCoverage>> = {};
    let total = 0;
    let mapped = 0;

    for (const system of MAPPING_SYSTEMS.filter((s) => !isStateSystem(s))) {
        const systemTerms = terms[system] ?? [];
        const used = new Set(traitEntries.filter((entry) => entry.system === system).map((entry) => entry.term));
        const unmapped = systemTerms.filter((term) => !used.has(term));

        perSystem[system] = {
            total: systemTerms.length,
            mapped: systemTerms.length - unmapped.length,
            unmapped,
        };
        total += systemTerms.length;
        mapped += systemTerms.length - unmapped.length;
    }

    const endSources: Record<string, number> = Object.fromEntries([...endIds].map((id) => [id, 0]));

    for (const entry of traitEntries) {
        if (entry.axisEnd in endSources) endSources[entry.axisEnd] = (endSources[entry.axisEnd] ?? 0) + 1;
    }

    return {
        perSystem,
        overall: total === 0 ? 0 : mapped / total,
        endSources,
        uncoveredEnds: Object.entries(endSources).filter(([, count]) => count === 0).map(([id]) => id),
    };
}

/**
 * Lower bound of the share of terms that must be mapped. 80%, not higher: a term is left unmapped on purpose where its
 * reading says nothing an axis end describes, and a bound that forced every term onto an end would force guesses.
 */
export const MIN_OVERALL_COVERAGE = 0.8;

/**
 * Ends that no system's reading names in so many words, and that are therefore left without a source rather than
 * given a stretched one: practical function over beauty (A6.B), content with what one has (E4.B) and sharing the load
 * lightly (E6.B). A report that meets one of them draws no conclusion from it. Take an end off this list the day a
 * mapping really names it; the check fails when an end on the list has a source, so the list cannot go stale.
 */
export const ACKNOWLEDGED_UNSOURCED_ENDS: readonly string[] = [
    'A6.B',
    'E4.B',
    'E6.B',
];

/** What the coverage report says is missing: ends without a source that are not acknowledged, or too few terms mapped. */
export function findCoverageIssues(
    report: CoverageReport,
    minOverall: number = MIN_OVERALL_COVERAGE,
    acknowledged: readonly string[] = ACKNOWLEDGED_UNSOURCED_ENDS,
): string[] {
    const issues = report.uncoveredEnds
        .filter((id) => !acknowledged.includes(id))
        .map((id) => `end ${id} has no mapping pointing at it`);

    for (const id of acknowledged) {
        if (!report.uncoveredEnds.includes(id)) {
            issues.push(`end ${id} is listed as having no source but a mapping points at it: take it off ACKNOWLEDGED_UNSOURCED_ENDS`);
        }
    }

    if (report.overall < minOverall) {
        const unmapped = Object.entries(report.perSystem).flatMap(([system, coverage]) => (coverage?.unmapped ?? []).map((term) => `${system} ${term}`));

        issues.push(`only ${Math.round(report.overall * 100)}% of the terms are mapped (at least ${Math.round(minOverall * 100)}%); unmapped: ${unmapped.join(', ')}`);
    }

    return issues;
}
