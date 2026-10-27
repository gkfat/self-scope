import {
    BRANCHES,
    GANZHI_CYCLE,
    HIDDEN_STEMS,
    STEMS,
    STEM_ELEMENTS,
    type Branch,
    type Element,
    type Polarity,
    type Stem,
} from '../../constants/bazi';

export type Ganzhi = {
    stem: Stem;
    branch: Branch;
};

function mod(value: number, divisor: number): number {
    return ((value % divisor) + divisor) % divisor;
}

export function stemIndex(stem: Stem): number {
    return STEMS.indexOf(stem);
}

export function branchIndex(branch: Branch): number {
    return BRANCHES.indexOf(branch);
}

/** Position (0–59) in the sexagenary cycle, where 甲子 is 0. Throws for a stem and branch of different parity. */
export function ganzhiIndex(pair: Ganzhi): number {
    const stem = stemIndex(pair.stem);
    const branch = branchIndex(pair.branch);

    if ((stem + branch) % 2 !== 0) {
        throw new Error(`Invalid stem-branch pair: ${pair.stem}${pair.branch}`);
    }

    // The unique n in 0..59 with n % 10 === stem and n % 12 === branch
    for (let n = stem; n < GANZHI_CYCLE; n += STEMS.length) {
        if (n % BRANCHES.length === branch) return n;
    }

    throw new Error(`Invalid stem-branch pair: ${pair.stem}${pair.branch}`);
}

/** The pair at a position of the cycle; the index wraps in both directions. */
export function ganzhiFromIndex(index: number): Ganzhi {
    const wrapped = mod(index, GANZHI_CYCLE);

    return {
        stem: STEMS[wrapped % STEMS.length] as Stem,
        branch: BRANCHES[wrapped % BRANCHES.length] as Branch,
    };
}

export function ganzhiLabel(pair: Ganzhi): string {
    return `${pair.stem}${pair.branch}`;
}

/** Move a pair forward (positive) or backward (negative) along the cycle. */
export function shiftGanzhi(pair: Ganzhi, steps: number): Ganzhi {
    return ganzhiFromIndex(ganzhiIndex(pair) + steps);
}

export function stemElement(stem: Stem): Element {
    return STEM_ELEMENTS[stem];
}

export function stemPolarity(stem: Stem): Polarity {
    return stemIndex(stem) % 2 === 0 ? 'YANG' : 'YIN';
}

/** The main-qi stem of a branch, which decides the branch's element and ten god. */
export function mainHiddenStem(branch: Branch): Stem {
    return HIDDEN_STEMS[branch][0] as Stem;
}

export function branchElement(branch: Branch): Element {
    return stemElement(mainHiddenStem(branch));
}

/** Polarity of the branch by position (子 is yang), used for the year polarity and branch relations. */
export function branchPolarity(branch: Branch): Polarity {
    return branchIndex(branch) % 2 === 0 ? 'YANG' : 'YIN';
}

/** Sexagenary pair of a (Gregorian) year number, with 1984 = 甲子. */
export function yearGanzhi(year: number): Ganzhi {
    return ganzhiFromIndex(year - 4);
}
