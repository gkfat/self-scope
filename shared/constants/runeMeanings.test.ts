import {
    describe, expect, it,
} from 'vitest';
import { RUNES } from './runes';
import {
    RUNE_MEANINGS, runeSide, 
} from './runeMeanings';

describe('RUNE_MEANINGS', () => {
    it('has one reading for each rune, in the order of the runes', () => {
        expect(RUNE_MEANINGS.map((meaning) => meaning.name)).toEqual(RUNES.map((rune) => rune.name));
    });

    it('has a reversed side exactly for the runes that look different upside down', () => {
        for (const rune of RUNES) {
            expect(Boolean(RUNE_MEANINGS[rune.index]?.reversed), rune.name).toBe(rune.reversible);
        }
    });

    it('fills every field, with three questions for each side', () => {
        for (const meaning of RUNE_MEANINGS) {
            for (const text of [
                meaning.traditional,
                meaning.modern,
                meaning.light,
                meaning.shadow,
                meaning.growthTask,
            ]) {
                expect(text.trim(), meaning.name).not.toBe('');
            }

            for (const side of [meaning.upright, meaning.reversed]) {
                if (!side) continue;

                for (const text of [
                    side.love,
                    side.work,
                    side.self,
                    side.relationship,
                ]) {
                    expect(text.trim(), meaning.name).not.toBe('');
                }

                expect(side.reflections, meaning.name).toHaveLength(3);
            }
        }
    });

    it('gives the side that was drawn, and nothing for a reversed rune that cannot be reversed', () => {
        expect(runeSide(0, 'reversed')).toBe(RUNE_MEANINGS[0]?.reversed);
        expect(runeSide(0, 'upright')).toBe(RUNE_MEANINGS[0]?.upright);
        expect(runeSide(6, 'reversed')).toBeUndefined();
    });
});
