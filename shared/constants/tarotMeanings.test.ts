import {
    describe, expect, it,
} from 'vitest';
import {
    TAROT_CARD_MEANINGS, type TarotCardMeaning, type TarotOrientationReading,
} from './tarotMeanings';
import { TAROT_CARD_COUNT } from './tarot';

const BANNED = /(症|病|診斷|治療|一定|必然|保證|預言|註定)/;

function textsOf(card: TarotCardMeaning): string[] {
    const reading = (r: TarotOrientationReading) => [
        r.self,
        r.relationship,
        r.innerConflict,
        r.growthTask,
        ...r.reflections,
    ];

    return [
        ...card.themes,
        ...Object.values(card.symbols),
        card.light,
        card.shadow,
        card.traditional,
        card.modern,
        card.uprightCore,
        card.reversedCore,
        card.contrast,
        ...reading(card.upright),
        ...reading(card.reversed),
    ];
}

describe('TAROT_CARD_MEANINGS', () => {
    it('has one entry for each of the 22 cards', () => {
        expect(TAROT_CARD_MEANINGS).toHaveLength(TAROT_CARD_COUNT);
    });

    it('fills every field, with 3 reflection questions per orientation', () => {
        TAROT_CARD_MEANINGS.forEach((card, index) => {
            expect(card.themes.length, `card ${index} themes`).toBeGreaterThanOrEqual(3);

            for (const text of textsOf(card)) expect(text.trim().length, `card ${index}`).toBeGreaterThan(0);

            expect(card.upright.reflections, `card ${index} upright`).toHaveLength(3);
            expect(card.reversed.reflections, `card ${index} reversed`).toHaveLength(3);
        });
    });

    it('keeps each text short enough to scan', () => {
        TAROT_CARD_MEANINGS.forEach((card, index) => {
            for (const text of textsOf(card)) expect(text.length, `card ${index}: ${text}`).toBeLessThanOrEqual(90);
        });
    });

    it('never reads like a diagnosis, a promise or a prediction', () => {
        TAROT_CARD_MEANINGS.forEach((card, index) => {
            for (const text of textsOf(card)) expect(text, `card ${index}`).not.toMatch(BANNED);
        });
    });
});
