import {
    BRANCHES,
    BRANCH_CLASHES,
    BRANCH_COMBINES,
    BRANCH_ZODIAC,
    LIFE_STAGES,
    LIFE_STAGE_START,
    NAYIN_ELEMENT_OF_CHAR,
    NAYIN_NAMES,
    SEASON_OF_BRANCH,
    STEMS,
    STEM_COMBINES,
    TIGER_MONTH_START_STEM,
    type Branch,
    type Element,
    type LifeStage,
    type Polarity,
    type Season,
    type Stem,
} from '../../constants/bazi';
import type { PillarPosition } from './analysis';
import {
    branchIndex,
    ganzhiIndex,
    stemIndex,
    stemPolarity,
    type Ganzhi,
} from './ganzhi';
import type { FourPillars } from './pillars';
import { termAround } from './solarTerms';

export type RelationKind = 'STEM_COMBINE' | 'BRANCH_COMBINE' | 'BRANCH_CLASH';

export type Relation = {
    kind: RelationKind;
    /** The two characters, e.g. 甲己 or 卯戌. */
    pair: string;
    /** The two pillars they sit in, in year-to-hour order. */
    positions: [PillarPosition, PillarPosition];
};

export type NayinInfo = {
    name: string;
    element: Element;
};

export type ChartFacts = {
    /** Life stage of the day stem in each pillar's branch (地勢). */
    stages: Array<{ position: PillarPosition; stage: LifeStage }>;
    /** Life stage of each pillar's own stem in its own branch (自坐). */
    ownStages: Array<{ position: PillarPosition; stage: LifeStage }>;
    /** The two empty branches (空亡) of the ten-day span each pillar belongs to. */
    voids: Array<{ position: PillarPosition; branches: [Branch, Branch] }>;
    /** The day pillar's empty branches and the other pillars whose branch falls in them. */
    dayVoid: { branches: [Branch, Branch]; positions: PillarPosition[] };
    nayin: Array<{ position: PillarPosition } & NayinInfo>;
    /** Null when the birth time is unknown. */
    mingGong: Ganzhi | null;
    taiYuan: Ganzhi;
    zodiac: string;
    /** Polarity of the year stem. */
    yearPolarity: Polarity;
    /** The solar term (any of the 24) the birth falls in, and the season of the month. */
    solarTerm: string;
    season: Season;
    relations: Relation[];
};

const POSITIONS: readonly PillarPosition[] = [
    'year',
    'month',
    'day',
    'hour',
];

/** Life stage of a stem at a branch. */
export function lifeStageOf(stem: Stem, branch: Branch): LifeStage {
    const start = branchIndex(LIFE_STAGE_START[stem]);
    const offset = branchIndex(branch) - start;
    const steps = stemPolarity(stem) === 'YANG' ? offset : -offset;

    return LIFE_STAGES[((steps % 12) + 12) % 12] as LifeStage;
}

/** 納音 of a sexagenary pair. */
export function nayinOf(pair: Ganzhi): NayinInfo {
    const name = NAYIN_NAMES[Math.floor(ganzhiIndex(pair) / 2)] as string;

    return {
        name,
        element: NAYIN_ELEMENT_OF_CHAR[name.slice(-1)] as Element,
    };
}

/** The two branches left out of the ten-day span (旬) that starts with the pair's 甲 day. */
export function voidBranchesOf(pair: Ganzhi): [Branch, Branch] {
    const spanStart = Math.floor(ganzhiIndex(pair) / 10) * 10;
    const startBranch = spanStart % 12;

    return [BRANCHES[(startBranch + 10) % 12] as Branch, BRANCHES[(startBranch + 11) % 12] as Branch];
}

/** Month number counted from 寅 = 1 … 丑 = 12, the numbering the 命宮 formula uses. */
function fromYin(branch: Branch): number {
    return ((branchIndex(branch) - branchIndex('寅') + 12) % 12) + 1;
}

