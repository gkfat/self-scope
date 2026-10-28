import {
    ALL_MAPPINGS, STABLE_MAPPINGS, STATE_MAPPINGS, TERM_REGISTRY, 
} from '../shared/ontology/mappings/index.ts';
import {
    ACKNOWLEDGED_UNSOURCED_ENDS, computeCoverage, findCoverageIssues, findMappingIssues, findStableMappingIssues, isStateSystem, MAPPING_VERSION, 
} from '../shared/ontology/mapping.ts';
import {
    loadOntology, ONTOLOGY_VERSION, 
} from '../shared/ontology/ontology.ts';
import { MAPPING_SYSTEMS } from '../shared/ontology/schema.ts';

/**
 * The trait ontology and its mapping, checked and reported: the data files are sound, how much of each system's
 * vocabulary is mapped, how many sources each end of an axis has. Exits with 1 when anything is wrong.
 * Run it with `pnpm ontology:check`.
 */
const ontology = loadOntology();
const issues = [
    ...findMappingIssues(ALL_MAPPINGS, {
        endIds: ontology.endIds, terms: TERM_REGISTRY,
    }), ...findStableMappingIssues(STABLE_MAPPINGS),
];

const report = computeCoverage(STABLE_MAPPINGS, TERM_REGISTRY, ontology.endIds);

issues.push(...findCoverageIssues(report));

const percent = (part: number, whole: number) => (whole === 0 ? '-' : `${Math.round((part / whole) * 100)}%`);

console.log(`ontology ${ONTOLOGY_VERSION}, mapping ${MAPPING_VERSION}: ${ontology.axes.length} axes, ${ontology.endIds.size} ends, ${ontology.context.length} context values`);
console.log(`${STABLE_MAPPINGS.length} trait entries, ${STATE_MAPPINGS.length} state entries\n`);

console.log('Terms mapped, trait systems:');

for (const system of MAPPING_SYSTEMS.filter((s) => !isStateSystem(s))) {
    const coverage = report.perSystem[system];

    if (!coverage) continue;

    console.log(`  ${system.padEnd(13)} ${String(coverage.mapped).padStart(3)}/${String(coverage.total).padEnd(3)} ${percent(coverage.mapped, coverage.total)}`);
}

console.log(`  ${'overall'.padEnd(13)} ${percent(Math.round(report.overall * 1000), 1000)}\n`);

console.log('Terms mapped, state systems (held against the stable traits, not part of the coverage):');

for (const system of MAPPING_SYSTEMS.filter((s) => isStateSystem(s))) {
    const terms = TERM_REGISTRY[system] ?? [];
    const mapped = new Set(STATE_MAPPINGS.filter((entry) => entry.system === system).map((entry) => entry.term));

    console.log(`  ${system.padEnd(13)} ${String(mapped.size).padStart(3)}/${String(terms.length).padEnd(3)} ${percent(mapped.size, terms.length)}`);
}

console.log('\nUnmapped terms, trait systems (left out where the reading names no axis end):');

for (const [system, coverage] of Object.entries(report.perSystem)) {
    if (!coverage || coverage.unmapped.length === 0) continue;

    console.log(`  ${system}: ${coverage.unmapped.join(', ')}`);
}

console.log('\nSources per end (fewest first):');

const bySources = Object.entries(report.endSources).sort(([a, x], [b, y]) => x - y || a.localeCompare(b));

for (const [id, count] of bySources.slice(0, 16)) {
    console.log(`  ${id.padEnd(5)} ${count}${ACKNOWLEDGED_UNSOURCED_ENDS.includes(id) ? '  (acknowledged: no source)' : ''}`);
}

if (issues.length > 0) {
    console.error(`\n${issues.length} problem(s):`);

    for (const issue of issues) console.error(`  - ${issue}`);

    process.exit(1);
}

console.log('\nOK');
