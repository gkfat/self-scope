import { z } from 'zod';
import { fixedResultResponseSchema } from './fixedResult.schema';
import { tarotOrientationSchema } from '../firestore/tarot.schema';

/** The card as the page draws it. `illustration` stays null until pictures exist. */
export const tarotCardResponseSchema = z.object({
    index: z.number().int().min(0).max(21),
    roman: z.string(),
    name: z.string(),
    englishName: z.string(),
    orientation: tarotOrientationSchema,
    illustration: z.string().nullable(),
});

/** Today's draw: not drawn yet, or the card with its written content. */
export const dailyTarotResponseSchema = z.discriminatedUnion('drawn', [
    z.object({
        /** Taipei calendar date, `YYYY-MM-DD` */
        date: z.string(),
        drawn: z.literal(false),
    }), z.object({
        date: z.string(),
        drawn: z.literal(true),
        card: tarotCardResponseSchema,
        content: fixedResultResponseSchema,
    }),
]);

export type TarotCardResponse = z.infer<typeof tarotCardResponseSchema>;
export type DailyTarotResponse = z.infer<typeof dailyTarotResponseSchema>;
