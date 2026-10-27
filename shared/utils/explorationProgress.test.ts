import {
    describe, expect, it,
} from 'vitest';
import {
    explorationProgress, type ExplorationFacts,
} from './explorationProgress';

const none: ExplorationFacts = {
    birthDate: null, birthTime: null, bloodType: 'UNKNOWN', mbti: null, hasHumanDesign: false,
};

describe('explorationProgress', () => {
    it('starts with nothing done and suggests the zodiac first', () => {
        expect(explorationProgress(none)).toEqual({
            done: {
                ZODIAC: false, BLOOD: false, MBTI: false, HUMAN_DESIGN: false, NUMEROLOGY: false, BAZI: false, MAYA_KIN: false,
            },
            completed: 0,
            total: 7,
            multiDimensionUnlocked: false,
            next: 'ZODIAC',
        });
    });

    it('needs the birth time for the BaZi chart', () => {
        expect(explorationProgress({
            ...none, birthDate: '1990-01-01',
        }).done.BAZI).toBe(false);
        expect(explorationProgress({
            ...none, birthDate: '1990-01-01', birthTime: '12:00',
        }).done.BAZI).toBe(true);
    });

    it('finishes the Maya Kin from the birth date alone', () => {
        expect(explorationProgress(none).done.MAYA_KIN).toBe(false);
        expect(explorationProgress({
            ...none, birthDate: '1990-01-01',
        }).done.MAYA_KIN).toBe(true);
    });

    it('treats an unknown blood type as not done', () => {
        expect(explorationProgress({
            ...none, birthDate: '1990-01-01', bloodType: 'UNKNOWN',
        }).done.BLOOD).toBe(false);
        expect(explorationProgress({
            ...none, bloodType: 'AB',
        }).done.BLOOD).toBe(true);
    });

    it('unlocks the multi-dimension analysis from two finished dimensions', () => {
        expect(explorationProgress({
            ...none, mbti: 'INTJ',
        }).multiDimensionUnlocked).toBe(false);
        // The birth date alone finishes the zodiac and the life path number
        expect(explorationProgress({
            ...none, birthDate: '1990-01-01',
        }).multiDimensionUnlocked).toBe(true);
        expect(explorationProgress({
            ...none, birthDate: '1990-01-01', bloodType: 'O',
        }).multiDimensionUnlocked).toBe(true);
    });

    it('suggests the quickest unfinished layer: MBTI, then blood type, then human design', () => {
        const withZodiac = {
            ...none, birthDate: '1990-01-01',
        };

        expect(explorationProgress(withZodiac).next).toBe('MBTI');
        expect(explorationProgress({
            ...withZodiac, mbti: 'INTJ',
        }).next).toBe('BLOOD');
        expect(explorationProgress({
            ...withZodiac, mbti: 'INTJ', bloodType: 'O',
        }).next).toBe('HUMAN_DESIGN');
    });

    it('has nothing to suggest when everything is done', () => {
        const all = explorationProgress({
            birthDate: '1990-01-01', birthTime: '12:00', bloodType: 'O', mbti: 'INTJ', hasHumanDesign: true,
        });

        expect(all.completed).toBe(7);
        expect(all.next).toBeNull();
    });
});
