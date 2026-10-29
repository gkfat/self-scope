import {
    describe, expect, it,
} from 'vitest';
import {
    GALACTIC_TONES, SOLAR_SEALS, 
} from './mayaKin';
import {
    GALACTIC_TONE_MEANINGS, SOLAR_SEAL_MEANINGS, 
} from './mayaKinMeanings';

describe('Kin meanings', () => {
    it('has one reading for each seal and each tone, in order', () => {
        expect(SOLAR_SEAL_MEANINGS.map((item) => item.name)).toEqual(SOLAR_SEALS.map((seal) => seal.name));
        expect(GALACTIC_TONE_MEANINGS.map((item) => item.name)).toEqual(GALACTIC_TONES.map((tone) => tone.name));
    });

    it('fills every field, with two questions for each seal', () => {
        for (const seal of SOLAR_SEAL_MEANINGS) {
            for (const text of [
                seal.meaning,
                seal.light,
                seal.shadow,
                seal.love,
                seal.work,
                seal.self,
                seal.relationship,
            ]) {
                expect(text.trim(), seal.name).not.toBe('');
            }

            expect(seal.reflections, seal.name).toHaveLength(2);
        }

        for (const tone of GALACTIC_TONE_MEANINGS) {
            expect(tone.meaning.trim(), tone.name).not.toBe('');
            expect(tone.growthTask.trim(), tone.name).not.toBe('');
            expect(tone.reflection.trim(), tone.name).not.toBe('');
        }
    });
});
