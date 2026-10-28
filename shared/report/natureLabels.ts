import type { MappingSystem } from '../ontology/schema';

/**
 * What kind of system each one is, shown on every report: the label says it plainly, the tradition names what its
 * readings rest on ("依傳統占星"). None of them has scientific evidence behind it; the questionnaire is our own.
 */
export const SYSTEM_NATURE: Readonly<Record<MappingSystem, { label: string; tradition: string }>> = {
    ZODIAC: {
        label: '傳統占星，象徵性的解讀，沒有科學證據', tradition: '傳統占星',
    },
    HOROSCOPE: {
        label: '傳統占星，象徵性的當日解讀，沒有科學證據', tradition: '傳統占星',
    },
    BAZI: {
        label: '傳統命理，依中國曆法與命理規則，沒有科學證據', tradition: '八字命理',
    },
    HUMAN_DESIGN: {
        label: '1987 年後出現的新興系統，沒有科學證據', tradition: '人類圖',
    },
    NUMEROLOGY: {
        label: '數字命理，沒有科學證據', tradition: '數字命理',
    },
    MAYA_KIN: {
        label: 'Dreamspell 曆法（二十世紀提出的新曆法，不是古瑪雅原有的曆法），沒有科學證據', tradition: 'Dreamspell 曆法',
    },
    TAROT: {
        label: '占卜工具，象徵性的當下提醒，沒有科學證據', tradition: '塔羅傳統',
    },
    RUNE: {
        label: '占卜工具，象徵性的當下提醒，沒有科學證據', tradition: '盧恩傳統',
    },
    BLOOD: {
        label: '民間說法，沒有科學證據', tradition: '血型的民間說法',
    },
    MBTI: {
        label: '自製的 MBTI 風格問卷，不是官方量表，結果不等於經過正式工具驗證的類型', tradition: '自製的 MBTI 風格問卷',
    },
};
