import {
    describe, expect, it,
} from 'vitest';
import {
    BLOOD_TYPES, NUMEROLOGY_NUMBERS, ZODIACS, 
} from '../../schemas/common';
import { kinOf } from '../../utils/mayaKin';
import { lifePathNumber } from '../../utils/numerology';
import { findMappingIssues } from '../mapping';
import { loadOntology } from '../ontology';
import type {
    MappingEntry, MappingSystem,
} from '../schema';
import {
    BLOOD_MAPPINGS, BLOOD_TERMS, bloodTermsOf,
} from './blood';
import {
    MAYA_KIN_MAPPINGS, MAYA_KIN_TERMS, mayaKinTermsOf,
} from './mayaKin';
import {
    NUMEROLOGY_MAPPINGS, NUMEROLOGY_TERMS, numerologyTermsOf,
} from './numerology';
import {
    ZODIAC_MAPPINGS, ZODIAC_TERMS, zodiacTermsOf,
} from './zodiac';

const systems: Array<[MappingSystem, readonly string[], readonly MappingEntry[], number]> = [
    [
        'ZODIAC',
        ZODIAC_TERMS,
        ZODIAC_MAPPINGS,
        12,
    ],
    [
        'BLOOD',
        BLOOD_TERMS,
        BLOOD_MAPPINGS,
        4,
    ],
    [
        'NUMEROLOGY',
        NUMEROLOGY_TERMS,
        NUMEROLOGY_MAPPINGS,
        12,
    ],
    [
        'MAYA_KIN',
        MAYA_KIN_TERMS,
        MAYA_KIN_MAPPINGS,
        33,
    ],
];

describe.each(systems)('the %s mapping', (system, terms, mappings, termCount) => {
    it('is sound: real terms, real ends, the keyword method', () => {
        expect(findMappingIssues(mappings, {
            endIds: loadOntology().endIds, terms: { [system]: terms },
        })).toEqual([]);
        expect(mappings.every((entry) => entry.system === system && entry.method === 'keyword')).toBe(true);
    });

    it(`has ${termCount} terms, all different`, () => {
        expect(terms).toHaveLength(termCount);
        expect(new Set(terms).size).toBe(termCount);
    });

    it('never points a term at the two ends of one axis at once', () => {
        const byTerm = new Map<string, string[]>();

        for (const entry of mappings) {
            byTerm.set(entry.term, [...byTerm.get(entry.term) ?? [], entry.axisEnd.split('.')[0] ?? '']);
        }

        for (const [term, axes] of byTerm) {
            expect(new Set(axes).size, term).toBe(axes.length);
        }
    });
});

describe('the zodiac, blood type and numerology mappings', () => {
    it('map every term', () => {
        for (const [terms, mappings] of [
            [ZODIAC_TERMS, ZODIAC_MAPPINGS],
            [BLOOD_TERMS, BLOOD_MAPPINGS],
            [NUMEROLOGY_TERMS, NUMEROLOGY_MAPPINGS],
        ] as const) {
            const mapped = new Set(mappings.map((entry) => entry.term));

            expect(terms.filter((term) => !mapped.has(term))).toEqual([]);
        }
    });

    it('give a sign, a blood type and a life path number a term each', () => {
        for (const sign of ZODIACS) expect(ZODIAC_TERMS).toContain(zodiacTermsOf(sign)[0]);
        for (const type of BLOOD_TYPES.filter((t) => t !== 'UNKNOWN')) expect(BLOOD_TERMS).toContain(bloodTermsOf(type)[0]);
        for (const number of NUMEROLOGY_NUMBERS) expect(NUMEROLOGY_TERMS).toContain(numerologyTermsOf(number)[0]);

        expect(bloodTermsOf('UNKNOWN')).toEqual([]);
    });

    it('know every life path number a birth date can give', () => {
        for (let year = 1930; year <= 2020; year += 1) {
            expect(NUMEROLOGY_TERMS).toContain(numerologyTermsOf(lifePathNumber(`${year}-07-19`))[0]);
        }
    });
});

describe('the Maya Kin mapping', () => {
    it('has 20 seals and 13 tones, and maps most of them', () => {
        expect(MAYA_KIN_TERMS.filter((term) => term.startsWith('kin:seal:'))).toHaveLength(20);
        expect(MAYA_KIN_TERMS.filter((term) => term.startsWith('kin:tone:'))).toHaveLength(13);

        const mapped = new Set(MAYA_KIN_MAPPINGS.map((entry) => entry.term));

        expect(mapped.size).toBeGreaterThan(MAYA_KIN_TERMS.length / 2);
    });

    it('gives the seal and the tone of every Kin as terms it knows', () => {
        for (let year = 1900; year <= 2100; year += 7) {
            for (const term of mayaKinTermsOf(kinOf(`${year}-03-14`))) {
                expect(MAYA_KIN_TERMS).toContain(term);
            }
        }
    });
});
