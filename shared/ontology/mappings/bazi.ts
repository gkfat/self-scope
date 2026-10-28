import {
    ELEMENTS, PATTERN_KEYS, STEMS, STRENGTH_LEVELS, TEN_GOD_GROUPS,
} from '../../constants/bazi';
import {
    dominantElement, dominantGroup, missingElements, type ChartAnalysis,
} from '../../utils/bazi/analysis';
import type { StrengthResult } from '../../utils/bazi/strength';
import type { MappingEntry } from '../schema';

/**
 * The terms of the BaZi chart the mapping rules use: the day master, the element that clearly dominates or is missing,
 * the ten-god group that clearly dominates, the strength of the day master and the pattern of the month.
 * Not terms on purpose: the 喜用神 (a direction that goes easier, not a trait), the month, the luck cycles (they change
 * with time) and the bone weight, and the sentences written for the ten gods, which are shown as facts, never mapped.
 */
export const BAZI_TERMS: readonly string[] = [
    ...STEMS.map((stem) => `bazi:daymaster:${stem}`),
    ...ELEMENTS.map((element) => `bazi:element:strong:${element}`),
    ...ELEMENTS.map((element) => `bazi:element:missing:${element}`),
    ...TEN_GOD_GROUPS.map((group) => `bazi:group:${group}`),
    ...STRENGTH_LEVELS.map((level) => `bazi:strength:${level}`),
    ...PATTERN_KEYS.map((pattern) => `bazi:pattern:${pattern}`),
];

/**
 * The terms of one chart, picked the same way the fixed readings are picked: an element or a group only counts when it is
 * clearly the largest (at least 3, and not tied), and a missing element is one that does not appear at all.
 */
export function baziTermsOf(analysis: ChartAnalysis, strength: StrengthResult): string[] {
    const strongElement = dominantElement(analysis.elementCounts);
    const group = dominantGroup(analysis.groupCounts);

    return [
        `bazi:daymaster:${analysis.dayMaster.stem}`,
        ...strongElement ? [`bazi:element:strong:${strongElement}`] : [],
        ...missingElements(analysis.elementCounts).map((element) => `bazi:element:missing:${element}`),
        ...group ? [`bazi:group:${group}`] : [],
        `bazi:strength:${strength.level}`,
        `bazi:pattern:${strength.pattern.key}`,
    ];
}

const rule = (term: string, ...axisEnds: string[]): MappingEntry[] => axisEnds.map((axisEnd) => ({
    system: 'BAZI',
    term,
    axisEnd,
    method: 'structural',
    kind: 'trait',
}));

/**
 * The rule is structural: a term points at an axis end only where the reading already fixed in the project for that
 * term (the day master, element, group, strength and pattern texts, which have been reviewed) lists in so many words
 * what the end describes. Nothing is stretched to fill an end.
 * Not mapped on purpose: a missing element. The absence of an element is not the presence of its opposite, and the
 * reading itself says it "does not mean something is lacking"; those terms stay as facts.
 */
export const BAZI_MAPPINGS: readonly MappingEntry[] = [
    // Day master: what the image of the stem stands for
    ...rule('bazi:daymaster:甲', 'E4.A', 'D2.A', 'B4.A'), // direction and drive to grow, shelters others, holds on to principles
    ...rule('bazi:daymaster:乙', 'B4.B', 'C3.B'), // flexible, adapts; does not meet things head on
    ...rule('bazi:daymaster:丙', 'C2.A', 'C3.A', 'D4.A'), // warm, outgoing, says it straight
    ...rule('bazi:daymaster:丁', 'A5.A', 'D4.B', 'C2.B'), // careful and focused on quality; quiet; keeps feelings inside
    ...rule('bazi:daymaster:戊', 'E5.A', 'E6.A', 'B2.B'), // keeps promises, carries pressure, steadies before moving
    ...rule('bazi:daymaster:己', 'E2.B', 'D2.A', 'D6.A', 'D5.B'), // practical, looks after others, accepting, fits in
    ...rule('bazi:daymaster:庚', 'B3.A', 'C3.A', 'D6.B'), // decisive, direct, clear about right and wrong
    ...rule('bazi:daymaster:辛', 'A5.A', 'A6.A', 'D6.B'), // detail and quality, an eye for beauty, high demands on self
    ...rule('bazi:daymaster:壬', 'A4.A', 'B4.B', 'B5.B', 'E5.B'), // wide view, many ideas, adapts, free, dislikes being tied down
    ...rule('bazi:daymaster:癸', 'C1.A', 'A1.B'), // notices fine changes, imagination and intuition

    // A clearly dominant element
    ...rule('bazi:element:strong:wood', 'E4.A', 'B1.A', 'E2.A'), // growth, learning, long-range planning, ideals
    ...rule('bazi:element:strong:fire', 'C2.A', 'C3.A'), // warm and direct expression
    ...rule('bazi:element:strong:earth', 'E1.A', 'E2.B', 'E5.A'), // steady, practical, keeps one's word
    ...rule('bazi:element:strong:metal', 'B5.A', 'B3.A', 'D6.B'), // order and standards, decisive, principles
    ...rule('bazi:element:strong:water', 'B4.B', 'A1.B'), // flexible and adapting, sharp intuition

    // A clearly dominant ten-god group
    ...rule('bazi:group:peer', 'A2.A', 'E3.A', 'B4.A'), // firm views, self-reliance, does not give up
    ...rule('bazi:group:output', 'C2.A', 'A3.A', 'B5.B'), // expression and creation, ideas, wants freedom
    ...rule('bazi:group:wealth', 'E2.B', 'B6.A'), // practical, cares about results and efficiency
    ...rule('bazi:group:power', 'E6.A', 'B5.A'), // responsibility, rules and discipline
    ...rule('bazi:group:resource', 'A4.B'), // studies in depth

    // Strength of the day master
    ...rule('bazi:strength:taiwang', 'A2.A', 'E3.A'), // firm views, stands on its own
    ...rule('bazi:strength:strong', 'A2.A', 'E6.A'), // firm views, takes responsibility
    ...rule('bazi:strength:balanced', 'B4.B'), // adjusts to the situation
    ...rule('bazi:strength:weak', 'D5.B', 'D3.A', 'E3.B'), // fits in, values cooperation and support
    ...rule('bazi:strength:taiwei', 'E3.B', 'D5.B'), // reads the surroundings, willing to lean on others

    // Pattern of the month
    ...rule('bazi:pattern:正官', 'E6.A', 'B5.A'), // follows rules, responsible
    ...rule('bazi:pattern:七殺', 'B2.A', 'B3.A'), // bold, decisive, drive under pressure
    ...rule('bazi:pattern:正印', 'E1.A', 'A4.B'), // values security, studies
    ...rule('bazi:pattern:偏印', 'A2.A', 'A4.B'), // views of one's own, takes up special interests in depth
    ...rule('bazi:pattern:正財', 'E2.B', 'E5.A'), // practical, keeps one's word
    ...rule('bazi:pattern:偏財', 'A4.A', 'D4.A'), // wide view, a wide circle
    ...rule('bazi:pattern:食神', 'C3.B', 'A6.A', 'B6.B'), // gentle and smooth with people, creates and appreciates, enjoys the process
    ...rule('bazi:pattern:傷官', 'C2.A', 'A3.A'), // talent and expression stand out, dares to innovate
    ...rule('bazi:pattern:建祿', 'E3.A'), // independent, builds by its own strength
    ...rule('bazi:pattern:月刃', 'B2.A', 'D3.B'), // bold, dares to push, goes after what it wants
];
