import type { BloodType } from '../schemas/common';

export const EXPLORATION_LAYERS = [
    'ZODIAC',
    'BLOOD',
    'MBTI',
    'HUMAN_DESIGN',
] as const;

export type ExplorationLayer = typeof EXPLORATION_LAYERS[number];

/** What is known about the visitor, whether a signed-in member or a guest. */
export type ExplorationFacts = {
    birthDate: string | null;
    bloodType: BloodType;
    mbti: string | null;
    hasHumanDesign: boolean;
};

export type ExplorationProgress = {
    done: Record<ExplorationLayer, boolean>;
    completed: number;
    total: number;
    /** The summary and the detailed report both need a zodiac sign and an MBTI result (RULE-033). */
    synthesisUnlocked: boolean;
    /** The layer to suggest next, or null when all four are done. */
    next: ExplorationLayer | null;
};

/** Order in which layers are suggested: quickest first. */
const SUGGESTION_ORDER: readonly ExplorationLayer[] = [
    'ZODIAC',
    'MBTI',
    'BLOOD',
    'HUMAN_DESIGN',
];

export function explorationProgress(facts: ExplorationFacts): ExplorationProgress {
    const done: Record<ExplorationLayer, boolean> = {
        ZODIAC: facts.birthDate !== null,
        BLOOD: facts.bloodType !== 'UNKNOWN',
        MBTI: facts.mbti !== null,
        HUMAN_DESIGN: facts.hasHumanDesign,
    };

    return {
        done,
        completed: EXPLORATION_LAYERS.filter((layer) => done[layer]).length,
        total: EXPLORATION_LAYERS.length,
        synthesisUnlocked: done.ZODIAC && done.MBTI,
        next: SUGGESTION_ORDER.find((layer) => !done[layer]) ?? null,
    };
}
