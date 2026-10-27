import { z } from 'zod';
import { fixedResultResponseSchema } from './fixedResult.schema';
import {
    isRealDate, isoDateSchema,
} from '../common';
import {
    GALACTIC_TONE_COUNT, KIN_COUNT, SOLAR_SEAL_COUNT,
} from '../../constants/mayaKin';

export const kinSchema = z.object({
    kinNumber: z.number().int().min(1).max(KIN_COUNT),
    solarSeal: z.number().int().min(1).max(SOLAR_SEAL_COUNT),
    galacticTone: z.number().int().min(1).max(GALACTIC_TONE_COUNT),
});

/** The birth Kin is asked for by date: a real one, and not in the future. */
export const birthKinQuerySchema = z.object({ birthDate: isoDateSchema }).superRefine((value, ctx) => {
    if (!isRealDate(value.birthDate)) {
        ctx.addIssue({
            code: 'custom', path: ['birthDate'], message: 'birthDate is not a real calendar date',
        });
    } else if (value.birthDate > new Date().toISOString().slice(0, 10)) {
        ctx.addIssue({
            code: 'custom', path: ['birthDate'], message: 'birthDate must not be in the future',
        });
    }
});

export const birthKinResponseSchema = z.object({
    kin: kinSchema,
    content: fixedResultResponseSchema,
});

/** Today's Kin: locked (nothing but the date), or unlocked with the Kin and its content. */
export const kinTodayResponseSchema = z.discriminatedUnion('unlocked', [
    z.object({
        /** Taipei calendar date, `YYYY-MM-DD` */
        date: z.string(),
        unlocked: z.literal(false),
    }), z.object({
        date: z.string(),
        unlocked: z.literal(true),
        kin: kinSchema,
        content: fixedResultResponseSchema,
    }),
]);

export type Kin = z.infer<typeof kinSchema>;
export type BirthKinResponse = z.infer<typeof birthKinResponseSchema>;
export type KinTodayResponse = z.infer<typeof kinTodayResponseSchema>;
