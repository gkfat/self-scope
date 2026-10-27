import {
    describe, expect, it,
} from 'vitest';
import {
    drawDailyCard, taipeiDateKey,
} from './tarot';
import { TAROT_CARD_COUNT } from '../constants/tarot';

describe('taipeiDateKey', () => {
    it.each([
        ['2026-10-27T15:59:59Z', '2026-10-27'],
        ['2026-10-27T16:00:00Z', '2026-10-28'],
        ['2026-12-31T16:00:00Z', '2027-01-01'],
        ['2026-10-27T00:00:00Z', '2026-10-27'],
    ])('%s is %s in Taipei', (instant, expected) => {
        expect(taipeiDateKey(new Date(instant))).toBe(expected);
    });
});

describe('drawDailyCard', () => {
    it('gives the same card for the same account and day', () => {
        expect(drawDailyCard('user-1', '2026-10-27')).toEqual(drawDailyCard('user-1', '2026-10-27'));
    });

    it('can differ from day to day and from account to account', () => {
        const days = new Set<string>();
        const accounts = new Set<string>();

        for (let day = 1; day <= 28; day++) {
            const card = drawDailyCard('user-1', `2026-10-${String(day).padStart(2, '0')}`);

            days.add(`${card.cardIndex}_${card.orientation}`);
        }

        for (let n = 0; n < 28; n++) {
            const card = drawDailyCard(`user-${n}`, '2026-10-27');

            accounts.add(`${card.cardIndex}_${card.orientation}`);
        }

        expect(days.size).toBeGreaterThan(1);
        expect(accounts.size).toBeGreaterThan(1);
    });

    it('reaches all 22 cards and both orientations, never outside the deck', () => {
        const seen = new Set<number>();
        const orientations = new Set<string>();

        for (let n = 0; n < 5000; n++) {
            const card = drawDailyCard(`user-${n}`, '2026-10-27');

            expect(card.cardIndex).toBeGreaterThanOrEqual(0);
            expect(card.cardIndex).toBeLessThan(TAROT_CARD_COUNT);
            seen.add(card.cardIndex);
            orientations.add(card.orientation);
        }

        expect(seen.size).toBe(TAROT_CARD_COUNT);
        expect([...orientations].sort()).toEqual(['reversed', 'upright']);
    });
});
