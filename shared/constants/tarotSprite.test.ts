import {
    describe, expect, it,
} from 'vitest';
import { TAROT_CARD_COUNT } from './tarot';
import {
    TAROT_SPRITE, tarotSpriteCell,
} from './tarotSprite';

describe('tarotSpriteCell', () => {
    it('keeps the back right after the faces, inside the sheet', () => {
        expect(TAROT_SPRITE.back).toBe(TAROT_CARD_COUNT);
        expect(TAROT_SPRITE.cols * TAROT_SPRITE.rows).toBeGreaterThan(TAROT_SPRITE.back);
    });

    it('puts the first cell at the top left and the one after the sixth on the second row', () => {
        expect(tarotSpriteCell(0)).toEqual({
            size: '600% 400%', position: '0% 0%',
        });
        expect(tarotSpriteCell(5).position).toBe('100% 0%');
        expect(tarotSpriteCell(6).position).toBe('0% 33.33333333333333%');
    });

    it('refuses a cell that is not on the sheet', () => {
        expect(() => tarotSpriteCell(-1)).toThrow(RangeError);
        expect(() => tarotSpriteCell(TAROT_SPRITE.back + 1)).toThrow(RangeError);
    });
});
