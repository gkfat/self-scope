import type { Zodiac } from '../schemas/common';
import type {
    AspectType, NatalBody,  
} from './natal';

/**
 * What a birth chart says beyond each placement: where a body falls among the houses, how two bodies stand to each
 * other, and the shape of the chart as a whole (where the bodies gather, the mix of elements and modes, where the chart
 * ruler is, whether the aspects flow or strain). Fixed text, the same for everyone with that placement, written once
 * and reviewed, never produced by AI (RULE-017). The wording is tentative and never diagnostic or predictive.
 */

/** What each body stands for, as a short phrase that fits into a sentence. */
export const BODY_ROLES: Readonly<Record<NatalBody, string>> = {
    SUN: '自我認同與生命力',
    MOON: '情感需求與安全感',
    MERCURY: '思考與溝通',
    VENUS: '愛與價值感',
    MARS: '行動力與衝勁',
    JUPITER: '成長與機會',
    SATURN: '責任與自我要求',
    URANUS: '求變與獨立',
    NEPTUNE: '理想與想像',
    PLUTO: '深層轉化與掌控',
};

/** What a body does in the area of the house it falls in. */
const BODY_IN_AREA: Readonly<Record<NatalBody, string>> = {
    SUN: '最想被看見，也最容易發光',
    MOON: '最容易感到安心，也最容易被觸動',
    MERCURY: '最常動腦，也最想表達與交流',
    VENUS: '最容易感到愉悅與連結',
    MARS: '最容易投入行動與競爭',
    JUPITER: '最容易遇到機會，也最想往外擴展',
    SATURN: '最需要耐心與責任，要慢慢練出實力',
    URANUS: '最想打破常規，嘗試不一樣的方式',
    NEPTUNE: '最容易投射理想，也容易看得模糊',
    PLUTO: '最容易經歷深層的轉變與重整',
};

/** The three slowest bodies stay in one house for years: what they say is a shared background, not a personal trait. */
export const GENERATIONAL_BODIES: readonly NatalBody[] = [
    'URANUS',
    'NEPTUNE',
    'PLUTO',
];

/** The part of life each of the twelve houses covers, as a phrase that fits into a sentence. */
export const HOUSE_AREAS: readonly string[] = [
    '自我形象與新的開始',
    '金錢、資源與自我價值',
    '溝通、學習與身邊的人',
    '家庭與內在的根基',
    '創作、玩樂與戀愛',
    '日常作息與工作安排',
    '一對一的關係與合作',
    '深層連結、共享資源與轉變',
    '遠方、信念與探索',
    '事業、目標與社會角色',
    '朋友、群體與期待',
    '獨處、沉澱與內在世界',
];

/** The four groups the houses are read in: how the member is placed toward themself, home, others and the world. */
export const HOUSE_GROUPS: ReadonlyArray<{
    title: string; subtitle: string; houses: readonly number[];
}> = [
    {
        title: '自己與資源', subtitle: '第 1 至 3 宮：你怎麼看待自己、擁有什麼、怎麼和身邊的人交流。', houses: [
            1,
            2,
            3,
        ],
    },
    {
        title: '家與創造', subtitle: '第 4 至 6 宮：你的根基、你想創造與享受的，以及日常的安排。', houses: [
            4,
            5,
            6,
        ],
    },
    {
        title: '關係與轉化', subtitle: '第 7 至 9 宮：一對一的關係、深層的連結，以及你嚮往的遠方。', houses: [
            7,
            8,
            9,
        ],
    },
    {
        title: '事業與群體', subtitle: '第 10 至 12 宮：你想達成的目標、你所屬的群體，以及獨處的內在。', houses: [
            10,
            11,
            12,
        ],
    },
];

