/**
 * Static tables and rule settings for the BaZi (Four Pillars) chart.
 * Pure data only; the calculations live in `shared/utils/bazi/`.
 */

export const STEMS = [
    '甲',
    '乙',
    '丙',
    '丁',
    '戊',
    '己',
    '庚',
    '辛',
    '壬',
    '癸',
] as const;

export const BRANCHES = [
    '子',
    '丑',
    '寅',
    '卯',
    '辰',
    '巳',
    '午',
    '未',
    '申',
    '酉',
    '戌',
    '亥',
] as const;

export type Stem = typeof STEMS[number];
export type Branch = typeof BRANCHES[number];

export const ELEMENTS = [
    'wood',
    'fire',
    'earth',
    'metal',
    'water',
] as const;

export type Element = typeof ELEMENTS[number];

export type Polarity = 'YANG' | 'YIN';

export const ELEMENT_LABELS: Record<Element, string> = {
    wood: '木',
    fire: '火',
    earth: '土',
    metal: '金',
    water: '水',
};

export const STEM_ELEMENTS: Record<Stem, Element> = {
    甲: 'wood',
    乙: 'wood',
    丙: 'fire',
    丁: 'fire',
    戊: 'earth',
    己: 'earth',
    庚: 'metal',
    辛: 'metal',
    壬: 'water',
    癸: 'water',
};

/**
 * Hidden stems of each branch, main qi first, then middle qi, then residual qi.
 * The element of a branch is the element of its main qi.
 */
export const HIDDEN_STEMS: Record<Branch, readonly Stem[]> = {
    子: ['癸'],
    丑: [
        '己',
        '癸',
        '辛',
    ],
    寅: [
        '甲',
        '丙',
        '戊',
    ],
    卯: ['乙'],
    辰: [
        '戊',
        '乙',
        '癸',
    ],
    巳: [
        '丙',
        '庚',
        '戊',
    ],
    午: ['丁', '己'],
    未: [
        '己',
        '丁',
        '乙',
    ],
    申: [
        '庚',
        '壬',
        '戊',
    ],
    酉: ['辛'],
    戌: [
        '戊',
        '辛',
        '丁',
    ],
    亥: ['壬', '甲'],
};

export const BRANCH_ZODIAC: Record<Branch, string> = {
    子: '鼠',
    丑: '牛',
    寅: '虎',
    卯: '兔',
    辰: '龍',
    巳: '蛇',
    午: '馬',
    未: '羊',
    申: '猴',
    酉: '雞',
    戌: '狗',
    亥: '豬',
};

/** Number of stems / branches / pairs in the sexagenary cycle. */
export const GANZHI_CYCLE = 60;

/**
 * Month stem of the first month (寅) by year stem index modulo 5 (五虎遁):
 * 甲己 → 丙, 乙庚 → 戊, 丙辛 → 庚, 丁壬 → 壬, 戊癸 → 甲.
 */
export const TIGER_MONTH_START_STEM: readonly Stem[] = [
    '丙',
    '戊',
    '庚',
    '壬',
    '甲',
];

/**
 * Hour stem of the first hour (子) by day stem index modulo 5 (五鼠遁):
 * 甲己 → 甲, 乙庚 → 丙, 丙辛 → 戊, 丁壬 → 庚, 戊癸 → 壬.
 */
export const RAT_HOUR_START_STEM: readonly Stem[] = [
    '甲',
    '丙',
    '戊',
    '庚',
    '壬',
];

/** A known day: 2000-01-01 is a 戊午 day (index 54 in the sexagenary cycle). */
export const DAY_PILLAR_ANCHOR = {
    isoDate: '2000-01-01',
    stem: '戊',
    branch: '午',
} as const;

/** The fixed rule choices; the page explains them, and a future school option only needs to extend this. */
export const BAZI_RULES = {
    /** The year changes at the start of spring (立春), not at the lunar new year. */
    yearBoundary: 'LICHUN',
    /** The month changes at each of the twelve 節. */
    monthBoundary: 'JIE',
    /** The day changes at local 00:00. */
    dayBoundary: 'LOCAL_MIDNIGHT',
    /** 23:00–24:00 (late 子 hour) keeps the day pillar; the hour stem follows the next day's stem. */
    lateZiHour: 'KEEP_DAY_NEXT_STEM',
    /** Standard time of the birthplace (with historical daylight saving), no true solar time. */
    timeBasis: 'STANDARD_TIME',
} as const;

