import type { Center } from './humanDesign';

/**
 * What it can mean when a center is defined (colored) and when it is open (white). Fixed text, the same for
 * everyone, written tentatively: a defined center is a steadier source, an open one is more flexible and more
 * open to what is around it. Neither is better.
 */
export const CENTER_MEANINGS: Readonly<Record<Center, { defined: string; open: string }>> = {
    HEAD: {
        defined: '比較穩定地產生想法與疑問，靈感容易自己冒出來。',
        open: '容易被別人的想法與問題牽動，也比較能從不同角度思考。',
    },
    AJNA: {
        defined: '整理與判斷資訊的方式比較固定，有自己的思考風格。',
        open: '想法有彈性，容易隨環境與對象調整，也可能反覆改變看法。',
    },
    THROAT: {
        defined: '表達有固定的出口，說話與行動的方式比較一致。',
        open: '表達會隨場合改變，有時要等對的時機才說得出口。',
    },
    G: {
        defined: '對「我是誰、要往哪裡去」的感覺比較穩定。',
        open: '方向感會隨環境與身邊的人變化，適合找對的環境與夥伴。',
    },
    HEART: {
        defined: '意志力與自我價值感比較穩定，答應的事通常做得到。',
        open: '不必事事證明自己，但容易被「要證明」的壓力影響。',
    },
    SACRAL: {
        defined: '有持續的生命力與工作能量，需要把能量用在對的事上。',
        open: '能量不固定，容易累積過頭，需要主動安排休息。',
    },
    SPLEEN: {
        defined: '直覺與安全感比較穩定，對當下的狀況反應很快。',
        open: '對安全與健康的感覺容易受環境影響，可能抓著不適合的人事物。',
    },
    SOLAR_PLEXUS: {
        defined: '情緒像波浪有高低起伏，重要的決定適合等情緒平穩再做。',
        open: '容易吸收周圍的情緒，需要分辨哪些是自己的感受。',
    },
    ROOT: {
        defined: '面對壓力有固定的節奏與推進力。',
        open: '容易感覺被催促，想盡快把壓力處理掉。',
    },
};
