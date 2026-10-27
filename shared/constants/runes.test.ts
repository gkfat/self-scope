import {
    describe, expect, it,
} from 'vitest';
import {
    RUNES, RUNE_COUNT, isReversibleRune, runeContentKey, runeContentKeys,
} from './runes';

/** The nine runes that look the same turned upside down, and the fifteen that do not (fixed by the product). */
const SYMMETRIC = [
    'Gebo',
    'Hagalaz',
    'Nauthiz',
    'Isa',
    'Jera',
    'Eihwaz',
    'Sowilo',
    'Ingwaz',
    'Dagaz',
];
const REVERSIBLE = [
    'Fehu',
    'Uruz',
    'Thurisaz',
    'Ansuz',
    'Raidho',
    'Kenaz',
    'Wunjo',
    'Perthro',
    'Algiz',
    'Tiwaz',
    'Berkano',
    'Ehwaz',
    'Mannaz',
    'Laguz',
    'Othala',
];

describe('RUNES', () => {
    it('lists the 24 runes of the Elder Futhark in the standard order, from Fehu to Othala', () => {
        expect(RUNES).toHaveLength(RUNE_COUNT);
        expect(RUNES.map((rune) => rune.index)).toEqual(Array.from({ length: 24 }, (_, i) => i));
        expect(RUNES[0]?.name).toBe('Fehu');
        expect(RUNES[6]?.name).toBe('Gebo');
        expect(RUNES[23]?.name).toBe('Othala');
        expect(RUNES.map((rune) => rune.name)).toEqual([
            'Fehu',
            'Uruz',
            'Thurisaz',
            'Ansuz',
            'Raidho',
            'Kenaz',
            'Gebo',
            'Wunjo',
            'Hagalaz',
            'Nauthiz',
            'Isa',
            'Jera',
            'Eihwaz',
            'Perthro',
            'Algiz',
            'Sowilo',
            'Tiwaz',
            'Berkano',
            'Ehwaz',
            'Mannaz',
            'Laguz',
            'Ingwaz',
            'Dagaz',
            'Othala',
        ]);
    });

    it('gives each rune its own Unicode rune character', () => {
        expect(new Set(RUNES.map((rune) => rune.glyph)).size).toBe(24);

        for (const rune of RUNES) expect(rune.glyph.codePointAt(0), rune.name).toBeGreaterThanOrEqual(0x16A0);
        for (const rune of RUNES) expect(rune.glyph.codePointAt(0), rune.name).toBeLessThanOrEqual(0x16FF);
    });

    it('locks the nine symmetric runes and the fifteen reversible ones', () => {
        expect(RUNES.filter((rune) => !rune.reversible).map((rune) => rune.name).sort()).toEqual([...SYMMETRIC].sort());
        expect(RUNES.filter((rune) => rune.reversible).map((rune) => rune.name).sort()).toEqual([...REVERSIBLE].sort());
        expect(SYMMETRIC).toHaveLength(9);
        expect(REVERSIBLE).toHaveLength(15);
    });

    it('answers isReversibleRune from the table, and false outside it', () => {
        expect(isReversibleRune(0)).toBe(true);
        expect(isReversibleRune(6)).toBe(false);
        expect(isReversibleRune(23)).toBe(true);
        expect(isReversibleRune(24)).toBe(false);
        expect(isReversibleRune(-1)).toBe(false);
    });
});

describe('rune content keys', () => {
    it('has 24 upright and 15 reversed keys, 39 in all, none reversed for a symmetric rune', () => {
        const keys = runeContentKeys();

        expect(keys).toHaveLength(39);
        expect(new Set(keys).size).toBe(39);
        expect(keys.filter((key) => key.endsWith('_upright'))).toHaveLength(24);
        expect(keys.filter((key) => key.endsWith('_reversed'))).toHaveLength(15);
        expect(keys).toContain('0_reversed');
        expect(keys).toContain('6_upright');
        expect(keys).not.toContain('6_reversed');
        expect(runeContentKey(13, 'reversed')).toBe('13_reversed');
    });
});
