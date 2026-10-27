import {
    describe, expect, it,
} from 'vitest';
import { drawDailyRune } from './rune';
import {
    RUNES, RUNE_COUNT,
} from '../constants/runes';

describe('drawDailyRune', () => {
    it('gives the same rune for the same account and day', () => {
        expect(drawDailyRune('user-1', '2026-10-27')).toEqual(drawDailyRune('user-1', '2026-10-27'));
    });

    it('can differ from day to day and from account to account', () => {
        const days = new Set<string>();
        const accounts = new Set<string>();

        for (let day = 1; day <= 28; day++) {
            const rune = drawDailyRune('user-1', `2026-10-${String(day).padStart(2, '0')}`);

            days.add(`${rune.runeIndex}_${rune.orientation}`);
        }

        for (let n = 0; n < 28; n++) {
            const rune = drawDailyRune(`user-${n}`, '2026-10-27');

            accounts.add(`${rune.runeIndex}_${rune.orientation}`);
        }

        expect(days.size).toBeGreaterThan(1);
        expect(accounts.size).toBeGreaterThan(1);
    });

    it('reaches all 24 runes, never outside the set', () => {
        const seen = new Set<number>();

        for (let n = 0; n < 8000; n++) {
            const { runeIndex } = drawDailyRune(`user-${n}`, '2026-10-27');

            expect(runeIndex).toBeGreaterThanOrEqual(0);
            expect(runeIndex).toBeLessThan(RUNE_COUNT);
            seen.add(runeIndex);
        }

        expect(seen.size).toBe(RUNE_COUNT);
    });

    it('never turns a symmetric rune upside down, and turns every reversible one both ways', () => {
        const orientations = new Map<number, Set<string>>();

        for (let n = 0; n < 20000; n++) {
            const {
                runeIndex, orientation, 
            } = drawDailyRune(`user-${n}`, '2026-10-27');
            const seen = orientations.get(runeIndex) ?? new Set<string>();

            seen.add(orientation);
            orientations.set(runeIndex, seen);
        }

        for (const rune of RUNES) {
            const seen = orientations.get(rune.index) ?? new Set<string>();

            if (rune.reversible) {
                expect([...seen].sort(), rune.name).toEqual(['reversed', 'upright']);
            } else {
                expect([...seen], rune.name).toEqual(['upright']);
            }
        }
    });
});
