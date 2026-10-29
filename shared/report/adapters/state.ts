import { RUNE_ORIENTATION_LABELS } from '../../constants/runes';
import { TAROT_ORIENTATION_LABELS } from '../../constants/tarot';
import { ZODIAC_LABELS } from '../../constants/zodiacLabels';
import type { DailyHoroscopeResponse } from '../../schemas/api/horoscope.schema';
import type { RuneResponse } from '../../schemas/api/rune.schema';
import type { TarotCardResponse } from '../../schemas/api/tarot.schema';
import type { FixedResultResponse } from '../../schemas/api/fixedResult.schema';
import { buildBasis } from '../../utils/analysisBasis';
import {
    adviceOfBody, readingsOfBody,
} from './common';
import type { SystemReportInput } from '../types';

const STATE_NOTE = '這是這一天的狀態，隔天就會不同；它不是你長期的特質，所以這份報告沒有影響地圖，也不會跟你的其他報告合併。';

/** Today's tarot card as a short report: the card, what the tradition says of it, and the advice of the reading. */
export function tarotReportInput(params: {
    date: string;
    card: TarotCardResponse;
    content: FixedResultResponse;
    drawVersion: string;
}): SystemReportInput {
    const { card } = params;
    const orientation = TAROT_ORIENTATION_LABELS[card.orientation];
    const term = `tarot:${card.index}:${card.orientation}`;

    return {
        system: 'TAROT',
        position: `今日塔羅：${card.roman} ${card.name}（${orientation}）`,
        facts: [
            {
                label: '今日的牌', value: `${card.roman} ${card.name}（${card.englishName}）`, term,
            }, {
                label: '牌的方向', value: orientation,
            },
        ],
        interpretations: readingsOfBody(params.content, term),
        traits: [],
        timeFacts: [
            {
                text: `這是 ${params.date} 抽到的牌。`, asOf: params.date,
            },
        ],
        advice: adviceOfBody(params.content),
        notes: [STATE_NOTE],
        disclaimer: params.content.disclaimer,
        basis: [
            buildBasis('TAROT', {
                date: params.date, drawVersion: params.drawVersion, 
            }),
        ],
    };
}

/** Today's rune as a short report. */
export function runeReportInput(params: {
    date: string;
    rune: RuneResponse;
    content: FixedResultResponse;
    drawVersion: string;
}): SystemReportInput {
    const { rune } = params;
    const orientation = RUNE_ORIENTATION_LABELS[rune.orientation];
    const term = `rune:${rune.index}:${rune.orientation}`;

    return {
        system: 'RUNE',
        position: `今日盧恩：${rune.glyph} ${rune.name}（${orientation}）`,
        facts: [
            {
                label: '今日的盧恩', value: `${rune.glyph} ${rune.name}`, term,
            },
            {
                label: '字義', value: rune.meaning,
            },
            {
                label: '符文的方向', value: orientation,
            },
        ],
        interpretations: readingsOfBody(params.content, term),
        traits: [],
        timeFacts: [
            {
                text: `這是 ${params.date} 抽到的盧恩。`, asOf: params.date,
            },
        ],
        advice: adviceOfBody(params.content),
        notes: [STATE_NOTE],
        disclaimer: params.content.disclaimer,
        basis: [
            buildBasis('RUNE', {
                date: params.date, drawVersion: params.drawVersion, 
            }),
        ],
    };
}

/** Today's sign horoscope as a short report: where each body is, which of the member's houses that is, and its reading. */
export function horoscopeReportInput(params: { horoscope: DailyHoroscopeResponse }): SystemReportInput {
    const { horoscope } = params;
    const signLabel = ZODIAC_LABELS[horoscope.sign];
    const moon = horoscope.bodies[0];

    return {
        system: 'HOROSCOPE',
        position: `今日${signLabel}運勢${moon ? `：${moon.name}在${ZODIAC_LABELS[moon.transitSign]}，落在你的第 ${moon.house} 宮` : ''}`,
        facts: horoscope.bodies.map((item) => ({
            label: item.name,
            value: `在${ZODIAC_LABELS[item.transitSign]}，落在以${signLabel}為第 1 宮的第 ${item.house} 宮（${item.area}）`,
            term: `horoscope:${item.body}:${item.house}`,
        })),
        interpretations: horoscope.bodies.flatMap((item) => readingsOfBody(item.content, `horoscope:${item.body}:${item.house}`)),
        traits: [],
        timeFacts: [
            {
                text: `這是 ${horoscope.date} 的天象。`, asOf: horoscope.date,
            },
        ],
        advice: horoscope.bodies.flatMap((item) => adviceOfBody(item.content)),
        notes: [STATE_NOTE, '以太陽星座作為第 1 宮的整宮制，只讀月亮、太陽、水星、金星與火星這五個移動較快的天體。'],
        disclaimer: horoscope.bodies[0]?.content.disclaimer ?? '星座運勢是象徵性的參考，沒有科學證據。',
        basis: [
            buildBasis('HOROSCOPE', {
                date: horoscope.date, sign: horoscope.sign, 
            }),
        ],
    };
}
