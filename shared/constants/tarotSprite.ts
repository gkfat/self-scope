/**
 * The picture of every card on one sheet: the 22 faces of the major arcana in the order of the cards (0 to 21), then
 * the back. Each cell is 420 x 720 (the 7:12 of a card), laid out left to right and top to bottom.
 */
export const TAROT_SPRITE = {
    url: '/tarot/sprite.png',
    cols: 6,
    rows: 4,
    /** The cell of the back: right after the 22 faces */
    back: 22,
} as const;

/** CSS `background-size` and `background-position` that show one cell of the sheet, filling the box it is set on. */
export function tarotSpriteCell(cell: number): { size: string; position: string } {
    const {
        cols, rows,
    } = TAROT_SPRITE;

    if (!Number.isInteger(cell) || cell < 0 || cell > TAROT_SPRITE.back) {
        throw new RangeError(`Unknown cell ${cell} of the tarot sprite`);
    }

    return {
        size: `${cols * 100}% ${rows * 100}%`,
        position: `${(cell % cols) / (cols - 1) * 100}% ${Math.floor(cell / cols) / (rows - 1) * 100}%`,
    };
}
