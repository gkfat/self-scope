import {
    describe, expect, it,
} from 'vitest';
import { NATAL_PLACEMENT_MEANINGS } from './natalPlacementMeanings';
import { NATAL_LABELS } from './natalLabels';
import { ZODIACS } from '../schemas/common';

describe('NATAL_PLACEMENT_MEANINGS', () => {
    it('covers every position in every sign: 11 x 12', () => {
        expect(Object.keys(NATAL_PLACEMENT_MEANINGS).sort()).toEqual(Object.keys(NATAL_LABELS).sort());

        for (const [position, signs] of Object.entries(NATAL_PLACEMENT_MEANINGS)) {
            expect(Object.keys(signs).sort(), position).toEqual([...ZODIACS].sort());
        }
    });

    it('keeps each reading short enough to scan', () => {
        for (const [position, signs] of Object.entries(NATAL_PLACEMENT_MEANINGS)) {
            for (const [sign, text] of Object.entries(signs)) {
                expect(text.length, `${position} ${sign}`).toBeGreaterThanOrEqual(20);
                expect(text.length, `${position} ${sign}`).toBeLessThanOrEqual(100);
            }
        }
    });

    it('never reads like a diagnosis or a promise', () => {
        const banned = /(症|病|診斷|治療|一定|必然|保證)/;

        for (const [position, signs] of Object.entries(NATAL_PLACEMENT_MEANINGS)) {
            for (const [sign, text] of Object.entries(signs)) expect(text, `${position} ${sign}`).not.toMatch(banned);
        }
    });
});