/** A birth this close to a 節 or an hour boundary shows the borderline notice. */
export const BORDERLINE_MINUTES = 30;

/** Time zone used when the birthplace is missing. */
export const DEFAULT_BAZI_TIME_ZONE = 'Asia/Taipei';

export type SolarTermDef = {
    name: string;
    /** Apparent ecliptic longitude of the Sun at the term, in degrees. */
    longitude: number;
    /** Approximate [month, day] in the Gregorian calendar; only seeds the search window. */
    approx: readonly [number, number];
    /** Month branch that starts at this term; only the twelve 節 start a month. */
    monthBranch: Branch | null;
};

/**
 * The 24 solar terms in calendar order within a Gregorian year (小寒 first).
 * The twelve 節 (odd positions of the traditional list) start a BaZi month; the twelve 中氣 do not.
 */
export const SOLAR_TERMS: readonly SolarTermDef[] = [
    {
        name: '小寒', longitude: 285, approx: [1, 5], monthBranch: '丑',
    },
    {
        name: '大寒', longitude: 300, approx: [1, 20], monthBranch: null,
    },
    {
        name: '立春', longitude: 315, approx: [2, 4], monthBranch: '寅',
    },
    {
        name: '雨水', longitude: 330, approx: [2, 19], monthBranch: null,
    },
    {
        name: '驚蟄', longitude: 345, approx: [3, 6], monthBranch: '卯',
    },
    {
        name: '春分', longitude: 0, approx: [3, 21], monthBranch: null,
    },
    {
        name: '清明', longitude: 15, approx: [4, 5], monthBranch: '辰',
    },
    {
        name: '穀雨', longitude: 30, approx: [4, 20], monthBranch: null,
    },
    {
        name: '立夏', longitude: 45, approx: [5, 5], monthBranch: '巳',
    },
    {
        name: '小滿', longitude: 60, approx: [5, 21], monthBranch: null,
    },
    {
        name: '芒種', longitude: 75, approx: [6, 6], monthBranch: '午',
    },
    {
        name: '夏至', longitude: 90, approx: [6, 21], monthBranch: null,
    },
    {
        name: '小暑', longitude: 105, approx: [7, 7], monthBranch: '未',
    },
    {
        name: '大暑', longitude: 120, approx: [7, 22], monthBranch: null,
    },
    {
        name: '立秋', longitude: 135, approx: [8, 7], monthBranch: '申',
    },
    {
        name: '處暑', longitude: 150, approx: [8, 23], monthBranch: null,
    },
    {
        name: '白露', longitude: 165, approx: [9, 7], monthBranch: '酉',
    },
    {
        name: '秋分', longitude: 180, approx: [9, 23], monthBranch: null,
    },
    {
        name: '寒露', longitude: 195, approx: [10, 8], monthBranch: '戌',
    },
    {
        name: '霜降', longitude: 210, approx: [10, 23], monthBranch: null,
    },
    {
        name: '立冬', longitude: 225, approx: [11, 7], monthBranch: '亥',
    },
    {
        name: '小雪', longitude: 240, approx: [11, 22], monthBranch: null,
    },
    {
        name: '大雪', longitude: 255, approx: [12, 7], monthBranch: '子',
    },
    {
        name: '冬至', longitude: 270, approx: [12, 22], monthBranch: null,
    },
];

/** Each element generates the next one (木生火, 火生土 …). */
export const ELEMENT_GENERATES: Record<Element, Element> = {
    wood: 'fire',
    fire: 'earth',
    earth: 'metal',
    metal: 'water',
    water: 'wood',
};

/** Each element controls one other (木剋土, 土剋水 …). */
export const ELEMENT_CONTROLS: Record<Element, Element> = {
    wood: 'earth',
    earth: 'water',
    water: 'fire',
    fire: 'metal',
    metal: 'wood',
};

