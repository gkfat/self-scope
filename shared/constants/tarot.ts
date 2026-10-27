/** The 22 cards of the major arcana, in order from The Fool (0) to The World (21). */
export const TAROT_CARD_COUNT = 22;

export const TAROT_ORIENTATIONS = ['upright', 'reversed'] as const;

export type TarotOrientation = typeof TAROT_ORIENTATIONS[number];

export type TarotCard = {
    /** Position in the major arcana, 0 to 21 */
    index: number;
    roman: string;
    name: string;
    englishName: string;
    /** Image source once an illustration exists; the card is laid out as text while this is null */
    illustration: string | null;
};

const CARDS: Array<Omit<TarotCard, 'index' | 'illustration'>> = [
    {
        roman: '0', name: '愚者', englishName: 'The Fool',
    },
    {
        roman: 'I', name: '魔術師', englishName: 'The Magician',
    },
    {
        roman: 'II', name: '女祭司', englishName: 'The High Priestess',
    },
    {
        roman: 'III', name: '皇后', englishName: 'The Empress',
    },
    {
        roman: 'IV', name: '皇帝', englishName: 'The Emperor',
    },
    {
        roman: 'V', name: '教皇', englishName: 'The Hierophant',
    },
    {
        roman: 'VI', name: '戀人', englishName: 'The Lovers',
    },
    {
        roman: 'VII', name: '戰車', englishName: 'The Chariot',
    },
    {
        roman: 'VIII', name: '力量', englishName: 'Strength',
    },
    {
        roman: 'IX', name: '隱者', englishName: 'The Hermit',
    },
    {
        roman: 'X', name: '命運之輪', englishName: 'Wheel of Fortune',
    },
    {
        roman: 'XI', name: '正義', englishName: 'Justice',
    },
    {
        roman: 'XII', name: '倒吊人', englishName: 'The Hanged Man',
    },
    {
        roman: 'XIII', name: '死神', englishName: 'Death',
    },
    {
        roman: 'XIV', name: '節制', englishName: 'Temperance',
    },
    {
        roman: 'XV', name: '惡魔', englishName: 'The Devil',
    },
    {
        roman: 'XVI', name: '高塔', englishName: 'The Tower',
    },
    {
        roman: 'XVII', name: '星星', englishName: 'The Star',
    },
    {
        roman: 'XVIII', name: '月亮', englishName: 'The Moon',
    },
    {
        roman: 'XIX', name: '太陽', englishName: 'The Sun',
    },
    {
        roman: 'XX', name: '審判', englishName: 'Judgement',
    },
    {
        roman: 'XXI', name: '世界', englishName: 'The World',
    },
];

export const TAROT_CARDS: readonly TarotCard[] = CARDS.map((card, index) => ({
    ...card, index, illustration: null,
}));

export const TAROT_ORIENTATION_LABELS: Record<TarotOrientation, string> = {
    upright: '正位',
    reversed: '逆位',
};

/** How long a draw is kept before the expiry job removes it (RULE-014). */
export const TAROT_RETENTION_MONTHS = 3;

/** Key of a card's written content: `<index>_<upright|reversed>`. */
export function tarotContentKey(cardIndex: number, orientation: TarotOrientation): string {
    return `${cardIndex}_${orientation}`;
}

/**
 * Whether the home page block and the side menu link to the daily tarot. Off until the 44 card texts are
 * reviewed and imported, since drawing answers 404 ("準備中") without them.
 */
export const TAROT_ENTRY_ENABLED = true;
