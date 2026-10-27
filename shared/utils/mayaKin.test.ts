import {
    describe, expect, it,
} from 'vitest';
import {
    kinFromNumber, kinName, kinOf, sealName, toneName,
} from './mayaKin';
import {
    GALACTIC_TONES, KIN_COUNT, SOLAR_SEALS,
} from '../constants/mayaKin';

/*
 * Expected values come from the month table of a published Dreamspell lookup table (Kin = the table value for the
 * year and month, plus the day of the month, minus 260 when over 260), not from kinOf. The page's own extra
 * rule for March of a leap year is left out on purpose: the table's own numbers show it counts no 29 February
 * (2012: Feb 143, Mar 171, Apr 202), and the same site's daily pages repeat a Kin on 31 March and 1 April when
 * the rule is applied. 2012-12-21 = Kin 207 (Blue Crystal Hand) is the widely quoted value for that day.
 */
const KNOWN: Array<[string, number]> = [
    // The earliest year in the table
    ['1910-01-01', 63],
    // 1900s, after a leap year's February
    ['1912-10-05', 30],
    ['1987-06-23', 1],
    ['1987-07-26', 34],
    ['1992-10-24', 129],
    // Over the year boundary, and a leap year
    ['1999-12-31', 152],
    ['2000-01-01', 153],
    ['2000-02-28', 211],
    ['2000-03-01', 212],
    ['2012-02-28', 171],
    ['2012-03-01', 172],
    ['2012-12-21', 207],
    // The end of one 260-day round and the start of the next
    ['2013-02-12', 260],
    ['2013-02-13', 1],
    ['2024-12-31', 177],
];

describe('kinOf', () => {
    it.each(KNOWN)('%s is Kin %s', (date, kin) => {
        expect(kinOf(date).kinNumber).toBe(kin);
    });

    it('takes the Kin of 28 February for 29 February', () => {
        for (const year of [
            1912,
            1996,
            2000,
            2012,
            2024,
        ]) {
            expect(kinOf(`${year}-02-29`), String(year)).toEqual(kinOf(`${year}-02-28`));
        }

        expect(kinOf('1996-02-28').kinNumber).toBe(51);
    });

    it('counts 1 March as the day after 28 February, so 29 February takes no number', () => {
        for (const year of [
            1912,
            1996,
            2000,
            2012,
            2024,
        ]) {
            const feb28 = kinOf(`${year}-02-28`).kinNumber;
            const mar1 = kinOf(`${year}-03-01`).kinNumber;

            expect(mar1, String(year)).toBe(feb28 === KIN_COUNT ? 1 : feb28 + 1);
        }
    });

    it('adds one a day, wrapping from 260 to 1, over every day from 1900 to 2100 except 29 February', () => {
        let previous = kinOf('1900-01-01').kinNumber;

        for (let time = Date.UTC(1900, 0, 2); time <= Date.UTC(2100, 11, 31); time += 24 * 60 * 60 * 1000) {
            const iso = new Date(time).toISOString().slice(0, 10);
            const current = kinOf(iso).kinNumber;

            if (iso.endsWith('-02-29')) {
                expect(current, iso).toBe(previous);
            } else {
                expect(current, iso).toBe(previous === KIN_COUNT ? 1 : previous + 1);
            }

            previous = current;
        }
    });

    it('repeats every 52 years', () => {
        // 52 years hold 13 leap days; without them 52 x 365 = 18980 = 73 x 260 counted days
        expect(kinOf('1990-05-17').kinNumber).toBe(kinOf('2042-05-17').kinNumber);
    });

    it('rejects text that is not a real date', () => {
        expect(() => kinOf('2023-02-29')).toThrow(RangeError);
        expect(() => kinOf('2023-13-01')).toThrow(RangeError);
        expect(() => kinOf('20230101')).toThrow(RangeError);
    });
});

describe('kinFromNumber', () => {
    it('gets the seal and the tone from the number', () => {
        expect(kinFromNumber(1)).toEqual({
            kinNumber: 1, solarSeal: 1, galacticTone: 1,
        });
        expect(kinFromNumber(207)).toEqual({
            kinNumber: 207, solarSeal: 7, galacticTone: 12,
        });
        expect(kinFromNumber(260)).toEqual({
            kinNumber: 260, solarSeal: 20, galacticTone: 13,
        });
    });

    it('gives each of the 260 Kin its own pair of seal and tone', () => {
        const pairs = new Set<string>();

        for (let kin = 1; kin <= KIN_COUNT; kin++) {
            const {
                solarSeal, galacticTone, 
            } = kinFromNumber(kin);

            pairs.add(`${solarSeal}_${galacticTone}`);
        }

        expect(pairs.size).toBe(KIN_COUNT);
    });
});

describe('seal and tone names', () => {
    it('lists 20 seals and 13 tones in order, with colours repeating red, white, blue, yellow', () => {
        expect(SOLAR_SEALS).toHaveLength(20);
        expect(GALACTIC_TONES).toHaveLength(13);
        expect(SOLAR_SEALS.map((seal) => seal.index)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
        expect(SOLAR_SEALS.slice(0, 4).map((seal) => seal.color)).toEqual([
            'red',
            'white',
            'blue',
            'yellow',
        ]);
        expect(SOLAR_SEALS[19]?.color).toBe('yellow');
    });

    it('matches the names of known Kin: 207 is the Blue Crystal Hand, 34 the White Wizard', () => {
        const name = (kinNumber: number) => {
            const {
                solarSeal, galacticTone, 
            } = kinFromNumber(kinNumber);

            return [
                GALACTIC_TONES[galacticTone - 1]?.englishName,
                SOLAR_SEALS[solarSeal - 1]?.color,
                SOLAR_SEALS[solarSeal - 1]?.englishName,
            ];
        };

        expect(name(207)).toEqual([
            'Crystal',
            'blue',
            'Hand',
        ]);
        expect(name(34)).toEqual([
            'Galactic',
            'white',
            'Wizard',
        ]);
        expect(name(1)).toEqual([
            'Magnetic',
            'red',
            'Dragon',
        ]);
    });
});

describe('names in Chinese', () => {
    it('writes the seal with its colour and the Kin as tone then seal', () => {
        expect(sealName(1)).toBe('紅龍');
        expect(sealName(14)).toBe('白巫師');
        expect(sealName(7)).toBe('藍手');
        expect(sealName(20)).toBe('黃太陽');
        expect(toneName(12)).toBe('水晶');
        expect(kinName(kinFromNumber(207))).toBe('水晶的藍手');
        expect(kinName(kinFromNumber(1))).toBe('磁性的紅龍');
        expect(kinName(kinFromNumber(34))).toBe('銀河星系的白巫師');
    });

    it('names all 260 Kin differently', () => {
        const names = new Set<string>();

        for (let kin = 1; kin <= KIN_COUNT; kin++) names.add(kinName(kinFromNumber(kin)));

        expect(names.size).toBe(KIN_COUNT);
    });

    it('rejects a seal or tone out of range', () => {
        expect(() => sealName(0)).toThrow(RangeError);
        expect(() => sealName(21)).toThrow(RangeError);
        expect(() => toneName(14)).toThrow(RangeError);
    });
});
