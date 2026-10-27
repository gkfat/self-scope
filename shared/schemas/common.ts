import { z } from 'zod';

export const ZODIACS = [
    'aries',
    'taurus',
    'gemini',
    'cancer',
    'leo',
    'virgo',
    'libra',
    'scorpio',
    'sagittarius',
    'capricorn',
    'aquarius',
    'pisces',
] as const;

export const BLOOD_TYPES = [
    'A',
    'B',
    'O',
    'AB',
    'UNKNOWN',
] as const;

export const MBTI_TYPES = [
    'INTJ',
    'INTP',
    'ENTJ',
    'ENTP',
    'INFJ',
    'INFP',
    'ENFJ',
    'ENFP',
    'ISTJ',
    'ISFJ',
    'ESTJ',
    'ESFJ',
    'ISTP',
    'ISFP',
    'ESTP',
    'ESFP',
] as const;

/** Life path numbers: 1-9 plus the master numbers 11, 22 and 33. */
export const NUMEROLOGY_NUMBERS = [
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '11',
    '22',
    '33',
] as const;

/** Only used to pick the direction of the BaZi luck cycles; optional everywhere. */
export const GENDERS = ['MALE', 'FEMALE'] as const;

export const zodiacSchema = z.enum(ZODIACS);
export const numerologySchema = z.enum(NUMEROLOGY_NUMBERS);
export const bloodTypeSchema = z.enum(BLOOD_TYPES);
export const mbtiTypeSchema = z.enum(MBTI_TYPES);
export const genderSchema = z.enum(GENDERS);

export type Zodiac = z.infer<typeof zodiacSchema>;
export type NumerologyNumber = z.infer<typeof numerologySchema>;
export type BloodType = z.infer<typeof bloodTypeSchema>;
export type MbtiType = z.infer<typeof mbtiTypeSchema>;
export type Gender = z.infer<typeof genderSchema>;

/** Calendar date, YYYY-MM-DD. Real-date validity is checked separately. */
export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

/** 24h time, HH:mm */
export const timeOfDaySchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected HH:mm');

/** Epoch milliseconds */
export const epochMsSchema = z.number().int().nonnegative();

/** True when the string is a real calendar date (rejects 2024-02-31). */
export function isRealDate(isoDate: string): boolean {
    const [
        year,
        month,
        day,
    ] = isoDate.split('-').map(Number);

    if (year === undefined || month === undefined || day === undefined) return false;

    const date = new Date(Date.UTC(year, month - 1, day));

    return date.getUTCFullYear() === year
        && date.getUTCMonth() === month - 1
        && date.getUTCDate() === day;
}
