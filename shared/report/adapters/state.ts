import { HOUSE_REFLECTIONS } from '../../constants/horoscope';
import { RUNE_ORIENTATION_LABELS } from '../../constants/runes';
import {
    RUNE_MEANINGS, runeSide,
} from '../../constants/runeMeanings';
import { TAROT_ORIENTATION_LABELS } from '../../constants/tarot';
import { TAROT_CARD_MEANINGS } from '../../constants/tarotMeanings';
import { ZODIAC_LABELS } from '../../constants/zodiacLabels';
import type { DailyHoroscopeResponse } from '../../schemas/api/horoscope.schema';
import type { RuneResponse } from '../../schemas/api/rune.schema';
import type { TarotCardResponse } from '../../schemas/api/tarot.schema';
import type { FixedResultResponse } from '../../schemas/api/fixedResult.schema';
import { buildBasis } from '../../utils/analysisBasis';
import { readingsOfBody } from './common';
import type {
    ReportInterpretation, SystemReportInput,
} from '../types';

const STATE_NOTE = '這是這一天的狀態，隔天就會不同；它不是你長期的特質，所以這份報告沒有影響面向推測，也不會跟你的其他報告合併。';

/** A reading made of a label and a text; empty text is left out. */
const reading = (title: string, text: string, term?: string, group?: string): ReportInterpretation[] => (text.trim() ? [
    {
        title, text: text.trim(), ...(term ? { term } : {}), ...(group ? { group } : {}),
    },
] : []);

/**
 * The theme of the day with what to watch for, as the one quote at the head of the overview: the summary of the reading,
 * then "但要注意，" and what it says to look out for.
 */
function lead(content: FixedResultResponse, term: string): ReportInterpretation[] {
    const watch = content.blindSpots.map((item) => item.trim()).filter((item) => item !== '').join('；');

    return [
        {
            title: '今日主題', text: `${content.summary.trim()}${watch ? `但要注意，${watch}` : ''}`, term, lead: true,
        },
    ];
}

/** The groups the readings of a draw are shown in, each under a heading of its own */
/** The card of the advice is titled "今天可以試試", so a text that opens with those words does not say them twice */
const tryText = (text: string): string => text.trim().replace(/^今天可以試試[：:，、]?/, '');

/** The keywords of a draw: a group of its own, shown as chips */
const KEYWORD_GROUP = '關鍵字';
const LIFE_GROUP = '生活面向';
const SHADE_GROUP = '光明、陰影與成長';
const FACE_GROUP = '牌面解構';
const MEANING_GROUP = '牌義詮釋';
const RUNE_MEANING_GROUP = '符文詮釋';

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
        // The card, the side that was drawn and what it says on that side (the other side is not the member's today)
        facts: [
            {
                label: '今日的牌', // The second line is the subtitle of the card
                value: `${card.roman} ${card.name}\n${card.englishName}`, term,
            },
            {
                label: '正逆位', value: orientation,
            },
            ...(meaning ? [
                {
                    label: `${orientation}核心`, value: card.orientation === 'upright' ? meaning.uprightCore : meaning.reversedCore,
                },
            ] : []),
        ],
        interpretations: [
            ...lead(content, term),
            // The keywords, then what its picture shows and what it has meant
            ...(meaning ? [
                ...reading(KEYWORD_GROUP, meaning.themes.join('、'), undefined, KEYWORD_GROUP),
                ...reading('人物', meaning.symbols.figure, undefined, FACE_GROUP),
                ...reading('顏色', meaning.symbols.colors, undefined, FACE_GROUP),
                ...reading('道具', meaning.symbols.props, undefined, FACE_GROUP),
                ...reading('構圖', meaning.symbols.composition, undefined, FACE_GROUP),
                ...reading('傳統', meaning.traditional, undefined, MEANING_GROUP),
                ...reading('現代', meaning.modern, undefined, MEANING_GROUP),
            ] : []),
            ...reading('感情', content.loveStyle, undefined, LIFE_GROUP),
            ...reading('工作', content.workStyle, undefined, LIFE_GROUP),
            ...reading('自我', side?.self ?? '', undefined, LIFE_GROUP),
            ...reading('人際', side?.relationship ?? '', undefined, LIFE_GROUP),
            ...(meaning ? [
                ...reading('光明面：資源與優勢', meaning.light, undefined, SHADE_GROUP),
                ...reading('陰影面：過度的傾向', meaning.shadow, undefined, SHADE_GROUP),
                ...reading('內在衝突', side?.innerConflict ?? '', undefined, SHADE_GROUP),
                ...reading('成長課題', side?.growthTask ?? '', undefined, SHADE_GROUP),
            ] : []),
        ],
        traits: [],
        timeFacts: [
            {
                text: `這是 ${params.date} 抽到的牌。`, asOf: params.date,
            },
        ],
        advice: [...(content.growthAdvice.trim() ? [`今天可以試試：${tryText(content.growthAdvice)}`] : []), ...(side?.reflections ?? []).map((question) => `想一想：${question}`)],
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
    const meaning = RUNE_MEANINGS[rune.index];
    const side = runeSide(rune.index, rune.orientation);

    return {
        system: 'RUNE',
        position: `今日盧恩：${rune.glyph} ${rune.name}（${orientation}）`,
        facts: [
            {
                label: '今日的盧恩', value: `${rune.glyph} ${rune.name}`, term,
            },
            {
                label: '正逆位', value: orientation,
            },
            {
                label: '字義', value: rune.meaning,
            },
        ],
        interpretations: [
            ...lead(content, term),
            ...reading(KEYWORD_GROUP, content.strengths.join('、'), undefined, KEYWORD_GROUP),
            // What it has meant, then how it can look in daily life, light and shadow (the same groups as a card)
            ...reading('傳統', meaning?.traditional ?? '', undefined, RUNE_MEANING_GROUP),
            ...reading('現代', meaning?.modern ?? '', undefined, RUNE_MEANING_GROUP),
            ...reading('感情', side?.love ?? '', undefined, LIFE_GROUP),
            ...reading('工作', side?.work ?? '', undefined, LIFE_GROUP),
            ...reading('自我', side?.self ?? '', undefined, LIFE_GROUP),
            ...reading('人際', side?.relationship ?? '', undefined, LIFE_GROUP),
            ...reading('光明面', meaning?.light ?? '', undefined, SHADE_GROUP),
            ...reading('陰影面', meaning?.shadow ?? '', undefined, SHADE_GROUP),
            ...reading('成長課題', meaning?.growthTask ?? '', undefined, SHADE_GROUP),
        ],
        traits: [],
        timeFacts: [
            {
                text: `這是 ${params.date} 抽到的盧恩。`, asOf: params.date,
            },
        ],
        advice: [...(content.growthAdvice.trim() ? [`今天可以試試：${tryText(content.growthAdvice)}`] : []), ...(side?.reflections ?? []).map((question) => `想一想：${question}`)],
        notes: [STATE_NOTE],
        disclaimer: content.disclaimer,
        basis: [
            buildBasis('RUNE', {
                date: params.date, drawVersion: params.drawVersion, 
            }),
        ],
    };
}

