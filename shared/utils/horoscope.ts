import {
    HOROSCOPE_BODIES, HOUSE_COUNT, type HoroscopeBody,
} from '../constants/horoscope';
import { ZODIACS } from '../schemas/common';
import type { Zodiac } from '../schemas/common';

/**
 * The house of a body for someone whose own sign is the first house (whole signs): the same sign is house 1, the
 * next sign house 2, and so on round to house 12.
 */
export function houseOf(memberSign: Zodiac, bodySign: Zodiac): number {
    const memberIndex = ZODIACS.indexOf(memberSign);
    const bodyIndex = ZODIACS.indexOf(bodySign);

    return ((bodyIndex - memberIndex + HOUSE_COUNT) % HOUSE_COUNT) + 1;
}

export type BodyHouse = {
    body: HoroscopeBody;
    /** The sign the body is in today */
    sign: Zodiac;
    /** Which house of the member's that is, 1 to 12 */
    house: number;
};

/** Where today's bodies fall for a member: the sign each is in and the house it makes of the member's own. */
/** Changing what this calculates: raise RULE_VERSIONS.HOROSCOPE in shared/utils/analysisBasis.ts. */
export function houses(memberSign: Zodiac, signOf: Record<HoroscopeBody, Zodiac>): BodyHouse[] {
    return HOROSCOPE_BODIES.map((body) => ({
        body, sign: signOf[body], house: houseOf(memberSign, signOf[body]),
    }));
}
