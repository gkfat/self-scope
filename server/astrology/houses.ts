import {
    SIGN_RULERS, type NatalBody,
} from '../../shared/constants/natal';
import { HOUSE_COUNT } from '../../shared/constants/horoscope';
import {
    ZODIACS, type Zodiac, 
} from '../../shared/schemas/common';
import { houseOf } from '../../shared/utils/horoscope';

export type House = {
    /** 1 to 12 */
    house: number;
    /** The sign on the cusp of the house */
    sign: Zodiac;
    /** The planet that rules that sign */
    ruler: NatalBody;
    /** The bodies that fall in the house */
    bodies: NatalBody[];
};

/**
 * Whole-sign houses, counted from the sign of the ascendant: that sign is the first house, the next sign the second,
 * and so on round to the twelfth. Each house is ruled by the planet that rules its sign.
 *
 * Changing what this calculates: raise RULE_VERSIONS.NATAL_CHART in shared/utils/analysisBasis.ts.
 */
export function buildHouses(ascendantSign: Zodiac, bodySigns: Readonly<Record<NatalBody, Zodiac>>): House[] {
    const firstIndex = ZODIACS.indexOf(ascendantSign);
    const bodies = Object.entries(bodySigns) as Array<[NatalBody, Zodiac]>;

    return Array.from({ length: HOUSE_COUNT }, (_, index) => {
        const sign = ZODIACS[(firstIndex + index) % HOUSE_COUNT] as Zodiac;

        return {
            house: index + 1,
            sign,
            ruler: SIGN_RULERS[sign],
            bodies: bodies.filter(([, bodySign]) => houseOf(ascendantSign, bodySign) === index + 1).map(([body]) => body),
        };
    });
}
