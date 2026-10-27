import type {
    ElementPhase, Polarity, StrengthLevel,
} from './bazi';

/** Traditional Chinese labels the BaZi screens print; the calculation modules never use them. */
export const BAZI_POSITION_LABELS = {
    year: '年柱',
    month: '月柱',
    day: '日柱',
    hour: '時柱',
} as const;

export const BAZI_POLARITY_LABELS: Record<Polarity, string> = {
    YANG: '陽',
    YIN: '陰',
};

export const BAZI_HIDDEN_ROLE_LABELS = {
    MAIN: '本氣',
    MIDDLE: '中氣',
    RESIDUAL: '餘氣',
} as const;

export const BAZI_RELATION_LABELS = {
    STEM_COMBINE: '天干五合',
    BRANCH_COMBINE: '地支六合',
    BRANCH_CLASH: '地支六沖',
} as const;

export const BAZI_LUCK_DIRECTION_LABELS = {
    FORWARD: '順行',
    BACKWARD: '逆行',
} as const;

export const BAZI_STRENGTH_SIDE_LABELS = {
    STRONG: '偏強',
    WEAK: '偏弱',
    BALANCED: '平衡',
} as const;

/** What the five strength levels read as, in the "easier / harder direction" tone (no good or bad). */
export const BAZI_STRENGTH_NOTES: Record<StrengthLevel, string> = {
    taiwang: '日主得到的幫扶很多，自我的力量很明顯',
    strong: '日主得到的幫扶偏多，自己的主見與力量較突出',
    balanced: '幫扶與消耗大致平衡，各方向相對均衡',
    weak: '日主得到的幫扶偏少，較需要外在的支持與配合',
    taiwei: '日主得到的幫扶很少，外在的影響力相對明顯',
};

export const BAZI_PHASE_NOTES: Record<ElementPhase, string> = {
    旺: '當令',
    相: '月令所生',
    休: '生月令者',
    囚: '剋月令者',
    死: '月令所剋',
};

/** The rules the page prints so a reader can compare with other charts. */
export const BAZI_RULE_NOTES = [
    '年柱以立春換年，不是農曆正月初一，也不是 1 月 1 日。',
    '月柱以十二個「節」（立春、驚蟄、清明、立夏、芒種、小暑、立秋、白露、寒露、立冬、大雪、小寒）換月，節氣時刻由太陽黃經計算。',
    '日柱以出生地當地時間 00:00 換日；23:00 到 24:00 的晚子時，日柱不換，時柱的天干依隔天的日干推算。',
    '採用出生地的標準時間（含當年的夏令時間調整），不換算真太陽時；沒有填出生城市時以台北（UTC+8）計算。',
    '日主強弱依各位置的權重計算幫扶分（月令佔最多）；喜神、用神、忌神由強弱與命格查固定的表，以十神類別表示。',
    '稱骨使用農曆生年（正月初一換年）、農曆月日與時辰；與八字年柱換年的依據不同，所以立春後、春節前出生者兩者的「年」可能不同。',
] as const;

export const BAZI_DISCLAIMER = '八字命盤的計算是依固定規則得出的文化與曆法資訊，解讀僅供娛樂與自我探索，不預測吉凶、婚姻、健康、壽命或財運，也不能取代醫療、法律或財務的專業建議。不同流派的算法與判定標準可能不同，結果也可能因此不同。';