export const TEN_GODS = [
    '比肩',
    '劫財',
    '食神',
    '傷官',
    '偏財',
    '正財',
    '七殺',
    '正官',
    '偏印',
    '正印',
] as const;

export type TenGod = typeof TEN_GODS[number];

/** The five groups the ten gods are summed into (keys are shared with the `group_dominant_*` content keys). */
export const TEN_GOD_GROUPS = [
    'peer',
    'output',
    'wealth',
    'power',
    'resource',
] as const;

export type TenGodGroup = typeof TEN_GOD_GROUPS[number];

export const TEN_GOD_GROUP_LABELS: Record<TenGodGroup, string> = {
    peer: '比劫',
    output: '食傷',
    wealth: '財',
    power: '官殺',
    resource: '印',
};

export const TEN_GOD_GROUP_OF: Record<TenGod, TenGodGroup> = {
    比肩: 'peer',
    劫財: 'peer',
    食神: 'output',
    傷官: 'output',
    偏財: 'wealth',
    正財: 'wealth',
    七殺: 'power',
    正官: 'power',
    偏印: 'resource',
    正印: 'resource',
};

/** An element or ten-god group counts as clearly dominant at this many characters (and only when it is the sole top). */
export const DOMINANT_MIN_COUNT = 3;

export const LIFE_STAGES = [
    '長生',
    '沐浴',
    '冠帶',
    '臨官',
    '帝旺',
    '衰',
    '病',
    '死',
    '墓',
    '絕',
    '胎',
    '養',
] as const;

export type LifeStage = typeof LIFE_STAGES[number];

/**
 * The branch where each stem is at 長生. Yang stems run forward through the branches from there,
 * yin stems run backward (戊 follows 丙 and 己 follows 丁, the usual 子平 convention).
 */
export const LIFE_STAGE_START: Record<Stem, Branch> = {
    甲: '亥',
    乙: '午',
    丙: '寅',
    丁: '酉',
    戊: '寅',
    己: '酉',
    庚: '巳',
    辛: '子',
    壬: '申',
    癸: '卯',
};

/** 納音 of each consecutive pair of the sexagenary cycle (甲子乙丑, 丙寅丁卯 …); the last character is the element. */
export const NAYIN_NAMES = [
    '海中金',
    '爐中火',
    '大林木',
    '路旁土',
    '劍鋒金',
    '山頭火',
    '澗下水',
    '城頭土',
    '白蠟金',
    '楊柳木',
    '泉中水',
    '屋上土',
    '霹靂火',
    '松柏木',
    '長流水',
    '沙中金',
    '山下火',
    '平地木',
    '壁上土',
    '金箔金',
    '覆燈火',
    '天河水',
    '大驛土',
    '釵釧金',
    '桑柘木',
    '大溪水',
    '沙中土',
    '天上火',
    '石榴木',
    '大海水',
] as const;

export const NAYIN_ELEMENT_OF_CHAR: Record<string, Element> = {
    木: 'wood',
    火: 'fire',
    土: 'earth',
    金: 'metal',
    水: 'water',
};

/** 天干五合 */
export const STEM_COMBINES: ReadonlyArray<readonly [Stem, Stem]> = [
    ['甲', '己'],
    ['乙', '庚'],
    ['丙', '辛'],
    ['丁', '壬'],
    ['戊', '癸'],
];

/** 地支六合 */
export const BRANCH_COMBINES: ReadonlyArray<readonly [Branch, Branch]> = [
    ['子', '丑'],
    ['寅', '亥'],
    ['卯', '戌'],
    ['辰', '酉'],
    ['巳', '申'],
    ['午', '未'],
];

/** 地支六沖 */
export const BRANCH_CLASHES: ReadonlyArray<readonly [Branch, Branch]> = [
    ['子', '午'],
    ['丑', '未'],
    ['寅', '申'],
    ['卯', '酉'],
    ['辰', '戌'],
    ['巳', '亥'],
];

export type Season = '春' | '夏' | '秋' | '冬';

