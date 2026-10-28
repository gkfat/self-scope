import { z } from 'zod';
import {
    isRealDate, isoDateSchema, timeOfDaySchema, zodiacSchema,
} from '../common';
import { findCity } from '../../constants/cities';
import {
    ASPECTS, NATAL_BODIES,
} from '../../constants/natal';

/** Everything a chart needs: no part may be left out. */
export const natalChartRequestSchema = z.object({
    birthDate: isoDateSchema,
    birthTime: timeOfDaySchema,
    /** City code from the preset city list */
    birthPlace: z.string().min(1),
}).superRefine((value, ctx) => {
    if (!isRealDate(value.birthDate)) {
        ctx.addIssue({
            code: 'custom', path: ['birthDate'], message: 'birthDate is not a real calendar date',
        });
    } else if (value.birthDate > new Date().toISOString().slice(0, 10)) {
        ctx.addIssue({
            code: 'custom', path: ['birthDate'], message: 'birthDate must not be in the future',
        });
    }

    if (!findCity(value.birthPlace)) {
        ctx.addIssue({
            code: 'custom', path: ['birthPlace'], message: 'birthPlace is not in the preset city list',
        });
    }
});

export const placementSchema = z.object({
    sign: zodiacSchema,
    /** Whole degrees into the sign, 0 to 29 */
    degree: z.number().int().min(0).max(29),
});

const bodySchema = z.enum(NATAL_BODIES);

/** One of the twelve whole-sign houses, counted from the ascendant's sign. */
export const houseSchema = z.object({
    house: z.number().int().min(1).max(12),
    sign: zodiacSchema,
    /** The planet that rules the sign of the house */
    ruler: bodySchema,
    /** The bodies that fall in the house */
    bodies: z.array(bodySchema),
});

/** A major aspect between two bodies; `orb` is how far it is from the exact angle, in degrees. */
export const aspectSchema = z.object({
    body1: bodySchema,
    body2: bodySchema,
    type: z.enum(ASPECTS.map((aspect) => aspect.type) as [string, ...string[]]),
    orb: z.number().min(0),
});

export const natalChartResponseSchema = z.object({
    ascendant: placementSchema,
    bodies: z.object({
        SUN: placementSchema,
        MOON: placementSchema,
        MERCURY: placementSchema,
        VENUS: placementSchema,
        MARS: placementSchema,
        JUPITER: placementSchema,
        SATURN: placementSchema,
        URANUS: placementSchema,
        NEPTUNE: placementSchema,
        PLUTO: placementSchema,
    }),
    houses: z.array(houseSchema).length(12),
    aspects: z.array(aspectSchema),
    /** Set when a daylight-saving switch made the entered time happen twice or not at all */
    timeNote: z.enum(['AMBIGUOUS', 'NONEXISTENT']).nullable(),
});

export type NatalChartRequest = z.infer<typeof natalChartRequestSchema>;
export type NatalChartResponse = z.infer<typeof natalChartResponseSchema>;
export type Placement = z.infer<typeof placementSchema>;
export type NatalHouse = z.infer<typeof houseSchema>;
export type NatalAspect = z.infer<typeof aspectSchema>;
