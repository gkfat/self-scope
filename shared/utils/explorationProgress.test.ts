import {
    describe, expect, it,
} from 'vitest';
import {
    explorationProgress, type ExplorationFacts,
} from './explorationProgress';

const none: ExplorationFacts = {
    birthDate: null, bloodType: 'UNKNOWN', mbti: null, hasHumanDesign: false,
};

describe('explorationProgress', () => {
    it('starts with nothing done and suggests the zodiac first', () => {
        expect(explorationProgress(none)).toEqual({
            done: {
                ZODIAC: false, BLOOD: false, MBTI: false, HUMAN_DESIGN: false,
            },
            completed: 0,
            total: 4,
            synthesisUnlocked: false,
            next: 'ZODIAC',
        });
    });

    it('treats an unknown blood type as not done', () => {
        expect(explorationProgress({
            ...none, birthDate: '1990-01-01', bloodType: 'UNKNOWN',
        }).done.BLOOD).toBe(false);
        expect(explorationProgress({
            ...none, bloodType: 'AB',
        }).done.BLOOD).toBe(true);
    });

    it('unlocks the paid layer only with both a zodiac sign and an MBTI result', () => {
        expect(explorationProgress({
            ...none, birthDate: '1990-01-01',
        }).synthesisUnlocked).toBe(false);
        expect(explorationProgress({
            ...none, mbti: 'INTJ',
        }).synthesisUnlocked).toBe(false);
        expect(explorationProgress({
            ...none, birthDate: '1990-01-01', mbti: 'INTJ',
        }).synthesisUnlocked).toBe(true);
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
            birthDate: '1990-01-01', bloodType: 'O', mbti: 'INTJ', hasHumanDesign: true,
        });

        expect(all.completed).toBe(4);
        expect(all.next).toBeNull();
    });
});
