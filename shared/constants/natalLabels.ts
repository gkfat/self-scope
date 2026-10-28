import type { NatalBody } from './natal';

/** Names and one-line roles of what a birth chart shows. Fixed text, the same for everyone. */
export type NatalKey = NatalBody | 'ASCENDANT';

export const NATAL_LABELS: Record<NatalKey, { name: string; role: string }> = {
    SUN: {
        name: '太陽', role: '你的核心與生命力，想成為什麼樣的人。',
    },
    MOON: {
        name: '月亮', role: '情緒的反應方式，什麼讓你覺得安心。',
    },
    ASCENDANT: {
        name: '上升', role: '別人初見你的樣子，以及你面對新情境的方式。',
    },
    MERCURY: {
        name: '水星', role: '你怎麼思考、學習與溝通。',
    },
    VENUS: {
        name: '金星', role: '你怎麼愛、重視什麼，也包含對美的感受。',
    },
    MARS: {
        name: '火星', role: '你怎麼行動、爭取，以及怎麼表達衝勁。',
    },
    JUPITER: {
        name: '木星', role: '哪裡容易有機會與成長，你相信什麼。',
    },
    SATURN: {
        name: '土星', role: '你的責任與課題，需要時間慢慢練出的部分。',
    },
    URANUS: {
        name: '天王星', role: '世代對改變與自由的追求，打破舊框架的方式。',
    },
    NEPTUNE: {
        name: '海王星', role: '世代共有的理想與憧憬，也包含容易模糊的地方。',
    },
    PLUTO: {
        name: '冥王星', role: '世代經歷的深層轉化，與權力、重生有關的長期主題。',
    },
};

/** What each of the twelve houses is about, in a few words (the same names the sign horoscope uses). */
export const HOUSE_THEMES: readonly string[] = [
    '自我與開始',
    '資源與價值',
    '溝通與學習',
    '家與根基',
    '表現與樂趣',
    '日常與安排',
    '關係與合作',
    '深層連結',
    '視野與探索',
    '目標與角色',
    '夥伴與期待',
    '沉澱與獨處',
];

export const ASPECT_LABELS = {
    CONJUNCTION: '合相',
    SEXTILE: '六分相',
    SQUARE: '四分相',
    TRINE: '三分相',
    OPPOSITION: '對分相',
} as const;

/** How the cards are grouped on the report. */
export const NATAL_GROUPS: Array<{ title: string; subtitle: string; keys: NatalKey[] }> = [
    {
        title: '三大星座', subtitle: '最常被提到的三個位置：核心、內在、外在。', keys: [
            'SUN',
            'MOON',
            'ASCENDANT',
        ],
    },
    {
        title: '思考、愛與行動', subtitle: '日常裡你怎麼想、怎麼愛、怎麼動。', keys: [
            'MERCURY',
            'VENUS',
            'MARS',
        ],
    },
    {
        title: '機會與責任', subtitle: '比較長期的成長主題。', keys: ['JUPITER', 'SATURN'],
    },
    {
        title: '世代與長期主題', subtitle: '這三顆星在同一星座停留數年到數十年，同世代的人落點相同，是共同的時代背景，不是你獨有的特質。', keys: [
            'URANUS',
            'NEPTUNE',
            'PLUTO',
        ],
    },
];
