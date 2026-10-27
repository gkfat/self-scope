import { Solar } from 'lunar-typescript';
import {
    BONE_DAY_QIAN,
    BONE_HOUR_QIAN,
    BONE_MONTH_QIAN,
    BONE_YEAR_QIAN,
    BRANCHES,
    STEMS,
    type Branch,
} from '../../constants/bazi';
import {
    ganzhiIndex,
    type Ganzhi,
} from './ganzhi';

export type BoneWeight = {
    /** Lunar year pillar (the year changes at the lunar new year, unlike the BaZi year pillar). */
    lunarYear: Ganzhi;
    lunarMonth: number;
    lunarDay: number;
    /** True when the birth is in a leap month; it is counted as that month. */
    leapMonth: boolean;
    hourBranch: Branch;
    /** Weight of each part in 錢. */
    parts: {
        year: number;
        month: number;
        day: number;
        hour: number;
    };
    totalQian: number;
    /** Weight as 兩 and 錢, e.g. 4 兩 1 錢. */
    liang: number;
    qian: number;
    label: string;
    /** Content key, `bone_<total in 錢>`, e.g. `bone_41`. */
    contentKey: string;
};

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const QIAN_PER_LIANG = 10;

function ganzhiFromLabel(label: string): Ganzhi {
    const stem = STEMS.find((item) => item === label[0]);
    const branch = BRANCHES.find((item) => item === label[1]);

    if (!stem || !branch) throw new Error(`Unexpected lunar year pillar: ${label}`);

    return {
        stem, branch,
    };
}

/**
 * 稱骨 weight from the lunar year pillar, lunar month, lunar day and hour. The civil date is the birthplace's
 * standard-time date, so a late 子 hour keeps the same date as the day pillar does.
 */
export function calculateBoneWeight(birthDate: string, hourBranch: Branch): BoneWeight {
    const match = DATE_PATTERN.exec(birthDate);

    if (!match) throw new Error(`Invalid birth date: ${birthDate}`);

    const lunar = Solar.fromYmd(Number(match[1]), Number(match[2]), Number(match[3])).getLunar();
    const lunarYear = ganzhiFromLabel(lunar.getYearInGanZhi());
    // The library gives a leap month as a negative month number
    const signedMonth = lunar.getMonth();
    const lunarMonth = Math.abs(signedMonth);
    const lunarDay = lunar.getDay();
    const parts = {
        year: BONE_YEAR_QIAN[ganzhiIndex(lunarYear)] as number,
        month: BONE_MONTH_QIAN[lunarMonth - 1] as number,
        day: BONE_DAY_QIAN[lunarDay - 1] as number,
        hour: BONE_HOUR_QIAN[BRANCHES.indexOf(hourBranch)] as number,
    };
    const totalQian = parts.year + parts.month + parts.day + parts.hour;
    const liang = Math.floor(totalQian / QIAN_PER_LIANG);
    const qian = totalQian % QIAN_PER_LIANG;

    return {
        lunarYear,
        lunarMonth,
        lunarDay,
        leapMonth: signedMonth < 0,
        hourBranch,
        parts,
        totalQian,
        liang,
        qian,
        label: qian === 0 ? `${liang} 兩` : `${liang} 兩 ${qian} 錢`,
        contentKey: `bone_${totalQian}`,
    };
}
