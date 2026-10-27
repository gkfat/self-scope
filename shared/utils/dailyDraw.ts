import { createHash } from 'node:crypto';

export type DrawOrientation = 'upright' | 'reversed';

/** What differs between the daily draws: how many symbols there are, the rule's version, and which can be reversed. */
export type DailyDrawRule = {
    symbolCount: number;
    /** Part of the hashed text and of every stored draw, so a rule change never mixes with older draws */
    version: string;
    /** Whether a symbol can come up reversed; a symbol that cannot is always upright. Everything can by default. */
    isReversible?: (symbolIndex: number) => boolean;
};

export type DrawnSymbol = {
    symbolIndex: number;
    orientation: DrawOrientation;
};

/**
 * The symbol of one account on one day. Deterministic on purpose: retries, concurrent requests and other devices
 * all get the same one. The first 4 bytes of SHA-256(`uid|date|version`) pick the symbol and the lowest bit of the
 * next byte picks the orientation. The bit is always taken, then the rule applied, so the hash is used the same way
 * whichever symbol comes up.
 */
export function pickDailySymbol(rule: DailyDrawRule, uid: string, dateKey: string): DrawnSymbol {
    const digest = createHash('sha256').update(`${uid}|${dateKey}|${rule.version}`).digest();
    const symbolIndex = digest.readUInt32BE(0) % rule.symbolCount;
    const reversedBit = (digest[4] ?? 0) % 2 === 1;
    const reversible = rule.isReversible?.(symbolIndex) ?? true;

    return {
        symbolIndex,
        orientation: reversedBit && reversible ? 'reversed' : 'upright',
    };
}
