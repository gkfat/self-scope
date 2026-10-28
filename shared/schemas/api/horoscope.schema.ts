import { z } from 'zod';
import { fixedResultResponseSchema } from './fixedResult.schema';
import { zodiacSchema } from '../common';
import {
    HOROSCOPE_BODIES, HOUSE_COUNT,
} from '../../constants/horoscope';

/** One body of today's sky, read for the member: where it is, which house of theirs that is, and what it says. */
export const horoscopeBodySchema = z.object({
    body: z.enum(HOROSCOPE_BODIES),
    /** The body's name, e.g. 月亮 */
    name: z.string(),
    /** What the body is read for, e.g. 今日心情與節奏 */
    area: z.string(),
    /** The sign the body is in today */
    transitSign: zodiacSchema,
    /** Which house of the member's own (their sign is the first) that sign is, 1 to 12 */
    house: z.number().int().min(1).max(HOUSE_COUNT),
    content: fixedResultResponseSchema,
});

/** Today's sign horoscope: the member's sign and the five bodies in the order they are shown. */
export const dailyHoroscopeResponseSchema = z.object({
    /** Taipei calendar date, `YYYY-MM-DD` */
    date: z.string(),
    sign: zodiacSchema,
    bodies: z.array(horoscopeBodySchema).length(HOROSCOPE_BODIES.length),
});

export type HoroscopeBodyResponse = z.infer<typeof horoscopeBodySchema>;
export type DailyHoroscopeResponse = z.infer<typeof dailyHoroscopeResponseSchema>;
