import {
    ASPECT_BALANCE_MARGIN, ASPECT_BALANCE_MIN, ASPECT_BALANCE_READINGS, ASPECT_FLOW, ELEMENT_LEAD_AT, ELEMENT_LEAD_READINGS,
    ELEMENT_MISSING_READINGS, ELEMENT_NAMES, HOUSE_GATHER_AT, MODE_LEAD_AT, MODE_LEAD_READINGS, MODE_NAMES, SIGN_ELEMENTS, SIGN_MODES,
    chartRulerReading, houseGatherReading, type SignElement, type SignMode,
} from '../../constants/natalSynthesis';
import { NATAL_BODIES } from '../../constants/natal';
import { NATAL_PLACEMENT_MEANINGS } from '../../constants/natalPlacementMeanings';
import {
    HOUSE_THEMES, NATAL_GROUPS, NATAL_LABELS, type NatalKey,
} from '../../constants/natalLabels';
import { ZODIAC_LABELS } from '../../constants/zodiacLabels';
import type { NatalChartResponse } from '../../schemas/api/natalChart.schema';
import type { AspectType } from '../../constants/natal';
import type { ReportInference } from '../types';

/** The label of the fact of one house, as the report shows it: the same words in the fact and in what rests on it. */
export const houseFactLabel = (house: number) => `第 ${house} 宮（${HOUSE_THEMES[house - 1] ?? ''}）`;

/** The label of the fact of one aspect: it names the two bodies and the kind, so each aspect has a label of its own. */
export const aspectFactLabel = (first: string, kind: string, second: string) => `相位・${first} ${kind} ${second}`;

const HOUSES_GROUP = {
    key: 'houses', title: '十二宮位歸納',
};
const ASPECTS_GROUP = {
    key: 'aspects', title: '相位歸納',
};

/** A reading written as "title：text" told into its two parts at the first colon. */
function titled(reading: string): { title: string; text: string } {
    const colon = reading.indexOf('：');

    return {
        title: reading.slice(0, colon), text: reading.slice(colon + 1),
    };
}

/**
 * What the chart says as a whole, by fixed rules from its own facts: where the bodies gather, the elements and modes
 * they fall in, where the ruler of the rising sign stands and whether the aspects flow or strain.
 */
export function natalInferences(chart: NatalChartResponse): ReportInference[] {
    const inferences: ReportInference[] = [];

    for (const house of chart.houses) {
        if (house.bodies.length >= HOUSE_GATHER_AT) {
            inferences.push({
                ...houseGatherReading(house.bodies.map((body) => NATAL_LABELS[body].name).join('、'), house.house),
                group: HOUSES_GROUP,
                basedOn: [houseFactLabel(house.house)],
            });
        }
    }

    const first = chart.houses[0];
    const ruler = first?.ruler;
    const rulerHouse = ruler ? chart.houses.find((house) => house.bodies.includes(ruler)) : undefined;

    if (ruler && rulerHouse) {
        inferences.push({
            ...chartRulerReading(NATAL_LABELS[ruler].name, rulerHouse.house),
            group: HOUSES_GROUP,
            basedOn: [...new Set([houseFactLabel(1), houseFactLabel(rulerHouse.house)])],
        });
    }

    const signs = NATAL_BODIES.map((body) => chart.bodies[body].sign);
    const count = <T extends string>(of: (sign: typeof signs[number]) => T, key: T) => signs.filter((sign) => of(sign) === key).length;
    const elements = Object.keys(ELEMENT_NAMES) as SignElement[];
    const modes = Object.keys(MODE_NAMES) as SignMode[];
    const placements = '十顆星體所在的星座';

    for (const element of elements) {
        const n = count((sign) => SIGN_ELEMENTS[sign], element);

        if (n >= ELEMENT_LEAD_AT) {
            inferences.push({
                ...titled(ELEMENT_LEAD_READINGS[element]), group: HOUSES_GROUP, basedOn: [`${placements}（${ELEMENT_NAMES[element]} ${n} 顆）`],
            });
        }

        if (n === 0) {
            inferences.push({
                ...titled(ELEMENT_MISSING_READINGS[element]), group: HOUSES_GROUP, basedOn: [placements],
            });
        }
    }

    for (const mode of modes) {
        const n = count((sign) => SIGN_MODES[sign], mode);

        if (n >= MODE_LEAD_AT) {
            inferences.push({
                ...titled(MODE_LEAD_READINGS[mode]), group: HOUSES_GROUP, basedOn: [`${placements}（${MODE_NAMES[mode]} ${n} 顆）`],
            });
        }
    }

    const flow = chart.aspects.filter((aspect) => ASPECT_FLOW[aspect.type as AspectType] === 'flow').length;
    const strain = chart.aspects.filter((aspect) => ASPECT_FLOW[aspect.type as AspectType] === 'strain').length;

    if (chart.aspects.length >= ASPECT_BALANCE_MIN) {
        const lean = strain >= flow + ASPECT_BALANCE_MARGIN ? 'strain' : flow >= strain + ASPECT_BALANCE_MARGIN ? 'flow' : 'even';

        inferences.push({
            ...ASPECT_BALANCE_READINGS[lean], group: ASPECTS_GROUP, basedOn: [`各星體之間的相位（順暢 ${flow} 組、帶張力 ${strain} 組）`],
        });
    }

    return inferences;
}

const PERSONAL_GROUP = {
    key: 'planets-personal', title: '個人行星',
};
const SOCIAL_GROUP = {
    key: 'planets-social', title: '社會行星',
};
const GENERATION_GROUP = {
    key: 'planets-generation', title: '世代行星',
};

/** The groups the placements are gathered in: the personal planets (with the ascendant), the social planets, the generational ones. */
const HIGHLIGHT_GROUP_OF: Readonly<Record<NatalKey, { key: string; title: string }>> = {
    SUN: PERSONAL_GROUP,
    MOON: PERSONAL_GROUP,
    ASCENDANT: PERSONAL_GROUP,
    MERCURY: PERSONAL_GROUP,
    VENUS: PERSONAL_GROUP,
    MARS: PERSONAL_GROUP,
    JUPITER: SOCIAL_GROUP,
    SATURN: SOCIAL_GROUP,
    URANUS: GENERATION_GROUP,
    NEPTUNE: GENERATION_GROUP,
    PLUTO: GENERATION_GROUP,
};

/** The first thing a reading says: up to its first semicolon, which is where the reviewed readings put their key words. */
const keyWords = (reading: string) => (reading.split('；')[0] ?? reading).replace(/。$/, '');

/**
 * The key words of each placement, one for each, in the order the report groups them (the three signs, thinking, loving
 * and acting, the social planets, the generational ones), from the reviewed reading of that placement: the tradition's
 * own words, cut short, not a conclusion of ours. The fact each rests on is the placement itself.
 */
export function natalHighlights(chart: NatalChartResponse): ReportInference[] {
    const placementOf = (key: NatalKey) => (key === 'ASCENDANT' ? chart.ascendant : chart.bodies[key]);

    return NATAL_GROUPS.flatMap((group) => group.keys).map((key) => {
        const placement = placementOf(key);

        return {
            title: `${NATAL_LABELS[key].name}${ZODIAC_LABELS[placement.sign]}`,
            text: keyWords(NATAL_PLACEMENT_MEANINGS[key][placement.sign]),
            group: HIGHLIGHT_GROUP_OF[key],
            kind: 'SYSTEM_INTERPRETATION' as const,
            basedOn: [NATAL_LABELS[key].name],
        };
    });
}
