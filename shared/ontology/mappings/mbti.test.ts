import {
    describe, expect, it,
} from 'vitest';
import { MBTI_TYPES } from '../../schemas/common';
import { findMappingIssues } from '../mapping';
import { loadOntology } from '../ontology';
import {
    MBTI_MAPPINGS, MBTI_TERMS, mbtiTermsOf,
} from './mbti';

describe('the MBTI mapping', () => {
    it('is sound: real terms, real ends, the structural method', () => {
        expect(findMappingIssues(MBTI_MAPPINGS, {
            endIds: loadOntology().endIds, terms: { MBTI: MBTI_TERMS },
        })).toEqual([]);
    });

    it('has the eight sides of the four pairs as its terms, and every one is mapped', () => {
        expect([...MBTI_TERMS].sort()).toEqual([
            'mbti:EI:E',
            'mbti:EI:I',
            'mbti:JP:J',
            'mbti:JP:P',
            'mbti:SN:N',
            'mbti:SN:S',
            'mbti:TF:F',
            'mbti:TF:T',
        ]);

        const mapped = new Set(MBTI_MAPPINGS.map((entry) => entry.term));

        for (const term of MBTI_TERMS) {
            expect(mapped.has(term)).toBe(true);
        }
    });

    it('points the two sides of a pair at opposite ends of the same axes', () => {
        const ends = (term: string) => MBTI_MAPPINGS.filter((entry) => entry.term === term).map((entry) => entry.axisEnd);
        const axisOf = (end: string) => end.split('.')[0];

        for (const [first, second] of [
            ['mbti:EI:E', 'mbti:EI:I'],
            ['mbti:SN:S', 'mbti:SN:N'],
            ['mbti:JP:J', 'mbti:JP:P'],
        ] as const) {
            expect(ends(first).map(axisOf).sort()).toEqual(ends(second).map(axisOf).sort());
        }

        for (const axisEnd of ends('mbti:SN:S')) {
            expect(ends('mbti:SN:N')).not.toContain(axisEnd);
        }
    });

    it('does not read the feeling preference as emotional sensitivity', () => {
        expect(MBTI_MAPPINGS.filter((entry) => entry.term === 'mbti:TF:F').map((entry) => entry.axisEnd)).not.toContain('C1.A');
    });
});

describe('mbtiTermsOf', () => {
    it('gives the four terms of a result', () => {
        expect(mbtiTermsOf('INTJ')).toEqual([
            'mbti:EI:I',
            'mbti:SN:N',
            'mbti:TF:T',
            'mbti:JP:J',
        ]);
    });

    it('only gives terms the mapping knows, for all sixteen types', () => {
        for (const type of MBTI_TYPES) {
            for (const term of mbtiTermsOf(type)) {
                expect(MBTI_TERMS).toContain(term);
            }
        }
    });
});