/** Season of each month branch (寅卯辰 spring, 巳午未 summer, 申酉戌 autumn, 亥子丑 winter). */
export const SEASON_OF_BRANCH: Record<Branch, Season> = {
    寅: '春',
    卯: '春',
    辰: '春',
    巳: '夏',
    午: '夏',
    未: '夏',
    申: '秋',
    酉: '秋',
    戌: '秋',
    亥: '冬',
    子: '冬',
    丑: '冬',
};

/** Weight of each position in the support score (幫扶分); the weights add up to 100, the month branch counting most. */
export const STRENGTH_WEIGHTS = {
    yearStem: 8,
    monthStem: 12,
    hourStem: 12,
    yearBranch: 8,
    monthBranch: 40,
    dayBranch: 12,
    hourBranch: 8,
} as const;

/**
 * Share (in tenths) of the hidden stems of a branch by how many it has: main : middle : residual = 6 : 3 : 1,
 * two stems 7 : 3, one stem 10. Whole tenths keep the score free of floating-point drift at the level bounds.
 */
export const HIDDEN_STEM_SHARES: Record<1 | 2 | 3, readonly number[]> = {
    1: [10],
    2: [7, 3],
    3: [
        6,
        3,
        1,
    ],
};

export const STRENGTH_LEVELS = [
    'taiwang',
    'strong',
    'balanced',
    'weak',
    'taiwei',
] as const;

export type StrengthLevel = typeof STRENGTH_LEVELS[number];

export const STRENGTH_LEVEL_LABELS: Record<StrengthLevel, string> = {
    taiwang: '太旺',
    strong: '身強',
    balanced: '中和',
    weak: '身弱',
    taiwei: '太弱',
};

/** A score at or above the bound belongs to the level; anything below the last bound is 太弱. */
export const STRENGTH_BOUNDS: ReadonlyArray<readonly [number, StrengthLevel]> = [
    [75, 'taiwang'],
    [55, 'strong'],
    [45, 'balanced'],
    [30, 'weak'],
];

export type ElementPhase = '旺' | '相' | '休' | '囚' | '死';

/** Pattern (命格) names; 比肩 in the month branch is 建祿格 and 劫財 is 月刃格. */
export const PATTERN_KEYS = [
    '正官',
    '七殺',
    '正印',
    '偏印',
    '正財',
    '偏財',
    '食神',
    '傷官',
    '建祿',
    '月刃',
] as const;

export type PatternKey = typeof PATTERN_KEYS[number];

export const PATTERN_OF_TEN_GOD: Record<TenGod, PatternKey> = {
    正官: '正官',
    七殺: '七殺',
    正印: '正印',
    偏印: '偏印',
    正財: '正財',
    偏財: '偏財',
    食神: '食神',
    傷官: '傷官',
    比肩: '建祿',
    劫財: '月刃',
};

export type UsefulGods = {
    /** 用神 */
    useful: TenGodGroup;
    /** 喜神 */
    favorable: TenGodGroup;
    /** 忌神 */
    avoid: readonly TenGodGroup[];
};

/** 喜用神 by strong / weak side and the ten-god group of the pattern; expressed as ten-god groups. */
export const USEFUL_GODS: Record<'strong' | 'weak', Record<TenGodGroup, UsefulGods>> = {
    strong: {
        resource: {
            useful: 'wealth', favorable: 'output', avoid: ['peer'],
        },
        power: {
            useful: 'power', favorable: 'wealth', avoid: ['resource', 'peer'],
        },
        wealth: {
            useful: 'wealth', favorable: 'output', avoid: ['peer', 'resource'],
        },
        output: {
            useful: 'wealth', favorable: 'output', avoid: ['resource'],
        },
        peer: {
            useful: 'power', favorable: 'wealth', avoid: ['resource'],
        },
    },
    weak: {
        resource: {
            useful: 'resource', favorable: 'peer', avoid: ['wealth'],
        },
        power: {
            useful: 'resource', favorable: 'peer', avoid: ['wealth'],
        },
        wealth: {
            useful: 'peer', favorable: 'resource', avoid: ['output', 'wealth'],
        },
        output: {
            useful: 'resource', favorable: 'peer', avoid: ['output', 'wealth'],
        },
        peer: {
            useful: 'resource', favorable: 'peer', avoid: ['wealth', 'power'],
        },
    },
};

