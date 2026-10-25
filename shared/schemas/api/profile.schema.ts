import { z } from 'zod';
import {
    bloodTypeSchema, isRealDate, isoDateSchema, mbtiTypeSchema, timeOfDaySchema, zodiacSchema,
} from '../common';
import { findCity } from '../../constants/cities';
import { zodiacFromIsoDate } from '../../utils/zodiac';

/**
 * Birth data. birthDate and zodiac are required; time and place are optional
 * (without both, no human-design chart can be produced).
 */
export const birthDataSchema = z.object({
    birthDate: isoDateSchema,
    zodiac: zodiacSchema,
    birthTime: timeOfDaySchema.nullable().optional(),
    /** City code from the preset city list */
    birthPlace: z.string().min(1).nullable().optional(),
}).superRefine((value, ctx) => {
    if (!isRealDate(value.birthDate)) {
        ctx.addIssue({
            code: 'custom',
            path: ['birthDate'],
            message: 'birthDate is not a real calendar date',
        });
        return;
    }

    if (value.birthDate > new Date().toISOString().slice(0, 10)) {
        ctx.addIssue({
            code: 'custom',
            path: ['birthDate'],
            message: 'birthDate must not be in the future',
        });
    }

    if (zodiacFromIsoDate(value.birthDate) !== value.zodiac) {
        ctx.addIssue({
            code: 'custom',
            path: ['zodiac'],
            message: 'zodiac does not match birthDate',
        });
    }

    if (value.birthPlace && !findCity(value.birthPlace)) {
        ctx.addIssue({
            code: 'custom',
            path: ['birthPlace'],
            message: 'birthPlace is not in the preset city list',
        });
    }
});

export const profileInputSchema = z.object({
    birthData: birthDataSchema,
    bloodType: bloodTypeSchema.default('UNKNOWN'),
    mbti: mbtiTypeSchema.nullable().optional(),
});

export const profileResponseSchema = z.object({
    userId: z.string(),
    email: z.string(),
    birthData: birthDataSchema.nullable(),
    bloodType: bloodTypeSchema,
    mbti: mbtiTypeSchema.nullable(),
});

export type BirthData = z.infer<typeof birthDataSchema>;
export type ProfileInput = z.infer<typeof profileInputSchema>;
export type ProfileResponse = z.infer<typeof profileResponseSchema>;
