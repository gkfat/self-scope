import {
    describe, expect, it,
} from 'vitest';
import {
    ACKNOWLEDGED_UNSOURCED_ENDS, MAPPING_VERSION, SOURCE_GROUPS, computeCoverage, findCoverageIssues, findMappingIssues, findStableMappingIssues,
} from './mapping';
import {
    MAPPING_SYSTEMS, type MappingEntry, 
} from './schema';

const endIds = new Set([
    'A1.A',
    'A1.B',
    'B1.A',
    'B1.B',
]);

const terms = {
    ZODIAC: ['zodiac:aries', 'zodiac:taurus'],
    HUMAN_DESIGN: ['hd:type:PROJECTOR'],
    TAROT: ['tarot:0'],
};

const entry = (overrides: Partial<MappingEntry> = {}): MappingEntry => ({
    system: 'ZODIAC',
    term: 'zodiac:aries',
    axisEnd: 'A1.A',
    method: 'keyword',
    kind: 'trait',
    ...overrides,
});

describe('findMappingIssues', () => {
    it('accepts an entry with a real term and a real end', () => {
        expect(findMappingIssues([entry()], {
            endIds, terms,
        })).toEqual([]);
    });

    it('turns away an end that is not on any axis', () => {
        expect(findMappingIssues([entry({ axisEnd: 'C1.A' })], {
            endIds, terms,
        }).join('\n')).toMatch(/C1\.A is not an end of any axis/);
    });

    it('turns away a term the system does not have', () => {
        expect(findMappingIssues([entry({ term: 'zodiac:ophiuchus' })], {
            endIds, terms,
        }).join('\n')).toMatch(/not a term of ZODIAC/);
    });

    it('turns away a strength or a confidence', () => {
        expect(findMappingIssues([
            {
                ...entry(), weight: 0.8,
            },
        ], {
            endIds, terms,
        }).join('\n')).toMatch(/not allowed: weight/);
        expect(findMappingIssues([
            {
                ...entry(), confidence: 'high',
            },
        ], {
            endIds, terms,
        }).join('\n')).toMatch(/not allowed: confidence/);
    });

    it('requires the structural method for human design and the keyword method for the zodiac', () => {
        expect(findMappingIssues([
            entry({
                system: 'HUMAN_DESIGN', term: 'hd:type:PROJECTOR', method: 'keyword',
            }),
        ], {
            endIds, terms,
        }).join('\n')).toMatch(/structural method/);
        expect(findMappingIssues([entry({ method: 'structural' })], {
            endIds, terms,
        }).join('\n')).toMatch(/keyword method/);
    });

    it('marks a state system as a state and a trait system as a trait', () => {
        expect(findMappingIssues([
            entry({
                system: 'TAROT', term: 'tarot:0', kind: 'trait',
            }),
        ], {
            endIds, terms,
        }).join('\n')).toMatch(/of kind state/);
        expect(findMappingIssues([entry({ kind: 'state' })], {
            endIds, terms,
        }).join('\n')).toMatch(/of kind trait/);
    });

    it('turns away the same mapping listed twice', () => {
        expect(findMappingIssues([entry(), entry()], {
            endIds, terms,
        }).join('\n')).toMatch(/more than once/);
    });
});

describe('findStableMappingIssues', () => {
    it('turns away a tarot entry put into the stable trait mapping', () => {
        const tarot = entry({
            system: 'TAROT', term: 'tarot:0', kind: 'state',
        });

        expect(findStableMappingIssues([tarot]).join('\n')).toMatch(/state of today/);
        expect(findStableMappingIssues([entry()])).toEqual([]);
    });
});

describe('computeCoverage', () => {
    it('counts mapped terms per system and the sources of every end', () => {
        const report = computeCoverage([
            entry(),
            entry({
                term: 'zodiac:taurus', axisEnd: 'A1.A',
            }),
            entry({
                system: 'HUMAN_DESIGN', term: 'hd:type:PROJECTOR', method: 'structural', axisEnd: 'B1.B',
            }),
        ], terms, endIds);

        expect(report.perSystem.ZODIAC).toEqual({
            total: 2, mapped: 2, unmapped: [],
        });
        expect(report.endSources['A1.A']).toBe(2);
        expect(report.uncoveredEnds.sort()).toEqual(['A1.B', 'B1.A']);
    });

    it('leaves a state system out of the coverage and the sources of the stable ends', () => {
        const report = computeCoverage([
            entry({
                system: 'TAROT', term: 'tarot:0', kind: 'state',
            }),
        ], terms, endIds);

        expect(report.perSystem.TAROT).toBeUndefined();
        expect(report.endSources['A1.A']).toBe(0);
    });
});

describe('findCoverageIssues', () => {
    it('passes when enough is mapped and every end has a source', () => {
        const report = computeCoverage(
            [
                entry(),
                entry({
                    term: 'zodiac:taurus', axisEnd: 'A1.B',
                }),
                entry({
                    system: 'HUMAN_DESIGN', term: 'hd:type:PROJECTOR', method: 'structural', axisEnd: 'B1.A',
                }),
                entry({
                    term: 'zodiac:aries', axisEnd: 'B1.B',
                }),
            ],
            terms,
            endIds,
        );

        expect(findCoverageIssues(report, 0.8, [])).toEqual([]);
    });

    it('lists the ends without a source and the terms left unmapped', () => {
        const report = computeCoverage([entry()], terms, endIds);
        const issues = findCoverageIssues(report).join('\n');

        expect(issues).toMatch(/end A1\.B has no mapping/);
        expect(issues).toMatch(/only 33% of the terms are mapped/);
        expect(issues).toMatch(/ZODIAC zodiac:taurus/);
    });
});

describe('acknowledged ends without a source', () => {
    it('are not reported as missing, while any other end without a source still is', () => {
        const report = computeCoverage([entry()], terms, endIds);
        const issues = findCoverageIssues(report, 0, ['A1.B']).join('\n');

        expect(issues).not.toMatch(/end A1\.B has no mapping/);
        expect(issues).toMatch(/end B1\.A has no mapping/);
    });

    it('turn into a problem the day a mapping names them, so the list cannot go stale', () => {
        const report = computeCoverage([entry()], terms, endIds);

        expect(findCoverageIssues(report, 0, ['A1.A']).join('\n')).toMatch(/take it off ACKNOWLEDGED_UNSOURCED_ENDS/);
    });

    it('are three ends of the axes', () => {
        expect([...ACKNOWLEDGED_UNSOURCED_ENDS].sort()).toEqual([
            'A6.B',
            'E4.B',
            'E6.B',
        ]);
    });
});

describe('source groups and version', () => {
    it('puts the zodiac and the sign horoscope in one group and gives every system a group', () => {
        expect(SOURCE_GROUPS.ZODIAC).toBe(SOURCE_GROUPS.HOROSCOPE);

        for (const system of MAPPING_SYSTEMS) {
            expect(SOURCE_GROUPS[system]).toMatch(/\S/);
        }
    });

    it('has a version', () => {
        expect(MAPPING_VERSION).toMatch(/\S/);
    });
});
