import {
    NATAL_GROUPS, NATAL_LABELS, ASPECT_LABELS, type NatalKey,
} from '../../constants/natalLabels';
import {
    aspectReading, bodyInHouseReading, 
} from '../../constants/natalSynthesis';
import type { AspectType } from '../../constants/natal';
import {
    aspectFactLabel, houseFactLabel, natalHighlights, natalInferences,
} from './natal';
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
                label: houseFactLabel(house.house),
                value: `${ZODIAC_LABELS[house.sign]}，宮主星${NATAL_LABELS[house.ruler].name}，${house.bodies.length > 0 ? `星體：${house.bodies.map((body) => NATAL_LABELS[body].name).join('、')}` : '沒有星體'}`,
            })),
            ...natal.chart.aspects.map((aspect) => ({
                label: aspectFactLabel(NATAL_LABELS[aspect.body1].name, ASPECT_LABELS[aspect.type as keyof typeof ASPECT_LABELS], NATAL_LABELS[aspect.body2].name),
                value: `相差 ${aspect.orb.toFixed(1)}°`,
            })),
        ]
        : [];

    const natalReadings: ReportInterpretation[] = natal
        ? NATAL_KEYS.flatMap((key) => {
            const placement = placementOf(key);

            return placement ? [
                {
                    title: `${NATAL_LABELS[key].name}在${ZODIAC_LABELS[placement.sign]}`,
                    text: NATAL_PLACEMENT_MEANINGS[key][placement.sign],
                    // The sun's reading goes with the sun sign card; each other body's with its own placement
                    factLabel: key === 'SUN' ? '太陽星座' : NATAL_LABELS[key].name,
                },
            ] : [];
        })
        : [];

    // Where each body falls among the houses, and how each pair of bodies stands: read from the fact they belong to
    const houseReadings: ReportInterpretation[] = natal
        ? natal.chart.houses.flatMap((house) => house.bodies.map((body) => ({
            title: `${NATAL_LABELS[body].name}在第 ${house.house} 宮`,
            text: bodyInHouseReading(body, house.house),
            factLabel: houseFactLabel(house.house),
        })))
        : [];

    const aspectReadings: ReportInterpretation[] = natal
        ? natal.chart.aspects.map((aspect) => {
            const label = aspectFactLabel(NATAL_LABELS[aspect.body1].name, ASPECT_LABELS[aspect.type as keyof typeof ASPECT_LABELS], NATAL_LABELS[aspect.body2].name);

            return {
                title: `${NATAL_LABELS[aspect.body1].name}與${NATAL_LABELS[aspect.body2].name}`,
                text: aspectReading(aspect.type as AspectType, aspect.body1, aspect.body2, aspect.orb, (body) => NATAL_LABELS[body].name),
                factLabel: label,
            };
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
        interpretations: [
            ...readingsOfBody(params.body, term).map((reading) => ({
                ...reading, overview: true,
            })),
            ...natalReadings,
            ...houseReadings,
            ...aspectReadings,
        ],
        inferences: natal ? [...natalHighlights(natal.chart), ...natalInferences(natal.chart)] : [],
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
