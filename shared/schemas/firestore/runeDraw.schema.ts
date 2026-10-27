import { z } from 'zod';
import { epochMsSchema } from '../common';
import {
    RUNE_COUNT, RUNE_ORIENTATIONS, isReversibleRune,
} from '../../constants/runes';

export const runeOrientationSchema = z.enum(RUNE_ORIENTATIONS);

/** users/{uid}/runeDraws/{YYYY-MM-DD}: the one rune an account drew on one Taipei day. */
export const runeDrawDocSchema = z.object({
    symbolIndex: z.number().int().min(0).max(RUNE_COUNT - 1),
    orientation: runeOrientationSchema,
    drawnAt: epochMsSchema,
    expiresAt: epochMsSchema,
    /** Version of the draw rule that picked the rune */
    drawVersion: z.string().min(1),
}).refine((doc) => doc.orientation === 'upright' || isReversibleRune(doc.symbolIndex), {
    path: ['orientation'],
    message: 'a rune that looks the same upside down has no reversed draw',
});

export type RuneDrawDoc = z.infer<typeof runeDrawDocSchema>;