/** How one body reads in one house: the role of the body in the area of the house. */
export function bodyInHouseReading(body: NatalBody, house: number): string {
    const area = HOUSE_AREAS[house - 1] ?? '';
    const base = `${BODY_ROLES[body]}傾向在「${area}」這個領域${BODY_IN_AREA[body]}`;

    return GENERATIONAL_BODIES.includes(body) ? `${base}（這顆星在同一宮停留多年，是同世代共有的背景）。` : `${base}。`;
}

/** How two bodies stand to each other in each kind of aspect. */
export const ASPECT_RELATIONS: Readonly<Record<AspectType, { relation: string; tone: string }>> = {
    CONJUNCTION: {
        relation: '緊密結合',
        tone: '兩者的力量疊在一起，存在感很強，也不容易分開看待。',
    },
    SEXTILE: {
        relation: '容易協作',
        tone: '兩者容易互相配合，只要主動運用，就能成為助力。',
    },
    SQUARE: {
        relation: '之間有摩擦',
        tone: '兩者的要求不一致，容易感到拉扯；這份張力也常是推動你行動與成長的力量。',
    },
    TRINE: {
        relation: '自然流動',
        tone: '兩者配合得輕鬆，是天生順手的部分；太順的時候也容易視為理所當然。',
    },
    OPPOSITION: {
        relation: '彼此拉扯',
        tone: '兩者像在天秤的兩端，常在兩種需要之間來回；學會兼顧，比擇一更有幫助。',
    },
};

/** Within this many degrees of exact, an aspect is tight and weighs more. */
export const TIGHT_ORB = 2;

/** How an aspect reads, with the names of the two bodies; a tight one says so. */
export function aspectReading(type: AspectType, first: NatalBody, second: NatalBody, orb: number, name: (body: NatalBody) => string): string {
    const {
        relation, tone, 
    } = ASPECT_RELATIONS[type];
    const tight = orb <= TIGHT_ORB ? '（相差很小，這組的影響比較明顯）' : '';

    return `${name(first)}的${BODY_ROLES[first]}與${name(second)}的${BODY_ROLES[second]}${relation}${tight}：${tone}`;
}

/** Whether an aspect is one that flows (sextile, trine) or one that strains (square, opposition); the conjunction is neither. */
export const ASPECT_FLOW: Readonly<Record<AspectType, 'flow' | 'strain' | 'blend'>> = {
    CONJUNCTION: 'blend',
    SEXTILE: 'flow',
    SQUARE: 'strain',
    TRINE: 'flow',
    OPPOSITION: 'strain',
};

/** A conclusion of the chart as a whole: a title that says what was found, and what it can mean. */
export type NatalConclusion = { title: string; text: string };

export const ASPECT_BALANCE_READINGS: Readonly<Record<'strain' | 'flow' | 'even', NatalConclusion>> = {
    strain: {
        title: '帶張力的相位偏多',
        text: '四分、對分比三分、六分多：你的內在可能常有不同需要在拉扯，這也常是你不斷調整、成長的動力。',
    },
    flow: {
        title: '順暢的相位偏多',
        text: '三分、六分比四分、對分多：你的各種特質之間可能配合得比較自然，要留意的是太順時容易少了推自己一把的力量。',
    },
    even: {
        title: '順暢與帶張力的相位相當',
        text: '三分、六分與四分、對分差不多：你可能在某些地方很順手，在另一些地方需要多花力氣，兩種感受都有。',
    },
};

/** How many more of one kind of aspect than the other it takes to call a chart one-sided. */
export const ASPECT_BALANCE_MARGIN = 2;

/** The fewest aspects a chart needs before it is said to lean either way. */
export const ASPECT_BALANCE_MIN = 4;

export type SignElement = 'FIRE' | 'EARTH' | 'AIR' | 'WATER';
export type SignMode = 'CARDINAL' | 'FIXED' | 'MUTABLE';

