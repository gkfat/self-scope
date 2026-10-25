import {
    describe, expect, it,
} from 'vitest';
import { zodiacFromIsoDate } from './zodiac';

describe('zodiacFromIsoDate', () => {
    it.each([
        ['2000-01-01', 'capricorn'],
        ['2000-01-19', 'capricorn'],
        ['2000-01-20', 'aquarius'],
        ['2000-02-18', 'aquarius'],
        ['2000-02-19', 'pisces'],
        ['2000-03-20', 'pisces'],
        ['2000-03-21', 'aries'],
        ['2000-04-19', 'aries'],
        ['2000-04-20', 'taurus'],
        ['2000-05-21', 'gemini'],
        ['2000-06-21', 'cancer'],
        ['2000-07-22', 'cancer'],
        ['2000-07-23', 'leo'],
        ['2000-08-23', 'virgo'],
        ['2000-09-23', 'libra'],
        ['2000-10-23', 'scorpio'],
        ['2000-11-22', 'sagittarius'],
        ['2000-12-21', 'sagittarius'],
        ['2000-12-22', 'capricorn'],
        ['2000-12-31', 'capricorn'],
    ])('%s -> %s', (date, sign) => {
        expect(zodiacFromIsoDate(date)).toBe(sign);
    });
});
