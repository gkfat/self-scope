import {
    describe, expect, it,
} from 'vitest';
import { calculatePillars } from '../../utils/bazi/pillars';
import { analyzeChart } from '../../utils/bazi/analysis';
import { analyzeStrength } from '../../utils/bazi/strength';
import { findMappingIssues } from '../mapping';
import { loadOntology } from '../ontology';
import {
    BAZI_MAPPINGS, BAZI_TERMS, baziTermsOf,
} from './bazi';

const chartOf = (birthDate: string, birthTime: string | null = '10:30') => {
    const pillars = calculatePillars({
        birthDate,
        birthTime,
        standardOffsetMinutes: 480,
        instant: new Date(`${birthDate}T${birthTime ?? '12:00'}:00+08:00`),
    });

    return {
        analysis: analyzeChart(pillars), strength: analyzeStrength(pillars),
    };
};

describe('the BaZi mapping', () => {
    it('is sound: real terms, real ends, the structural method', () => {
        expect(findMappingIssues(BAZI_MAPPINGS, {
            endIds: loadOntology().endIds, terms: { BAZI: BAZI_TERMS },
        })).toEqual([]);
    });

    it('has 10 day masters, 5 + 5 elements, 5 ten-god groups, 5 strengths and 10 patterns as its terms', () => {
        const count = (prefix: string) => BAZI_TERMS.filter((term) => term.startsWith(prefix)).length;

        expect(count('bazi:daymaster:')).toBe(10);
        expect(count('bazi:element:strong:')).toBe(5);
        expect(count('bazi:element:missing:')).toBe(5);
        expect(count('bazi:group:')).toBe(5);
        expect(count('bazi:strength:')).toBe(5);
        expect(count('bazi:pattern:')).toBe(10);
        expect(new Set(BAZI_TERMS).size).toBe(40);
    });

    it('maps every term except a missing element, which is a fact and not a trait', () => {
        const mapped = new Set(BAZI_MAPPINGS.map((entry) => entry.term));
        const unmapped = BAZI_TERMS.filter((term) => !mapped.has(term));

        expect(unmapped.sort()).toEqual(BAZI_TERMS.filter((term) => term.startsWith('bazi:element:missing:')).sort());
    });

    it('does not map the sentences written for the ten gods, the useful gods, the month, the luck or the bone weight', () => {
        for (const term of BAZI_TERMS) {
            expect(term).not.toMatch(/luck|bone|useful|month|tenGod/);
        }
    });

    it('never points a term at the two ends of one axis at once', () => {
        const byTerm = new Map<string, string[]>();

        for (const entry of BAZI_MAPPINGS) {
            byTerm.set(entry.term, [...byTerm.get(entry.term) ?? [], entry.axisEnd.split('.')[0] ?? '']);
        }

        for (const [term, axes] of byTerm) {
            expect(new Set(axes).size, term).toBe(axes.length);
        }
    });
});

describe('baziTermsOf', () => {
    it('gives only terms the mapping knows, for charts across many birth dates', () => {
        for (let year = 1940; year <= 2010; year += 3) {
            for (const month of [
                '02',
                '06',
                '10',
            ]) {
                const {
                    analysis, strength, 
                } = chartOf(`${year}-${month}-14`);

                for (const term of baziTermsOf(analysis, strength)) {
                    expect(BAZI_TERMS, term).toContain(term);
                }
            }
        }
    });

    it('always has the day master, the strength and the pattern', () => {
        const {
            analysis, strength, 
        } = chartOf('1995-03-25');
        const terms = baziTermsOf(analysis, strength);

        expect(terms).toContain(`bazi:daymaster:${analysis.dayMaster.stem}`);
        expect(terms).toContain(`bazi:strength:${strength.level}`);
        expect(terms).toContain(`bazi:pattern:${strength.pattern.key}`);
    });

    it('lists an element as strong only when it clearly leads, and as missing only when it does not appear', () => {
        for (let year = 1960; year <= 2005; year += 5) {
            const {
                analysis, strength, 
            } = chartOf(`${year}-04-09`);
            const terms = baziTermsOf(analysis, strength);

            for (const element of [
                'wood',
                'fire',
                'earth',
                'metal',
                'water',
            ] as const) {
                expect(terms.includes(`bazi:element:missing:${element}`)).toBe(analysis.elementCounts[element] === 0);
            }

            expect(terms.filter((term) => term.startsWith('bazi:element:strong:')).length).toBeLessThanOrEqual(1);
        }
    });
});
