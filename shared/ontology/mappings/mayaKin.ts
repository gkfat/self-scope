import {
    GALACTIC_TONES, SOLAR_SEALS,
} from '../../constants/mayaKin';
import type { Kin } from '../../utils/mayaKin';
import { keywordRule } from './keywordRule';
import type { MappingEntry } from '../schema';

/** The 20 solar seals and the 13 galactic tones of the Dreamspell, e.g. "kin:seal:3" and "kin:tone:5". */
export const MAYA_KIN_TERMS: readonly string[] = [...SOLAR_SEALS.map((seal) => `kin:seal:${seal.index}`), ...GALACTIC_TONES.map((tone) => `kin:tone:${tone.index}`)];

/** The two terms of a Kin: its seal and its tone. */
export const mayaKinTermsOf = (kin: Pick<Kin, 'solarSeal' | 'galacticTone'>): string[] => [`kin:seal:${kin.solarSeal}`, `kin:tone:${kin.galacticTone}`];

const rule = keywordRule('MAYA_KIN');

/**
 * The rule is by keyword: a seal or a tone points at an axis end where its keyword (the one or two words the project's
 * Dreamspell table gives it) means what the end describes. Where the keyword has no such meaning the term stays
 * unmapped. The Dreamspell is a calendar of the twentieth century, not an old Maya one, and has no evidence behind it;
 * it is the thinnest ground of all the systems mapped.
 * Seals unmapped: 世界橋, 猴, 人, 地球. Tones unmapped: 月亮, 電力, 共振, 銀河星系, 太陽, 光譜. Their keywords name no
 * trait.
 */
export const MAYA_KIN_MAPPINGS: readonly MappingEntry[] = [
    // Solar seals
    ...rule('kin:seal:1', 'D2.A', 'E1.A'), // 龍: nourishing, a foundation
    ...rule('kin:seal:2', 'C2.A'), // 風: communication
    ...rule('kin:seal:3', 'A1.B'), // 夜: intuition
    ...rule('kin:seal:4', 'E4.A'), // 種子: potential and growth
    ...rule('kin:seal:5', 'A1.B'), // 蛇: instinct
    ...rule('kin:seal:7', 'E2.B', 'D2.A'), // 手: practice, healing
    ...rule('kin:seal:8', 'A6.A'), // 星星: elegance, beauty
    ...rule('kin:seal:9', 'B4.B'), // 月亮: flow
    ...rule('kin:seal:10', 'E5.A', 'D2.A'), // 狗: loyalty, companionship
    ...rule('kin:seal:13', 'A4.A'), // 天行者: exploring
    ...rule('kin:seal:14', 'D6.A'), // 巫師: receiving, accepting
    ...rule('kin:seal:15', 'A5.B', 'A3.A'), // 鷹: a wide view, creating
    ...rule('kin:seal:16', 'B2.A', 'A1.A'), // 戰士: courage, questioning
    ...rule('kin:seal:18', 'C3.A'), // 鏡: sincerity
    ...rule('kin:seal:19', 'E1.B'), // 風暴: transformation
    ...rule('kin:seal:20', 'D2.A'), // 太陽: generosity

    // Galactic tones
    ...rule('kin:tone:1', 'E2.A'), // 磁性: purpose
    ...rule('kin:tone:4', 'B5.A'), // 自我存在: form
    ...rule('kin:tone:5', 'D5.A'), // 超頻: influence
    ...rule('kin:tone:6', 'B5.A'), // 韻律: order
    ...rule('kin:tone:10', 'D6.B'), // 行星: perfecting
    ...rule('kin:tone:12', 'D3.A'), // 水晶: cooperation
    ...rule('kin:tone:13', 'B1.B'), // 宇宙: presence
];
