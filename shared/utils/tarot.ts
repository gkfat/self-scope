import { createHash } from 'node:crypto';
import {
    TAROT_CARD_COUNT, type TarotOrientation,
} from '../constants/tarot';

/** Part of the hashed text and of every stored draw, so a rule change never mixes with older draws. */
export const TAROT_DRAW_VERSION = 'tarot-v1';

export type DailyCard = {
    cardIndex: number;
    orientation: TarotOrientation;
};

/**
 * The card of one account on one day. Deterministic on purpose: retries, concurrent requests and other
 * devices all get the same card. First 4 bytes of SHA-256(`uid|date|version`) pick the card, the lowest
 * bit of the next byte picks the orientation.
 */
export function drawDailyCard(uid: string, dateKey: string): DailyCard {
    const digest = createHash('sha256').update(`${uid}|${dateKey}|${TAROT_DRAW_VERSION}`).digest();

    return {
        cardIndex: digest.readUInt32BE(0) % TAROT_CARD_COUNT,
        orientation: (digest[4] ?? 0) % 2 === 0 ? 'upright' : 'reversed',
    };
}
