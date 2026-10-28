import {
    describe, expect, it,
} from 'vitest';
import {
    ACKNOWLEDGED_UNSOURCED_ENDS, MIN_OVERALL_COVERAGE, computeCoverage, findCoverageIssues,
} from './mapping';
import {
    STABLE_MAPPINGS, TERM_REGISTRY,
} from './mappings';
import { loadOntology } from './ontology';
import { MAPPING_SYSTEMS } from './schema';

const report = computeCoverage(STABLE_MAPPINGS, TERM_REGISTRY, loadOntology().endIds);

describe('the coverage of the real mapping', () => {
    it('reaches the lower bound and leaves no end without a source but the acknowledged ones', () => {
        expect(findCoverageIssues(report)).toEqual([]);
        expect(report.overall).toBeGreaterThanOrEqual(MIN_OVERALL_COVERAGE);
        expect([...report.uncoveredEnds].sort()).toEqual([...ACKNOWLEDGED_UNSOURCED_ENDS].sort());
    });

    it('counts every term of the seven trait systems, and none of the three state systems', () => {
        const traitSystems = MAPPING_SYSTEMS.filter((system) => ![
            'TAROT',
            'RUNE',
            'HOROSCOPE',
        ].includes(system));

        expect(Object.keys(report.perSystem).sort()).toEqual([...traitSystems].sort());

        const total = Object.values(report.perSystem).reduce((sum, coverage) => sum + (coverage?.total ?? 0), 0);

        expect(total).toBe(traitSystems.reduce((sum, system) => sum + (TERM_REGISTRY[system]?.length ?? 0), 0));
    });

    it('gives every end of every axis a count, so a dropped end cannot go unnoticed', () => {
        expect(Object.keys(report.endSources)).toHaveLength(56);
    });

    it('would fail if the mapping lost a system', () => {
        const withoutBazi = computeCoverage(STABLE_MAPPINGS.filter((entry) => entry.system !== 'BAZI'), TERM_REGISTRY, loadOntology().endIds);

        expect(withoutBazi.overall).toBeLessThan(report.overall);
        expect(findCoverageIssues(withoutBazi, 0.99).join('\n')).toMatch(/of the terms are mapped/);
    });
});
