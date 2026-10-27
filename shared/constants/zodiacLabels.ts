import type {
    BloodType, Gender, Zodiac,
} from '../schemas/common';

/** Traditional Chinese names shown to members. */
export const ZODIAC_LABELS: Record<Zodiac, string> = {
    aries: '牡羊座',
    taurus: '金牛座',
    gemini: '雙子座',
    cancer: '巨蟹座',
    leo: '獅子座',
    virgo: '處女座',
    libra: '天秤座',
    scorpio: '天蠍座',
    sagittarius: '射手座',
    capricorn: '摩羯座',
    aquarius: '水瓶座',
    pisces: '雙魚座',
};

export const GENDER_LABELS: Record<Gender, string> = {
    MALE: '男',
    FEMALE: '女',
};

export const BLOOD_TYPE_LABELS: Record<BloodType, string> = {
    A: 'A 型',
    B: 'B 型',
    O: 'O 型',
    AB: 'AB 型',
    UNKNOWN: '不知道',
};
