/** The 24 runes of the Elder Futhark in the standard order, from Fehu (0) to Othala (23). No blank rune. */
export const RUNE_COUNT = 24;

export const RUNE_ORIENTATIONS = ['upright', 'reversed'] as const;

export type RuneOrientation = typeof RUNE_ORIENTATIONS[number];

export type Rune = {
    /** Position in the standard order, 0 to 23 */
    index: number;
    name: string;
    /** The Unicode rune character (U+16A0 block) */
    glyph: string;
    /** What the rune's name means, in a few words */
    meaning: string;
    /** Whether the rune looks different turned upside down. The nine that look the same only come up upright. */
    reversible: boolean;
    /** Image source once an illustration exists; the rune is laid out as its glyph while this is null */
    illustration: string | null;
};

const RUNES_TABLE: Array<[string, string, string, boolean]> = [
    [
        'Fehu',
        'ᚠ',
        '牲畜與財富',
        true,
    ],
    [
        'Uruz',
        'ᚢ',
        '原牛',
        true,
    ],
    [
        'Thurisaz',
        'ᚦ',
        '巨人與荊棘',
        true,
    ],
    [
        'Ansuz',
        'ᚨ',
        '神與話語',
        true,
    ],
    [
        'Raidho',
        'ᚱ',
        '騎行與旅程',
        true,
    ],
    // The name's reconstructed meaning is disputed; divination reads it as the torch (Old English cēn)
    [
        'Kenaz',
        'ᚲ',
        '火炬',
        true,
    ],
    [
        'Gebo',
        'ᚷ',
        '禮物',
        false,
    ],
    [
        'Wunjo',
        'ᚹ',
        '喜悅',
        true,
    ],
    [
        'Hagalaz',
        'ᚺ',
        '冰雹',
        false,
    ],
    [
        'Nauthiz',
        'ᚾ',
        '需要',
        false,
    ],
    [
        'Isa',
        'ᛁ',
        '冰',
        false,
    ],
    [
        'Jera',
        'ᛃ',
        '年與收成',
        false,
    ],
    [
        'Eihwaz',
        'ᛇ',
        '紫杉',
        false,
    ],
    // The meaning of the name is not known; it is usually read as the dice cup and fate
    [
        'Perthro',
        'ᛈ',
        '字義不確定，常解為骰杯與命運',
        true,
    ],
    [
        'Algiz',
        'ᛉ',
        '駝鹿與守護',
        true,
    ],
    [
        'Sowilo',
        'ᛊ',
        '太陽',
        false,
    ],
    [
        'Tiwaz',
        'ᛏ',
        '戰神提爾',
        true,
    ],
    [
        'Berkano',
        'ᛒ',
        '樺樹',
        true,
    ],
    [
        'Ehwaz',
        'ᛖ',
        '馬',
        true,
    ],
    [
        'Mannaz',
        'ᛗ',
        '人',
        true,
    ],
    [
        'Laguz',
        'ᛚ',
        '水',
        true,
    ],
    [
        'Ingwaz',
        'ᛜ',
        '豐饒神英格',
        false,
    ],
    [
        'Dagaz',
        'ᛞ',
        '日',
        false,
    ],
    [
        'Othala',
        'ᛟ',
        '祖產與傳承',
        true,
    ],
];

export const RUNES: readonly Rune[] = RUNES_TABLE.map(([
    name,
    glyph,
    meaning,
    reversible,
], index) => ({
    index, name, glyph, meaning, reversible, illustration: null,
}));

export const RUNE_ORIENTATION_LABELS: Record<RuneOrientation, string> = {
    upright: '正位',
    reversed: '逆位',
};

/** How long a draw is kept before the expiry job removes it (RULE-014). */
export const RUNE_RETENTION_MONTHS = 3;

/** Key of a rune's written content: `<index>_<upright|reversed>`. */
export function runeContentKey(runeIndex: number, orientation: RuneOrientation): string {
    return `${runeIndex}_${orientation}`;
}

/** Whether the rune at this position can come up reversed. */
export function isReversibleRune(runeIndex: number): boolean {
    return RUNES[runeIndex]?.reversible ?? false;
}

/** Every key a rune's content can have: 24 upright and 15 reversed, 39 in all. */
export function runeContentKeys(): string[] {
    return RUNES.flatMap((rune) => [runeContentKey(rune.index, 'upright'), ...(rune.reversible ? [runeContentKey(rune.index, 'reversed')] : [])]);
}

/**
 * Whether the home page block, the daily fortune page and the side menu show the rune. Off until the 39 rune texts
 * are reviewed and imported, since drawing answers 404 ("準備中") without them.
 */
export const RUNE_ENTRY_ENABLED = true;