/**
 * Weights of the traditional 稱骨 tables in 錢 (10 錢 = 1 兩), the public 袁天罡 values.
 * Year: by position in the sexagenary cycle (甲子 first); month: lunar month 1–12;
 * day: lunar day 1–30; hour: by branch (子 first).
 */
export const BONE_YEAR_QIAN: readonly number[] = [
    12,
    9,
    6,
    7,
    12,
    5,
    9,
    8,
    7,
    8,
    15,
    9,
    16,
    8,
    8,
    19,
    12,
    6,
    8,
    7,
    5,
    15,
    6,
    16,
    15,
    7,
    9,
    12,
    10,
    7,
    15,
    6,
    5,
    14,
    14,
    9,
    7,
    7,
    9,
    12,
    8,
    7,
    13,
    5,
    14,
    5,
    9,
    17,
    5,
    7,
    12,
    8,
    8,
    6,
    19,
    6,
    8,
    16,
    10,
    7,
];

export const BONE_MONTH_QIAN: readonly number[] = [
    6,
    7,
    18,
    9,
    5,
    16,
    9,
    15,
    18,
    8,
    9,
    5,
];

export const BONE_DAY_QIAN: readonly number[] = [
    5,
    10,
    8,
    15,
    16,
    15,
    8,
    16,
    8,
    16,
    9,
    17,
    8,
    17,
    10,
    8,
    9,
    18,
    5,
    15,
    10,
    9,
    8,
    9,
    15,
    18,
    7,
    8,
    16,
    6,
];

export const BONE_HOUR_QIAN: readonly number[] = [
    16,
    6,
    7,
    10,
    9,
    16,
    10,
    8,
    8,
    9,
    6,
    6,
];

/** The lightest and heaviest possible total, in 錢 (2 兩 1 錢 to 7 兩 1 錢); every value between occurs. */
export const BONE_MIN_QIAN = 21;
export const BONE_MAX_QIAN = 71;

/**
 * Fixed colours of the five elements (木綠、火紅、土黃、金灰白、水藍). Always shown together with the element's
 * name, never as the only way to tell elements apart. `text` is the readable colour to put on `fill`.
 */
export const ELEMENT_COLORS: Record<Element, {
    fill: string;
    text: string;
    border: string;
}> = {
    wood: {
        fill: '#3f8f5f', text: '#ffffff', border: '#2f7149',
    },
    fire: {
        fill: '#d4544a', text: '#ffffff', border: '#b13d34',
    },
    earth: {
        fill: '#d9a441', text: '#2a1f00', border: '#b58525',
    },
    metal: {
        fill: '#d9dde2', text: '#2b3238', border: '#9aa3ab',
    },
    water: {
        fill: '#3d7fd0', text: '#ffffff', border: '#2b63a8',
    },
};

/** Colour of each ten-god group in the bar chart; the group's name is always printed next to it. */
export const TEN_GOD_GROUP_COLORS: Record<TenGodGroup, string> = {
    peer: '#64748b',
    output: '#e8833a',
    wealth: '#0f9d8a',
    power: '#a1457f',
    resource: '#7c5cd6',
};

/** A neutral one-line reading of each group, for the chart legend. */
export const TEN_GOD_GROUP_HINTS: Record<TenGodGroup, string> = {
    peer: '同類與自我，朋友、夥伴與自己的主見',
    output: '表達與創造，把想法變成作品或行動',
    wealth: '資源與務實，處理現實事務的方式',
    power: '規範與壓力，責任、秩序與外在要求',
    resource: '學習與支持，吸收、庇護與內在涵養',
};

/**
 * Whether the home page and the self-reports page link to the BaZi chart. Was off until the 123 interpretation
 * texts are reviewed and imported, since the chart answers 404 ("準備中") without them.
 */
export const BAZI_ENTRY_ENABLED = true;
