import {
    ZODIACS, type Zodiac,
} from '../../schemas/common';
import { keywordRule } from './keywordRule';
import type { MappingEntry } from '../schema';

/** The twelve signs, e.g. "zodiac:aries". */
export const ZODIAC_TERMS: readonly string[] = ZODIACS.map((sign) => `zodiac:${sign}`);

export const zodiacTermsOf = (sign: Zodiac): string[] => [`zodiac:${sign}`];

const rule = keywordRule('ZODIAC');

/**
 * The rule is by keyword: a sign points at an axis end where the keywords of the sign, as the reviewed readings list them
 * and as popular astrology writing names them, say what the end describes. Popular writing agrees on the keywords
 * checked (Aries bold and direct, Taurus steady and loyal, Gemini curious and communicative, Cancer caring, Leo leading
 * and optimistic, Virgo meticulous, Libra harmonizing and aesthetic, Pisces gentle); for the others (Scorpio, Sagittarius,
 * Capricorn, Aquarius) the keywords are those of the project's reviewed readings. It is traditional astrology, with no
 * scientific evidence behind it.
 */
export const ZODIAC_MAPPINGS: readonly MappingEntry[] = [
    ...rule('zodiac:aries', 'B2.A', 'C3.A'), // acts first, direct and frank
    ...rule('zodiac:taurus', 'E1.A', 'B4.A', 'E5.A'), // steady, keeps at it, loyal
    ...rule('zodiac:gemini', 'A4.A', 'B4.B', 'C2.A'), // curious, adapts, a flexible communicator
    ...rule('zodiac:cancer', 'C1.A', 'D2.A', 'D1.A', 'C2.B'), // fine feeling, looks after others, values closeness, goes quiet and expects to be guessed
    ...rule('zodiac:leo', 'D5.A', 'C2.A', 'C4.A'), // leads, warm self-expression, optimistic
    ...rule('zodiac:virgo', 'A5.A', 'B5.A', 'E2.B', 'D2.A', 'C4.B'), // careful, orderly, practical, glad to help, sees the risks first and worries
    ...rule('zodiac:libra', 'D3.A', 'D1.B', 'A6.A', 'C3.B'), // coordinates, fair, an eye for beauty, tactful
    ...rule('zodiac:scorpio', 'B4.A', 'A4.B', 'D2.B'), // firm will, goes in deep, keeps its privacy
    ...rule('zodiac:sagittarius', 'C4.A', 'A4.A', 'C3.A'), // optimistic, wide view, frank
    ...rule('zodiac:capricorn', 'E6.A', 'B4.A', 'B1.A', 'E2.B', 'C1.B'), // responsible, disciplined, plans, steady under pressure
    ...rule('zodiac:aquarius', 'A2.A', 'A3.A', 'D1.B'), // thinks for itself, new ideas, objective
    ...rule('zodiac:pisces', 'C1.A', 'A1.B', 'D6.A'), // empathy, intuition, gentle and accepting
];
