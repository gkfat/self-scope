import {
    describe, expect, it,
} from 'vitest';
import { baziRequestSchema } from './bazi.schema';

describe('baziRequestSchema', () => {
    it('accepts a birth date alone', () => {
        expect(baziRequestSchema.safeParse({ birthDate: '1989-10-27' }).success).toBe(true);
    });

    it('accepts time, a preset city and a gender, and explicit nulls', () => {
        expect(baziRequestSchema.safeParse({
            birthDate: '1989-10-27', birthTime: '06:00', birthPlace: 'tw-taipei', gender: 'MALE',
        }).success).toBe(true);
        expect(baziRequestSchema.safeParse({
            birthDate: '1989-10-27', birthTime: null, birthPlace: null, gender: null,
        }).success).toBe(true);
    });

    it('rejects a missing, malformed, impossible or future birth date', () => {
        for (const birthDate of [
            undefined,
            '',
            '1989/10/27',
            '1989-13-01',
            '2023-02-29',
            '2999-01-01',
        ]) {
            expect(baziRequestSchema.safeParse({ birthDate }).success, String(birthDate)).toBe(false);
        }
    });

    it('rejects a malformed time', () => {
        for (const birthTime of [
            '25:00',
            '6:00',
            '06:60',
            'noon',
        ]) {
            expect(baziRequestSchema.safeParse({
                birthDate: '1989-10-27', birthTime,
            }).success, birthTime).toBe(false);
        }
    });

    it('rejects a city that is not in the preset list', () => {
        expect(baziRequestSchema.safeParse({
            birthDate: '1989-10-27', birthPlace: 'atlantis',
        }).success).toBe(false);
    });

    it('rejects any gender value other than MALE and FEMALE', () => {
        for (const gender of [
            'male',
            'OTHER',
            '',
            0,
        ]) {
            expect(baziRequestSchema.safeParse({
                birthDate: '1989-10-27', gender,
            }).success, String(gender)).toBe(false);
        }
    });
});
