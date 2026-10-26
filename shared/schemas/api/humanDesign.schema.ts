import { z } from 'zod';
import {
    isRealDate, isoDateSchema, timeOfDaySchema,
} from '../common';
import { findCity } from '../../constants/cities';
import { humanDesignResultSchema } from '../firestore/humanDesign.schema';

/**
 * Birth data for one calculation. Every field is optional because a member's saved profile
 * (or a guest's session profile) fills what is left out; the service asks for what is still missing.
 */
export const humanDesignRequestSchema = z.object({
    birthDate: isoDateSchema.optional(),
    birthTime: timeOfDaySchema.optional(),
    /** City code from the preset city list */
    birthPlace: z.string().min(1).optional(),
}).superRefine((value, ctx) => {
    if (value.birthDate !== undefined) {
        if (!isRealDate(value.birthDate)) {
            ctx.addIssue({
                code: 'custom', path: ['birthDate'], message: 'birthDate is not a real calendar date',
            });
        } else if (value.birthDate > new Date().toISOString().slice(0, 10)) {
            ctx.addIssue({
                code: 'custom', path: ['birthDate'], message: 'birthDate must not be in the future',
            });
        }
    }

    if (value.birthPlace !== undefined && !findCity(value.birthPlace)) {
        ctx.addIssue({
            code: 'custom', path: ['birthPlace'], message: 'birthPlace is not in the preset city list',
        });
    }
});

export const humanDesignResponseSchema = humanDesignResultSchema.extend({
    disclaimer: z.string(),
    /** true when kept in the member's account; false for a guest, whose result lasts only for the session */
    saved: z.boolean(),
    /** null for a guest */
    expiresAt: z.number().int().nullable(),
    /**
     * Set only right after a calculation, when a daylight-saving switch made the entered time happen twice
     * (the first is used) or not at all (the time before the switch is used).
     */
    timeNote: z.enum(['AMBIGUOUS', 'NONEXISTENT']).nullable().default(null),
});

export type HumanDesignRequest = z.infer<typeof humanDesignRequestSchema>;
export type HumanDesignResponse = z.infer<typeof humanDesignResponseSchema>;
