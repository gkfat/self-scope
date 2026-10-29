import { RUNE_ORIENTATION_LABELS } from '../../constants/runes';
import { TAROT_ORIENTATION_LABELS } from '../../constants/tarot';
import { TAROT_CARD_MEANINGS } from '../../constants/tarotMeanings';
import { ZODIAC_LABELS } from '../../constants/zodiacLabels';
import type { DailyHoroscopeResponse } from '../../schemas/api/horoscope.schema';
import type { RuneResponse } from '../../schemas/api/rune.schema';
import type { TarotCardResponse } from '../../schemas/api/tarot.schema';
import type { FixedResultResponse } from '../../schemas/api/fixedResult.schema';
import { buildBasis } from '../../utils/analysisBasis';
import {
    adviceOfBody, readingsOfBody,
} from './common';
import type {
    ReportInterpretation, SystemReportInput,
} from '../types';

const STATE_NOTE = '這是這一天的狀態，隔天就會不同；它不是你長期的特質，所以這份報告沒有影響面向推測，也不會跟你的其他報告合併。';

/** A reading made of a label and a text; empty text is left out. */
const reading = (title: string, text: string, term?: string): ReportInterpretation[] => (text.trim() ? [
    {
        title, text: text.trim(), ...(term ? { term } : {}),
    },
] : []);

/**
 * Today's tarot card as a short report. Everything the daily tarot page used to show is here, in the order of that page:
 * the theme of the day, the keywords, what to watch for (with love, work, self and people), the longer reading (upright
 * and reversed side by side, light and shadow, the inner conflict and the task of growth, what the card has meant and
 * what its picture shows), what to try today and the questions to think over.
 */
export function tarotReportInput(params: {
    date: string;
    card: TarotCardResponse;
    content: FixedResultResponse;
    drawVersion: string;
}): SystemReportInput {
    const {
        card, content, 
    } = params;
    const orientation = TAROT_ORIENTATION_LABELS[card.orientation];
    const term = `tarot:${card.index}:${card.orientation}`;
    const meaning = TAROT_CARD_MEANINGS[card.index];
    const side = meaning?.[card.orientation];

    return {
        system: 'TAROT',
        position: `今日塔羅：${card.roman} ${card.name}（${orientation}）`,
        facts: [
            {
                label: '今日的牌', value: `${card.roman} ${card.name}（${card.englishName}）`, term,
            },
            {
                label: '牌的方向', value: orientation,
            },
            ...(meaning ? [
                {
                    label: '核心主題', value: meaning.themes.join('、'),
                },
            ] : []),
        ],
        interpretations: [
            ...reading('今日主題', content.summary, term),
            ...reading('關鍵字', content.strengths.join('、')),
            ...reading('可以留意的地方', content.blindSpots.join('；')),
            ...reading('感情', content.loveStyle),
            ...reading('工作', content.workStyle),
            ...reading('自我', side?.self ?? ''),
            ...reading('人際', side?.relationship ?? ''),
            ...(meaning ? [
                ...reading('正位核心', meaning.uprightCore),
                ...reading('逆位核心', meaning.reversedCore),
                ...reading('正位與逆位的差異', meaning.contrast),
                ...reading('光明面：資源與優勢', meaning.light),
                ...reading('陰影面：過度的傾向', meaning.shadow),
                ...reading('內在衝突', side?.innerConflict ?? ''),
                ...reading('成長課題', side?.growthTask ?? ''),
                ...reading('傳統牌義', meaning.traditional),
                ...reading('現代詮釋', meaning.modern),
                ...reading('牌面：人物', meaning.symbols.figure),
                ...reading('牌面：顏色', meaning.symbols.colors),
                ...reading('牌面：道具', meaning.symbols.props),
                ...reading('牌面：構圖', meaning.symbols.composition),
            ] : []),
        ],
        traits: [],
        timeFacts: [
            {
                text: `這是 ${params.date} 抽到的牌。`, asOf: params.date,
            },
        ],
        advice: [...(content.growthAdvice.trim() ? [`今天可以試試：${content.growthAdvice.trim()}`] : []), ...(side?.reflections ?? []).map((question) => `想一想：${question}`)],
        notes: [STATE_NOTE],
        disclaimer: content.disclaimer,
        basis: [
            buildBasis('TAROT', {
                date: params.date, drawVersion: params.drawVersion, 
            }),
        ],
    };
}

/**
 * Today's rune as a short report, with everything the daily rune page used to show: the rune and what its name means,
 * the theme of the day, the keywords, what to watch for (named differently for a reversed rune), and what to try.
 */
export function runeReportInput(params: {
    date: string;
    rune: RuneResponse;
    content: FixedResultResponse;
    drawVersion: string;
}): SystemReportInput {
    const {
        rune, content, 
    } = params;
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
            {
                label: '字母表', value: 'Elder Futhark',
            },
        ],
        interpretations: [
            ...reading(content.title, content.summary, term),
            ...reading('關鍵字', content.strengths.join('、')),
            ...reading(rune.orientation === 'reversed' ? '需要留意的面向' : '可以留意的地方', content.blindSpots.join('；')),
            ...reading('感情', content.loveStyle),
            ...reading('工作', content.workStyle),
        ],
        traits: [],
        timeFacts: [
            {
                text: `這是 ${params.date} 抽到的盧恩。`, asOf: params.date,
            },
        ],
        advice: content.growthAdvice.trim() ? [`今天可以試試：${content.growthAdvice.trim()}`] : [],
        notes: [STATE_NOTE],
        disclaimer: content.disclaimer,
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