/** 命宮: the month number and the hour number sum to a position counted back from 14 (or 26). */
export function mingGongOf(yearStem: Stem, monthBranch: Branch, hourBranch: Branch): Ganzhi {
    const sum = fromYin(monthBranch) + fromYin(hourBranch);
    const position = (sum >= 14 ? 26 : 14) - sum;
    const startStem = TIGER_MONTH_START_STEM[stemIndex(yearStem) % 5] as Stem;

    return {
        stem: STEMS[(stemIndex(startStem) + position - 1) % 10] as Stem,
        branch: BRANCHES[(branchIndex('寅') + position - 1) % 12] as Branch,
    };
}

/** 胎元: one stem after the month stem and three branches after the month branch. */
export function taiYuanOf(month: Ganzhi): Ganzhi {
    return {
        stem: STEMS[(stemIndex(month.stem) + 1) % 10] as Stem,
        branch: BRANCHES[(branchIndex(month.branch) + 3) % 12] as Branch,
    };
}

function presentPillars(pillars: FourPillars) {
    return POSITIONS.flatMap((position) => {
        const pillar = pillars[position];

        return pillar ? [
            {
                position, pillar,
            },
        ] : [];
    });
}

function findRelations(pillars: FourPillars): Relation[] {
    const present = presentPillars(pillars);
    const relations: Relation[] = [];

    for (let i = 0; i < present.length; i++) {
        for (let j = i + 1; j < present.length; j++) {
            const a = present[i]!;
            const b = present[j]!;
            const positions: [PillarPosition, PillarPosition] = [a.position, b.position];
            const stems = [a.pillar.stem, b.pillar.stem];
            const branches = [a.pillar.branch, b.pillar.branch];

            const stemMatch = STEM_COMBINES.find(([x, y]) => stems.includes(x) && stems.includes(y));

            if (stemMatch) {
                relations.push({
                    kind: 'STEM_COMBINE', pair: stemMatch.join(''), positions,
                });
            }

            const combine = BRANCH_COMBINES.find(([x, y]) => branches.includes(x) && branches.includes(y));

            if (combine) {
                relations.push({
                    kind: 'BRANCH_COMBINE', pair: combine.join(''), positions,
                });
            }

            const clash = BRANCH_CLASHES.find(([x, y]) => branches.includes(x) && branches.includes(y));

            if (clash) {
                relations.push({
                    kind: 'BRANCH_CLASH', pair: clash.join(''), positions,
                });
            }
        }
    }

    return relations;
}

/** Deterministic chart facts; only facts, no judgement of good or bad. */
export function computeFacts(pillars: FourPillars, instant: Date): ChartFacts {
    const dayStem = pillars.day.stem;
    const present = presentPillars(pillars);
    const dayVoidBranches = voidBranchesOf(pillars.day);
    const monthBranch = pillars.month.branch;

    return {
        stages: present.map(({
            position, pillar,
        }) => ({
            position, stage: lifeStageOf(dayStem, pillar.branch),
        })),
        ownStages: present.map(({
            position, pillar,
        }) => ({
            position, stage: lifeStageOf(pillar.stem, pillar.branch),
        })),
        voids: present.map(({
            position, pillar,
        }) => ({
            position, branches: voidBranchesOf(pillar),
        })),
        dayVoid: {
            branches: dayVoidBranches,
            positions: present
                .filter(({
                    position, pillar,
                }) => position !== 'day' && dayVoidBranches.includes(pillar.branch))
                .map(({ position }) => position),
        },
        nayin: present.map(({
            position, pillar,
        }) => ({
            position, ...nayinOf(pillar),
        })),
        mingGong: pillars.hour ? mingGongOf(pillars.year.stem, monthBranch, pillars.hour.branch) : null,
        taiYuan: taiYuanOf(pillars.month),
        zodiac: BRANCH_ZODIAC[pillars.year.branch],
        yearPolarity: stemPolarity(pillars.year.stem),
        solarTerm: termAround(instant).current.name,
        season: SEASON_OF_BRANCH[monthBranch],
        relations: findRelations(pillars),
    };
}
