import {
    ELEMENTS,
    ELEMENT_CONTROLS,
    ELEMENT_GENERATES,
    HIDDEN_STEMS,
    HIDDEN_STEM_SHARES,
    PATTERN_OF_TEN_GOD,
    STRENGTH_BOUNDS,
    STRENGTH_WEIGHTS,
    TEN_GOD_GROUP_OF,
    USEFUL_GODS,
    type Branch,
    type Element,
    type ElementPhase,
    type PatternKey,
    type Stem,
    type StrengthLevel,
    type TenGod,
    type TenGodGroup,
    type UsefulGods,
} from '../../constants/bazi';
import { tenGodOf } from './analysis';
import {
    branchElement,
    mainHiddenStem,
    stemElement,
} from './ganzhi';
import type { FourPillars } from './pillars';

export type SupportPart = {
    /** Which character the score came from, e.g. 'monthBranch'. */
    source: keyof typeof STRENGTH_WEIGHTS;
    weight: number;
    /** Share of this character that supports the day master, in tenths (0 to 10). */
    tenths: number;
    points: number;
};

export type StrengthSide = 'STRONG' | 'WEAK' | 'BALANCED';

export type StrengthResult = {
    /** Support score from 0 to 100 (scaled to 100 when the hour is unknown). */
    score: number;
    level: StrengthLevel;
    side: StrengthSide;
    parts: SupportPart[];
    /** Strength of each element by the month's element (旺相休囚死). */
    phases: Record<Element, ElementPhase>;
    pattern: {
        key: PatternKey;
        /** The ten god of the month branch's main-qi stem. */
        tenGod: TenGod;
        group: TenGodGroup;
    };
    /** 用神, 喜神 and 忌神 as ten-god groups; null when the chart is balanced. */
    useful: UsefulGods | null;
};

/** Support comes from the day master's own element (比劫) and the element that generates it (印). */
function supportElements(dayElement: Element): readonly Element[] {
    const generator = ELEMENTS.find((element) => ELEMENT_GENERATES[element] === dayElement) as Element;

    return [dayElement, generator];
}

const FULL_SHARE = 10;

function stemShare(stem: Stem, support: readonly Element[]): number {
    return support.includes(stemElement(stem)) ? FULL_SHARE : 0;
}

/** Tenths of a branch's hidden stems that support the day master, weighting main : middle : residual. */
function branchShare(branch: Branch, support: readonly Element[]): number {
    const hidden = HIDDEN_STEMS[branch];
    const shares = HIDDEN_STEM_SHARES[hidden.length as 1 | 2 | 3];

    return hidden.reduce((total, stem, index) => total + (support.includes(stemElement(stem)) ? (shares[index] as number) : 0), 0);
}

export function strengthLevelOf(score: number): StrengthLevel {
    return STRENGTH_BOUNDS.find(([bound]) => score >= bound)?.[1] ?? 'taiwei';
}

function sideOf(level: StrengthLevel): StrengthSide {
    if (level === 'taiwang' || level === 'strong') return 'STRONG';
    if (level === 'balanced') return 'BALANCED';

    return 'WEAK';
}

/** 旺 for the month's own element, 相 for what it generates, 休 for what generates it, 囚 for what controls it, 死 for what it controls. */
export function elementPhases(monthElement: Element): Record<Element, ElementPhase> {
    const phases = {} as Record<Element, ElementPhase>;

    for (const element of ELEMENTS) {
        if (element === monthElement) phases[element] = '旺';
        else if (ELEMENT_GENERATES[monthElement] === element) phases[element] = '相';
        else if (ELEMENT_GENERATES[element] === monthElement) phases[element] = '休';
        else if (ELEMENT_CONTROLS[element] === monthElement) phases[element] = '囚';
        else phases[element] = '死';
    }

    return phases;
}

/** Day master strength, month-branch pattern, element phases and useful gods under the fixed published rules. */
export function analyzeStrength(pillars: FourPillars): StrengthResult {
    const dayStem = pillars.day.stem;
    const support = supportElements(stemElement(dayStem));
    const sources: Array<[keyof typeof STRENGTH_WEIGHTS, number]> = [
        ['yearStem', stemShare(pillars.year.stem, support)],
        ['monthStem', stemShare(pillars.month.stem, support)],
        ['yearBranch', branchShare(pillars.year.branch, support)],
        ['monthBranch', branchShare(pillars.month.branch, support)],
        ['dayBranch', branchShare(pillars.day.branch, support)],
    ];

    if (pillars.hour) {
        sources.push(['hourStem', stemShare(pillars.hour.stem, support)], ['hourBranch', branchShare(pillars.hour.branch, support)]);
    }

    const parts = sources.map(([source, tenths]): SupportPart => ({
        source,
        weight: STRENGTH_WEIGHTS[source],
        tenths,
        points: (STRENGTH_WEIGHTS[source] * tenths) / FULL_SHARE,
    }));
    const present = parts.reduce((total, part) => total + part.weight, 0);
    const weighted = parts.reduce((total, part) => total + part.weight * part.tenths, 0);
    // weight x tenths summed over the present characters, scaled to 100 (a divisor of 100 when the hour is known)
    const score = (weighted * FULL_SHARE) / present;
    const level = strengthLevelOf(score);
    const side = sideOf(level);
    const tenGod = tenGodOf(dayStem, mainHiddenStem(pillars.month.branch));
    const group = TEN_GOD_GROUP_OF[tenGod];

    return {
        score: Math.round(score * 10) / 10,
        level,
        side,
        parts,
        phases: elementPhases(branchElement(pillars.month.branch)),
        pattern: {
            key: PATTERN_OF_TEN_GOD[tenGod],
            tenGod,
            group,
        },
        useful: side === 'BALANCED' ? null : USEFUL_GODS[side === 'STRONG' ? 'strong' : 'weak'][group],
    };
}
