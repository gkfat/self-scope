import {
    describe, expect, it,
} from 'vitest';
import { zodiacResultQuerySchema } from './fixedResult.schema';

describe('zodiacResultQuerySchema', () => {
    it('accepts a real birth date', () => {
        expect(zodiacResultQuerySchema.safeParse({ birthDate: '1990-06-15' }).success).toBe(true);
    });

    it('accepts a sign by name', () => {
        expect(zodiacResultQuerySchema.safeParse({ sign: 'gemini' }).success).toBe(true);
    });

    it.each([
        {},
        { birthDate: '1990-02-31' },
        { birthDate: 'tomorrow' },
        { sign: 'ophiuchus' },
    ])('rejects %j', (query) => {
        expect(zodiacResultQuerySchema.safeParse(query).success).toBe(false);
    });
});
