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
};

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
];
