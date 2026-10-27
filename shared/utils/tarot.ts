import { TAROT_CARD_COUNT } from '../constants/tarot';
import type { TarotOrientation } from '../constants/tarot';
import {
    pickDailySymbol, type DailyDrawRule,
} from './dailyDraw';

/** Part of the hashed text and of every stored draw, so a rule change never mixes with older draws. */
export const TAROT_DRAW_VERSION = 'tarot-v1';

export const TAROT_DRAW_RULE: DailyDrawRule = {
    symbolCount: TAROT_CARD_COUNT,
    version: TAROT_DRAW_VERSION,
};

export type DailyCard = {
    cardIndex: number;
    orientation: TarotOrientation;
};

/** The card of one account on one day (see `pickDailySymbol`). Every card can come up reversed. */
export function drawDailyCard(uid: string, dateKey: string): DailyCard {
    const {
        symbolIndex, orientation, 
    } = pickDailySymbol(TAROT_DRAW_RULE, uid, dateKey);

    return {
        cardIndex: symbolIndex, orientation,
    };
}
