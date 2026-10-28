import {
    describe, expect, it,
} from 'vitest';
import { HOROSCOPE_BODIES } from '../../constants/horoscope';
import { RUNE_COUNT } from '../../constants/runes';
import { TAROT_CARD_COUNT } from '../../constants/tarot';
import { drawDailyCard } from '../../utils/tarot';
import { drawDailyRune } from '../../utils/rune';
import {
    findMappingIssues, findStableMappingIssues,
} from '../mapping';
import { loadOntology } from '../ontology';
import {
    ALL_MAPPINGS, STABLE_MAPPINGS, STATE_MAPPINGS, TERM_REGISTRY,
} from './index';
import {
    HOROSCOPE_MAPPINGS, HOROSCOPE_TERMS, horoscopeTermsOf,
} from './horoscope';
import {
    RUNE_MAPPINGS, RUNE_TERMS, runeTermsOf,
} from './rune';
import {
    TAROT_MAPPINGS, TAROT_TERMS, tarotTermsOf,
} from './tarot';

describe.each([
    [
        'TAROT',
        TAROT_TERMS,
        TAROT_MAPPINGS,
        44,
    ],
    [
        'RUNE',
        RUNE_TERMS,
        RUNE_MAPPINGS,
        39,
    ],
    [
        'HOROSCOPE',
        HOROSCOPE_TERMS,
        HOROSCOPE_MAPPINGS,
        60,
    ],
] as const)('the %s state mapping', (system, terms, mappings, termCount) => {
    it('is sound: real terms, real ends, the keyword method, all of kind state', () => {
        expect(findMappingIssues(mappings, {
            endIds: loadOntology().endIds, terms: { [system]: terms },
        })).toEqual([]);
        expect(mappings.every((entry) => entry.system === system && entry.kind === 'state' && entry.method === 'keyword')).toBe(true);
    });

    it(`has ${termCount} terms, all different, and maps some of them but not all`, () => {
        const mapped = new Set(mappings.map((entry) => entry.term));

        expect(terms).toHaveLength(termCount);
        expect(new Set(terms).size).toBe(termCount);
        expect(mapped.size).toBeGreaterThan(termCount / 2);
        expect(mapped.size).toBeLessThan(termCount);
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

describe('the terms of a day', () => {
    it('cover every card and both orientations, and every card the draw can give', () => {
        for (let card = 0; card < TAROT_CARD_COUNT; card += 1) {
            for (const orientation of ['upright', 'reversed']) expect(TAROT_TERMS).toContain(tarotTermsOf(card, orientation)[0]);
        }

        for (let n = 0; n < 300; n += 1) {
            const {
                cardIndex, orientation, 
            } = drawDailyCard(`user-${n}`, '2026-10-28');

            expect(TAROT_TERMS).toContain(tarotTermsOf(cardIndex, orientation)[0]);
        }
    });

    it('cover every rune the draw can give, in the orientation it can take', () => {
        for (let n = 0; n < 500; n += 1) {
            const {
                runeIndex, orientation, 
            } = drawDailyRune(`user-${n}`, '2026-10-28');

            expect(runeIndex).toBeLessThan(RUNE_COUNT);
            expect(RUNE_TERMS).toContain(runeTermsOf(runeIndex, orientation)[0]);
        }
    });

    it('cover the five bodies of the sign horoscope in the twelve houses', () => {
        for (const body of HOROSCOPE_BODIES) {
            for (let house = 1; house <= 12; house += 1) expect(HOROSCOPE_TERMS).toContain(horoscopeTermsOf(body, house)[0]);
        }
    });
});

describe('the whole mapping', () => {
    it('is sound across all ten systems', () => {
        expect(findMappingIssues(ALL_MAPPINGS, {
            endIds: loadOntology().endIds, terms: TERM_REGISTRY,
        })).toEqual([]);
    });

    it('keeps every state out of the stable trait mapping, and nothing but states in the state mapping', () => {
        expect(findStableMappingIssues(STABLE_MAPPINGS)).toEqual([]);
        expect(STABLE_MAPPINGS.some((entry) => [
            'TAROT',
            'RUNE',
            'HOROSCOPE',
        ].includes(entry.system))).toBe(false);
        expect(STATE_MAPPINGS.every((entry) => [
            'TAROT',
            'RUNE',
            'HOROSCOPE',
        ].includes(entry.system))).toBe(true);
        expect(STABLE_MAPPINGS.length + STATE_MAPPINGS.length).toBe(ALL_MAPPINGS.length);
    });

    it('would turn away a state entry offered to the stable mapping', () => {
        expect(findStableMappingIssues(STATE_MAPPINGS.slice(0, 1)).join('\n')).toMatch(/cannot be part of the stable trait mapping/);
    });
});
