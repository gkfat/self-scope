import {
    RUNE_COUNT, isReversibleRune, type RuneOrientation,
} from '../constants/runes';
import {
    pickDailySymbol, type DailyDrawRule,
} from './dailyDraw';

/** Part of the hashed text and of every stored draw, so a rule change never mixes with older draws. */
export const RUNE_DRAW_VERSION = 'rune-v1';

export const RUNE_DRAW_RULE: DailyDrawRule = {
    symbolCount: RUNE_COUNT,
    version: RUNE_DRAW_VERSION,
    isReversible: isReversibleRune,
};

export type DailyRune = {
    runeIndex: number;
    orientation: RuneOrientation;
};

/**
 * The rune of one account on one day (see `pickDailySymbol`). A rune that looks the same upside down is always
 * upright: the orientation bit is taken first and the rule applied after it.
 */
export function drawDailyRune(uid: string, dateKey: string): DailyRune {
    const {
        symbolIndex, orientation, 
    } = pickDailySymbol(RUNE_DRAW_RULE, uid, dateKey);

    return {
        runeIndex: symbolIndex, orientation,
    };
}
