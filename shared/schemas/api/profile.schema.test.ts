import {
    describe, expect, it,
} from 'vitest';
import {
    birthDataSchema, profileInputSchema,
} from './profile.schema';

const valid = {
    birthDate: '1995-03-25',
    zodiac: 'aries',
} as const;

describe('birthDataSchema', () => {
    it('accepts birthDate and zodiac alone', () => {
        expect(birthDataSchema.safeParse(valid).success).toBe(true);
    });

    it('accepts optional time and a preset city', () => {
        const result = birthDataSchema.safeParse({
            ...valid, birthTime: '08:30', birthPlace: 'tw-taipei',
        });

        expect(result.success).toBe(true);
    });

    it('rejects a missing zodiac or birthDate', () => {
        expect(birthDataSchema.safeParse({ birthDate: '1995-03-25' }).success).toBe(false);
        expect(birthDataSchema.safeParse({ zodiac: 'aries' }).success).toBe(false);
    });

    it('rejects a zodiac that does not match the birth date', () => {
        expect(birthDataSchema.safeParse({
            ...valid, zodiac: 'leo',
        }).success).toBe(false);
    });

    it('rejects dates that do not exist or are in the future', () => {
        expect(birthDataSchema.safeParse({
            birthDate: '1995-02-31', zodiac: 'pisces',
        }).success).toBe(false);
        expect(birthDataSchema.safeParse({
            birthDate: '2999-03-25', zodiac: 'aries',
        }).success).toBe(false);
    });

    it('rejects a city that is not in the preset list', () => {
        expect(birthDataSchema.safeParse({
            ...valid, birthPlace: 'free text',
        }).success).toBe(false);
    });

    it('rejects a malformed time', () => {
        expect(birthDataSchema.safeParse({
            ...valid, birthTime: '25:00',
        }).success).toBe(false);
    });
});

describe('profileInputSchema', () => {
    it('defaults blood type to UNKNOWN and leaves mbti undefined', () => {
        const result = profileInputSchema.parse({ birthData: valid });

        expect(result.bloodType).toBe('UNKNOWN');
        expect(result.mbti).toBeUndefined();
    });

    it('defaults gender to not provided', () => {
        expect(profileInputSchema.parse({ birthData: valid }).gender).toBeNull();
    });

    it('accepts MALE, FEMALE and an explicit null', () => {
        for (const gender of [
            'MALE',
            'FEMALE',
            null,
        ] as const) {
            expect(profileInputSchema.parse({
                birthData: valid, gender,
            }).gender).toBe(gender);
        }
    });

    it('rejects any other gender value', () => {
        for (const gender of [
            'male',
            'OTHER',
            '',
            1,
        ]) {
            expect(profileInputSchema.safeParse({
                birthData: valid, gender,
            }).success).toBe(false);
        }
    });

    it('rejects an unknown blood type or mbti', () => {
        expect(profileInputSchema.safeParse({
            birthData: valid, bloodType: 'C',
        }).success).toBe(false);
        expect(profileInputSchema.safeParse({
            birthData: valid, mbti: 'ABCD',
        }).success).toBe(false);
    });
});
