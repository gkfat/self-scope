import { z } from 'zod';
import { fixedResultResponseSchema } from './fixedResult.schema';
import { runeOrientationSchema } from '../firestore/runeDraw.schema';
import { RUNE_COUNT } from '../../constants/runes';

/** The rune as the page draws it. `illustration` stays null until pictures exist. */
export const runeResponseSchema = z.object({
    index: z.number().int().min(0).max(RUNE_COUNT - 1),
    name: z.string(),
    glyph: z.string(),
    meaning: z.string(),
    orientation: runeOrientationSchema,
    illustration: z.string().nullable(),
});

/** Today's draw: not drawn yet, or the rune with its written content. */
export const dailyRuneResponseSchema = z.discriminatedUnion('drawn', [
    z.object({
        /** Taipei calendar date, `YYYY-MM-DD` */
        date: z.string(),
        drawn: z.literal(false),
    }), z.object({
        date: z.string(),
        drawn: z.literal(true),
        rune: runeResponseSchema,
        content: fixedResultResponseSchema,
    }),
]);

export type RuneResponse = z.infer<typeof runeResponseSchema>;
export type DailyRuneResponse = z.infer<typeof dailyRuneResponseSchema>;
