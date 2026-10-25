import { z } from 'zod';

export const SHARE_SOURCES = [
    'SINGLE_RESULT',
    'SUMMARY',
    'HUMAN_DESIGN',
] as const;

export const shareCardRequestSchema = z.object({
    source: z.enum(SHARE_SOURCES),
    /**
     * SINGLE_RESULT: `ZODIAC:aries`, `BLOOD:A` or `MBTI:INTJ`
     * SUMMARY: the summaryId (needs sign-in and ownership)
     * HUMAN_DESIGN: `main`
     */
    referenceId: z.string().min(1),
});

export const shareCardSchema = z.object({
    title: z.string(),
    summaryText: z.string(),
    /** No server-rendered image yet; the client draws the card from the text. */
    imageUrl: z.string().nullable(),
});

export type ShareCardRequest = z.infer<typeof shareCardRequestSchema>;
export type ShareCard = z.infer<typeof shareCardSchema>;