/** Three questions to think over: those of the houses the bodies are in, the Moon first, each house once */
const houseQuestions = (horoscope: DailyHoroscopeResponse): string[] => [...new Set(horoscope.bodies.flatMap((item) => HOUSE_REFLECTIONS[item.house - 1] ?? []))].slice(0, 3);

/** Today's sign horoscope as a short report: where each body is, which of the member's houses that is, and its reading. */
export function horoscopeReportInput(params: { horoscope: DailyHoroscopeResponse }): SystemReportInput {
    const { horoscope } = params;
    const signLabel = ZODIAC_LABELS[horoscope.sign];
    const moon = horoscope.bodies[0];

    return {
        system: 'HOROSCOPE',
        position: `今日${signLabel}運勢${moon ? `：${moon.name}在${ZODIAC_LABELS[moon.transitSign]}，落在你的第 ${moon.house} 宮` : ''}`,
        // The overview is the quote; where each body stands is in the title of its house
        facts: [],
        // The quote, then each body as a group of its own, named for what it stands for ("心情與節奏"): its house (which says
        // the sign the body is in: "月亮在雙子座・第 8 宮"), its strengths, its blind spots; the keywords are those of the Moon
        interpretations: [
            ...(moon ? lead(moon.content, `horoscope:${moon.body}:${moon.house}`) : []),
            ...reading(KEYWORD_GROUP, moon?.content.strengths.join('、') ?? '', undefined, KEYWORD_GROUP),
            ...horoscope.bodies.flatMap((item) => readingsOfBody(item.content, `horoscope:${item.body}:${item.house}`).map((reading) => ({
                ...reading,
                title: reading.title === item.content.title ? reading.title.replace(/^(.+?)在第/, `$1在${ZODIAC_LABELS[item.transitSign]}・第`) : reading.title,
                group: item.area.replace(/^今日/, ''),
            }))),
        ],
        traits: [],
        timeFacts: [
            {
                text: `這是 ${horoscope.date} 的天象。`, asOf: horoscope.date,
            },
        ],
        advice: [...(moon && moon.content.growthAdvice.trim() ? [`今天可以試試：${tryText(moon.content.growthAdvice)}`] : []), ...houseQuestions(horoscope).map((question) => `想一想：${question}`)],
        notes: [STATE_NOTE, '以太陽星座作為第 1 宮的整宮制，只讀月亮、太陽、水星、金星與火星這五個移動較快的天體。'],
        disclaimer: horoscope.bodies[0]?.content.disclaimer ?? '星座運勢是象徵性的參考，沒有科學證據。',
        basis: [
            buildBasis('HOROSCOPE', {
                date: horoscope.date, sign: horoscope.sign, 
            }),
        ],
    };
}
