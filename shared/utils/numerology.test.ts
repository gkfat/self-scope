import {
    describe, expect, it,
} from 'vitest';
import {
    ageOn, birthdayNumber, lifePathNumber, personalYearNumber, reduceNumber,
} from './numerology';

describe('reduceNumber', () => {
    it('adds digits until one is left', () => {
        expect(reduceNumber(5)).toBe(5);
        expect(reduceNumber(10)).toBe(1);
        expect(reduceNumber(38)).toBe(11);
        expect(reduceNumber(99)).toBe(9);
    });

    it('keeps the master numbers', () => {
        expect(reduceNumber(11)).toBe(11);
        expect(reduceNumber(22)).toBe(22);
        expect(reduceNumber(33)).toBe(33);
    });
});

describe('lifePathNumber', () => {
    it('reduces year, month and day separately before adding', () => {
        // 1990 -> 19 -> 10 -> 1, month 6, 15 -> 6; 1 + 6 + 6 = 13 -> 4
        expect(lifePathNumber('1990-06-15')).toBe(4);
    });

    it('keeps a master number as the result', () => {
        // 1995 -> 24 -> 6, month 3 -> 3, 25 -> 7; 6 + 3 + 7 = 16 -> 7
        expect(lifePathNumber('1995-03-25')).toBe(7);
        // 1992 -> 21 -> 3, month 11, 29 -> 11; 3 + 11 + 11 = 25 -> 7
        expect(lifePathNumber('1992-11-29')).toBe(7);
        // 2000 -> 2, month 2, 29 -> 11; 2 + 2 + 11 = 15 -> 6
        expect(lifePathNumber('2000-02-29')).toBe(6);
        // 1979 -> 26 -> 8, month 11, 22 -> 22; 8 + 11 + 22 = 41 -> 5
        expect(lifePathNumber('1979-11-22')).toBe(5);
        // 1989 -> 27 -> 9, month 2, 11 -> 11; 9 + 2 + 11 = 22
        expect(lifePathNumber('1989-02-11')).toBe(22);
    });

    it('rejects a date that does not exist', () => {
        expect(() => lifePathNumber('1990-02-31')).toThrow();
    });
});

describe('birthdayNumber', () => {
    it('reduces the day of the month', () => {
        expect(birthdayNumber('1990-06-15')).toBe(6);
        expect(birthdayNumber('1990-06-22')).toBe(22);
        expect(birthdayNumber('1990-06-05')).toBe(5);
    });
});

describe('personalYearNumber', () => {
    it('uses the birth month and day with the given year', () => {
        // month 6, 15 -> 6, 2026 -> 10 -> 1; 6 + 6 + 1 = 13 -> 4
        expect(personalYearNumber('1990-06-15', 2026)).toBe(4);
    });
});

describe('ageOn', () => {
    it('counts the birthday only once it has passed', () => {
        expect(ageOn('1990-06-15', '2026-06-14')).toBe(35);
        expect(ageOn('1990-06-15', '2026-06-15')).toBe(36);
    });
});
