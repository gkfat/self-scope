/** Dreamspell: 260 Kin, each one of 20 solar seals combined with one of 13 galactic tones. */
export const KIN_COUNT = 260;
export const SOLAR_SEAL_COUNT = 20;
export const GALACTIC_TONE_COUNT = 13;

export type SolarSealColor = 'red' | 'white' | 'blue' | 'yellow';

export type SolarSeal = {
    /** 1 to 20 */
    index: number;
    name: string;
    englishName: string;
    color: SolarSealColor;
    /** Two words for what the seal stands for, as the report writer may use them */
    keywords: readonly string[];
};

export type GalacticTone = {
    /** 1 to 13 */
    index: number;
    name: string;
    englishName: string;
    /** One word for what the tone stands for */
    keyword: string;
};

export const SOLAR_SEAL_COLOR_LABELS: Record<SolarSealColor, string> = {
    red: '紅',
    white: '白',
    blue: '藍',
    yellow: '黃',
};

/** The colour follows the seal's position: red, white, blue, yellow, and round again. */
const COLOR_ORDER: readonly SolarSealColor[] = [
    'red',
    'white',
    'blue',
    'yellow',
];

const SEALS: Array<[string, string, string]> = [
    [
        '龍',
        'Dragon',
        '滋養,根基',
    ],
    [
        '風',
        'Wind',
        '溝通,靈感',
    ],
    [
        '夜',
        'Night',
        '直覺,內在',
    ],
    [
        '種子',
        'Seed',
        '潛力,成長',
    ],
    [
        '蛇',
        'Serpent',
        '本能,生命力',
    ],
    [
        '世界橋',
        'Worldbridger',
        '連結,跨越',
    ],
    [
        '手',
        'Hand',
        '實踐,療癒',
    ],
    [
        '星星',
        'Star',
        '優雅,美感',
    ],
    [
        '月亮',
        'Moon',
        '流動,淨化',
    ],
    [
        '狗',
        'Dog',
        '忠誠,陪伴',
    ],
    [
        '猴',
        'Monkey',
        '遊戲,幽默',
    ],
    [
        '人',
        'Human',
        '選擇,智慧',
    ],
    [
        '天行者',
        'Skywalker',
        '探索,覺醒',
    ],
    [
        '巫師',
        'Wizard',
        '接納,魅力',
    ],
    [
        '鷹',
        'Eagle',
        '視野,創造',
    ],
    [
        '戰士',
        'Warrior',
        '勇氣,質疑',
    ],
    [
        '地球',
        'Earth',
        '同步,方向',
    ],
    [
        '鏡',
        'Mirror',
        '真誠,反映',
    ],
    [
        '風暴',
        'Storm',
        '轉化,催化',
    ],
    [
        '太陽',
        'Sun',
        '啟蒙,慷慨',
    ],
];

const TONES: Array<[string, string, string]> = [
    [
        '磁性',
        'Magnetic',
        '目的',
    ],
    [
        '月亮',
        'Lunar',
        '平衡',
    ],
    [
        '電力',
        'Electric',
        '活力',
    ],
    [
        '自我存在',
        'Self-Existing',
        '架構',
    ],
    [
        '超頻',
        'Overtone',
        '影響力',
    ],
    [
        '韻律',
        'Rhythmic',
        '秩序',
    ],
    [
        '共振',
        'Resonant',
        '共鳴',
    ],
    [
        '銀河星系',
        'Galactic',
        '一致',
    ],
    [
        '太陽',
        'Solar',
        '意圖',
    ],
    [
        '行星',
        'Planetary',
        '完善',
    ],
    [
        '光譜',
        'Spectral',
        '釋放',
    ],
    [
        '水晶',
        'Crystal',
        '合作',
    ],
    [
        '宇宙',
        'Cosmic',
        '臨在',
    ],
];

export const SOLAR_SEALS: readonly SolarSeal[] = SEALS.map(([
    name,
    englishName,
    keywords,
], position) => ({
    index: position + 1,
    name,
    englishName,
    keywords: keywords.split(','),
    color: COLOR_ORDER[position % COLOR_ORDER.length] as SolarSealColor,
}));

export const GALACTIC_TONES: readonly GalacticTone[] = TONES.map(([
    name,
    englishName,
    keyword,
], position) => ({
    index: position + 1, name, englishName, keyword,
}));

/** How long an unlock is kept before the expiry job removes it (RULE-014). */
export const KIN_UNLOCK_RETENTION_MONTHS = 3;

/**
 * Whether the home page and the side menu link to the Maya Kin pages. Off until the 520 Kin texts are
 * reviewed and imported, since the pages answer 404 ("準備中") without them.
 */
export const KIN_ENTRY_ENABLED = true;
