import {
    DOMINANT_MIN_COUNT,
    ELEMENTS,
    ELEMENT_CONTROLS,
    ELEMENT_GENERATES,
    HIDDEN_STEMS,
    TEN_GODS,
    TEN_GOD_GROUPS,
    TEN_GOD_GROUP_OF,
    type Branch,
    type Element,
    type Polarity,
    type Stem,
    type TenGod,
    type TenGodGroup,
} from '../../constants/bazi';
import {
    branchElement,
    mainHiddenStem,
    stemElement,
    stemPolarity,
} from './ganzhi';
import type { FourPillars } from './pillars';

export type PillarPosition = 'year' | 'month' | 'day' | 'hour';

export type HiddenStemRole = 'MAIN' | 'MIDDLE' | 'RESIDUAL';

const HIDDEN_ROLES: readonly HiddenStemRole[] = [
    'MAIN',
    'MIDDLE',
    'RESIDUAL',
];

export type HiddenStemAnalysis = {
    stem: Stem;
    element: Element;
    role: HiddenStemRole;
    tenGod: TenGod;
};

export type PillarAnalysis = {
    position: PillarPosition;
    stem: Stem;
    branch: Branch;
    stemElement: Element;
    /** The element of the branch (its main-qi stem). */
    branchElement: Element;
    /** Ten god of the stem against the day master; null for the day master itself. */
    stemTenGod: TenGod | null;
    hiddenStems: HiddenStemAnalysis[];
};

export type DayMaster = {
    stem: Stem;
    element: Element;
    polarity: Polarity;
};

export type ChartAnalysis = {
    dayMaster: DayMaster;
    /** In year, month, day, hour order; the hour is absent when the birth time is unknown. */
    pillars: PillarAnalysis[];
    /** The eight characters themselves (six without the hour), branches by main qi; not weighted. */
    elementCounts: Record<Element, number>;
    /** The other seven characters (five without the hour) against the day stem. */
    tenGodCounts: Record<TenGod, number>;
    groupCounts: Record<TenGodGroup, number>;
};

/** The ten god of `other` against the day master `me`, by element relation and same / different polarity. */
export function tenGodOf(me: Stem, other: Stem): TenGod {
    const mine = stemElement(me);
    const theirs = stemElement(other);
    const samePolarity = stemPolarity(me) === stemPolarity(other);

    if (mine === theirs) return samePolarity ? '比肩' : '劫財';
    if (ELEMENT_GENERATES[mine] === theirs) return samePolarity ? '食神' : '傷官';
    if (ELEMENT_CONTROLS[mine] === theirs) return samePolarity ? '偏財' : '正財';
    if (ELEMENT_CONTROLS[theirs] === mine) return samePolarity ? '七殺' : '正官';

    // What is left is the element that generates the day master
    return samePolarity ? '偏印' : '正印';
}

function emptyCounts<K extends string>(keys: readonly K[]): Record<K, number> {
    return Object.fromEntries(keys.map((key) => [key, 0])) as Record<K, number>;
}

function analyzePillar(position: PillarPosition, stem: Stem, branch: Branch, dayStem: Stem): PillarAnalysis {
    return {
        position,
        stem,
        branch,
        stemElement: stemElement(stem),
        branchElement: branchElement(branch),
        stemTenGod: position === 'day' ? null : tenGodOf(dayStem, stem),
        hiddenStems: HIDDEN_STEMS[branch].map((hidden, index) => ({
            stem: hidden,
            element: stemElement(hidden),
            role: HIDDEN_ROLES[index] as HiddenStemRole,
            tenGod: tenGodOf(dayStem, hidden),
        })),
    };
}

/** Day master, element distribution, hidden stems and ten gods of a chart. */
export function analyzeChart(pillars: FourPillars): ChartAnalysis {
    const dayStem = pillars.day.stem;
    const dayMaster: DayMaster = {
        stem: dayStem,
        element: stemElement(dayStem),
        polarity: stemPolarity(dayStem),
    };
    const entries: Array<[PillarPosition, FourPillars['day'] | null]> = [
        ['year', pillars.year],
        ['month', pillars.month],
        ['day', pillars.day],
        ['hour', pillars.hour],
    ];
    const analyses = entries.flatMap(([position, pillar]) => (
        pillar ? [analyzePillar(position, pillar.stem, pillar.branch, dayStem)] : []
    ));
    const elementCounts = emptyCounts(ELEMENTS);
    const tenGodCounts = emptyCounts(TEN_GODS);
    const groupCounts = emptyCounts(TEN_GOD_GROUPS);

    for (const item of analyses) {
        elementCounts[item.stemElement]++;
        elementCounts[item.branchElement]++;

        // The day stem is "me"; every other stem and every branch's main qi counts as a ten god
        const gods = [tenGodOf(dayStem, mainHiddenStem(item.branch))];

        if (item.stemTenGod) gods.push(item.stemTenGod);

        for (const god of gods) {
            tenGodCounts[god]++;
            groupCounts[TEN_GOD_GROUP_OF[god]]++;
        }
    }

    return {
        dayMaster,
        pillars: analyses,
        elementCounts,
        tenGodCounts,
        groupCounts,
    };
}

function soleTop<K extends string>(counts: Record<K, number>): K | null {
    const sorted = (Object.entries(counts) as Array<[K, number]>).sort((a, b) => b[1] - a[1]);
    const [top, second] = sorted;

    if (!top || top[1] < DOMINANT_MIN_COUNT) return null;
    if (second && second[1] === top[1]) return null;

    return top[0];
}

/** The clearly strongest element, or null when none reaches 3 characters or the top is tied. */
export function dominantElement(counts: Record<Element, number>): Element | null {
    return soleTop(counts);
}

/** The ten-god group with a clearly larger count, or null when none reaches 3 or the top is tied. */
export function dominantGroup(counts: Record<TenGodGroup, number>): TenGodGroup | null {
    return soleTop(counts);
}

/** Elements that do not appear at all among the characters. */
export function missingElements(counts: Record<Element, number>): Element[] {
    return ELEMENTS.filter((element) => counts[element] === 0);
}
