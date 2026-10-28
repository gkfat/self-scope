import {
    HOUSE_THEMES, NATAL_GROUPS, NATAL_LABELS, ASPECT_LABELS, type NatalKey, 
} from '../../constants/natalLabels';
import { NATAL_PLACEMENT_MEANINGS } from '../../constants/natalPlacementMeanings';
import { ZODIAC_LABELS } from '../../constants/zodiacLabels';
import { zodiacTermsOf } from '../../ontology/mappings/zodiac';
import type { NatalChartResponse } from '../../schemas/api/natalChart.schema';
import type { Zodiac } from '../../schemas/common';
import { buildBasis } from '../../utils/analysisBasis';
import {
    adviceOfBody, readingsOfBody, type FixedContentBody,
} from './common';
import type {
    ReportFact, ReportInterpretation, SystemReportInput,
} from '../types';

/** What the report says when the birth time or city is missing, which the houses and the ascendant need. */
export const NATAL_MISSING_NOTE = '填寫出生時間與出生城市，就能看到上升、宮位、宮主星與星體之間的相位。';

const NATAL_KEYS: readonly NatalKey[] = NATAL_GROUPS.flatMap((group) => group.keys);

/**
 * The sun-sign report, and the birth chart when the member has given a birth time and city: the signs of the bodies,
 * the houses with their rulers and the aspects as facts, and the reviewed reading of each placement. Without them the
 * chart is simply not there (nothing is guessed) and a note says what would add it.
 */
export function zodiacReportInput(params: {
    zodiac: Zodiac;
    birthDate: string;
    body: FixedContentBody;
    natal: { chart: NatalChartResponse; birthTime: string; birthPlace: string } | null;
}): SystemReportInput {
    const { natal } = params;
    const [term] = zodiacTermsOf(params.zodiac);
    const signLabel = ZODIAC_LABELS[params.zodiac];

    const placementOf = (key: NatalKey) => (key === 'ASCENDANT' ? natal?.chart.ascendant : natal?.chart.bodies[key]);

    const natalFacts: ReportFact[] = natal
        ? [
            ...NATAL_KEYS.flatMap((key) => {
                const placement = placementOf(key);

                return placement ? [
                    {
                        label: NATAL_LABELS[key].name, value: `${ZODIAC_LABELS[placement.sign]} ${placement.degree}°`,
                    },
                ] : [];
            }),
            ...natal.chart.houses.map((house) => ({
                label: `第 ${house.house} 宮（${HOUSE_THEMES[house.house - 1] ?? ''}）`,
                value: `${ZODIAC_LABELS[house.sign]}，宮主星${NATAL_LABELS[house.ruler].name}，${house.bodies.length > 0 ? `星體：${house.bodies.map((body) => NATAL_LABELS[body].name).join('、')}` : '沒有星體'}`,
            })),
            ...natal.chart.aspects.map((aspect) => ({
                label: '相位',
                value: `${NATAL_LABELS[aspect.body1].name} ${ASPECT_LABELS[aspect.type as keyof typeof ASPECT_LABELS]} ${NATAL_LABELS[aspect.body2].name}（相差 ${aspect.orb.toFixed(1)}°）`,
            })),
        ]
        : [];

    const natalReadings: ReportInterpretation[] = natal
        ? NATAL_KEYS.flatMap((key) => {
            const placement = placementOf(key);

            return placement ? [
                {
                    title: `${NATAL_LABELS[key].name}在${ZODIAC_LABELS[placement.sign]}`, text: NATAL_PLACEMENT_MEANINGS[key][placement.sign],
                },
            ] : [];
        })
        : [];

    return {
        system: 'ZODIAC',
        position: `太陽${signLabel}`,
        facts: [
            {
                label: '太陽星座', value: signLabel, term,
            }, ...natalFacts,
        ],
        interpretations: [...readingsOfBody(params.body, term), ...natalReadings],
        traits: zodiacTermsOf(params.zodiac),
        advice: adviceOfBody(params.body),
        notes: natal ? [] : [NATAL_MISSING_NOTE],
        disclaimer: params.body.disclaimer,
        basis: [
            buildBasis('ZODIAC', { birthDate: params.birthDate }), ...(natal
                ? [
                    buildBasis('NATAL_CHART', {
                        birthDate: params.birthDate, birthTime: natal.birthTime, birthPlace: natal.birthPlace,
                    }),
                ]
                : []),
        ],
    };
}