export const SIGN_ELEMENTS: Readonly<Record<Zodiac, SignElement>> = {
    aries: 'FIRE',
    leo: 'FIRE',
    sagittarius: 'FIRE',
    taurus: 'EARTH',
    virgo: 'EARTH',
    capricorn: 'EARTH',
    gemini: 'AIR',
    libra: 'AIR',
    aquarius: 'AIR',
    cancer: 'WATER',
    scorpio: 'WATER',
    pisces: 'WATER',
};

export const SIGN_MODES: Readonly<Record<Zodiac, SignMode>> = {
    aries: 'CARDINAL',
    cancer: 'CARDINAL',
    libra: 'CARDINAL',
    capricorn: 'CARDINAL',
    taurus: 'FIXED',
    leo: 'FIXED',
    scorpio: 'FIXED',
    aquarius: 'FIXED',
    gemini: 'MUTABLE',
    virgo: 'MUTABLE',
    sagittarius: 'MUTABLE',
    pisces: 'MUTABLE',
};

export const ELEMENT_NAMES: Readonly<Record<SignElement, string>> = {
    FIRE: '火象', EARTH: '土象', AIR: '風象', WATER: '水象',
};

export const MODE_NAMES: Readonly<Record<SignMode, string>> = {
    CARDINAL: '行動型', FIXED: '固定型', MUTABLE: '變動型',
};

/** An element this many of the ten bodies fall in is said to lead; with none, it is said to be missing. */
export const ELEMENT_LEAD_AT = 4;

/** A mode this many of the ten bodies fall in is said to lead. */
export const MODE_LEAD_AT = 5;

export const ELEMENT_LEAD_READINGS: Readonly<Record<SignElement, string>> = {
    FIRE: '火象偏多：熱情、直接、愛行動；容易衝在前面，需要學習等待與收斂。',
    EARTH: '土象偏多：務實、穩定、重視成果；容易偏重現實與掌控，需要留一點彈性。',
    AIR: '風象偏多：重想法、愛交流、反應快；容易停在腦中，需要把想法落地。',
    WATER: '水象偏多：感受細膩、重情感連結；容易被情緒牽動，需要界線與出口。',
};

export const ELEMENT_MISSING_READINGS: Readonly<Record<SignElement, string>> = {
    FIRE: '沒有星體落在火象星座：行動與熱情較少自然冒出來，可能需要刻意給自己一個啟動的理由。',
    EARTH: '沒有星體落在土象星座：務實與落實可能需要多花心力練習，借助清單或流程會有幫助。',
    AIR: '沒有星體落在風象星座：抽離地看事情與交流表達可能比較不自然，多找人聊聊能幫助整理想法。',
    WATER: '沒有星體落在水象星座：感受與情緒的辨識可能需要多一點時間，可以練習停下來問問自己的感覺。',
};

export const MODE_LEAD_READINGS: Readonly<Record<SignMode, string>> = {
    CARDINAL: '行動型偏多：擅長開頭與發起，容易一個接一個開新局，後續需要耐心。',
    FIXED: '固定型偏多：穩定、堅持，容易守著既定的方式，面對改變需要時間。',
    MUTABLE: '變動型偏多：彈性、適應力強，容易隨環境調整，需要留意自己的方向感。',
};

/** Three bodies or more in one house: the chart gathers there. */
export const HOUSE_GATHER_AT = 3;

export function houseGatherReading(bodies: string, house: number): NatalConclusion {
    const area = HOUSE_AREAS[house - 1] ?? '';

    return {
        title: `${bodies}集中在第 ${house} 宮`,
        text: `「${area}」可能是你生活的重心，你容易把很多心力放在這裡。`,
    };
}

/** Where the ruler of the ascendant's sign falls, as where the course of a life tends to flow. */
export function chartRulerReading(ruler: string, house: number): NatalConclusion {
    const area = HOUSE_AREAS[house - 1] ?? '';

    return {
        title: `命主星${ruler}落在第 ${house} 宮`,
        text: `命主星是上升星座的守護星：你人生的主軸容易流向「${area}」，很多事會繞著這個領域展開。`,
    };
}
