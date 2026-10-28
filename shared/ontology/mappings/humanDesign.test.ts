import {
    describe, expect, it,
} from 'vitest';
import { CHANNELS } from '../../constants/humanDesign';
import { calculateHumanDesign } from '../../../server/humanDesign/calculate';
import { findMappingIssues } from '../mapping';
import { loadOntology } from '../ontology';
import {
    HUMAN_DESIGN_MAPPINGS, HUMAN_DESIGN_TERMS, humanDesignTermsOf,
} from './humanDesign';

describe('the human design mapping', () => {
    it('is sound: real terms, real ends, the structural method', () => {
        expect(findMappingIssues(HUMAN_DESIGN_MAPPINGS, {
            endIds: loadOntology().endIds, terms: { HUMAN_DESIGN: HUMAN_DESIGN_TERMS },
        })).toEqual([]);
    });

    it('has the 5 types, 7 authorities, 9 centers and 36 channels as its terms', () => {
        const count = (prefix: string) => HUMAN_DESIGN_TERMS.filter((term) => term.startsWith(prefix)).length;

        expect(count('hd:type:')).toBe(5);
        expect(count('hd:authority:')).toBe(7);
        expect(count('hd:center:')).toBe(9);
        expect(count('hd:channel:')).toBe(36);
        expect(new Set(HUMAN_DESIGN_TERMS).size).toBe(57);
    });

    it('names exactly the channels the chart can have, lower gate first', () => {
        const fromChart = CHANNELS.map(([a, b]) => `hd:channel:${Math.min(a, b)}-${Math.max(a, b)}`).sort();

        expect(HUMAN_DESIGN_TERMS.filter((term) => term.startsWith('hd:channel:')).sort()).toEqual(fromChart);
    });

    it('leaves out on purpose only the terms it says it leaves out', () => {
        const mapped = new Set(HUMAN_DESIGN_MAPPINGS.map((entry) => entry.term));
        const unmapped = HUMAN_DESIGN_TERMS.filter((term) => !mapped.has(term));

        for (const term of [
            'hd:type:PROJECTOR',
            'hd:authority:MENTAL',
            'hd:center:HEAD:defined',
            'hd:center:THROAT:defined',
            'hd:center:G:defined',
        ]) {
            expect(unmapped).toContain(term);
        }

        // Most of the vocabulary does carry a meaning for a trait
        expect(mapped.size).toBeGreaterThan(HUMAN_DESIGN_TERMS.length * 0.7);
    });

    it('never points a term at the two ends of one axis at once', () => {
        const byTerm = new Map<string, string[]>();

        for (const entry of HUMAN_DESIGN_MAPPINGS) {
            byTerm.set(entry.term, [...byTerm.get(entry.term) ?? [], entry.axisEnd.split('.')[0] ?? '']);
        }

        for (const [term, axes] of byTerm) {
            expect(new Set(axes).size, term).toBe(axes.length);
        }
    });
});

describe('humanDesignTermsOf', () => {
    it('gives only terms the mapping knows, for charts across many birth dates', () => {
        for (let year = 1940; year <= 2010; year += 5) {
            const chart = calculateHumanDesign(`${year}-06-15`, '10:30', 'Asia/Taipei');

            for (const term of humanDesignTermsOf(chart)) {
                expect(HUMAN_DESIGN_TERMS, term).toContain(term);
            }
        }
    });

    it('lists the type, the authority, each defined center and each complete channel', () => {
        const chart = calculateHumanDesign('1995-03-25', '14:30', 'Asia/Taipei');
        const terms = humanDesignTermsOf(chart);

        expect(terms).toContain(`hd:type:${chart.type}`);
        expect(terms).toContain(`hd:authority:${chart.authority}`);
        expect(terms.filter((term) => term.startsWith('hd:center:'))).toHaveLength(chart.definedCenters.length);
        expect(terms.filter((term) => term.startsWith('hd:channel:'))).toHaveLength(chart.channels.length);
    });
});
