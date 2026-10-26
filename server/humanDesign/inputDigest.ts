import { createHash } from 'node:crypto';

export type BirthInput = {
    birthDate: string;
    birthTime: string;
    birthPlace: string;
};

/**
 * Digest of what a chart was calculated from. It lets a stored chart be checked against the member's
 * current birth data without storing the raw time and place a second time (RULE-028).
 */
export function humanDesignInputDigest(input: BirthInput): string {
    return createHash('sha256').update(`${input.birthDate}|${input.birthTime}|${input.birthPlace}`).digest('hex');
}
