import { z } from 'zod';
import { epochMsSchema } from '../common';
import {
    TAROT_CARD_COUNT, TAROT_ORIENTATIONS,
} from '../../constants/tarot';

export const tarotOrientationSchema = z.enum(TAROT_ORIENTATIONS);

/** users/{uid}/tarotDraws/{YYYY-MM-DD}: the one card an account drew on one Taipei day. */
export const tarotDrawDocSchema = z.object({
    cardIndex: z.number().int().min(0).max(TAROT_CARD_COUNT - 1),
    orientation: tarotOrientationSchema,
    drawnAt: epochMsSchema,
    expiresAt: epochMsSchema,
    /** Version of the draw rule that picked the card */
    drawVersion: z.string().min(1),
});

export type TarotDrawDoc = z.infer<typeof tarotDrawDocSchema>;
