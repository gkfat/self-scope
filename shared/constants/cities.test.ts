import {
    describe, expect, it,
} from 'vitest';
import {
    CITIES, cityLabel, findCity,
} from './cities';

describe('CITIES', () => {
    it('has unique codes', () => {
        expect(new Set(CITIES.map((city) => city.code)).size).toBe(CITIES.length);
    });

    it('uses time zones the runtime knows, so historical offsets can be applied', () => {
        for (const city of CITIES) {
            expect(() => new Intl.DateTimeFormat('en-US', { timeZone: city.timeZone }), city.code).not.toThrow();
        }
    });

    it('has plausible coordinates', () => {
        for (const city of CITIES) {
            expect(Math.abs(city.lat), city.code).toBeLessThanOrEqual(90);
            expect(Math.abs(city.lng), city.code).toBeLessThanOrEqual(180);
        }
    });

    it('includes overseas cities and finds them by code', () => {
        expect(findCity('fr-paris')?.timeZone).toBe('Europe/Paris');
        expect(findCity('gb-london')?.timeZone).toBe('Europe/London');
        expect(findCity('nowhere')).toBeUndefined();
    });

    it('has an English name for every city and shows both in the label', () => {
        for (const city of CITIES) expect(city.nameEn.trim(), city.code).not.toBe('');

        expect(cityLabel(findCity('fr-paris') as never)).toBe('巴黎 (Paris)');
        expect(cityLabel(findCity('tw-taipei') as never)).toBe('台北市 (Taipei)');
    });
});
