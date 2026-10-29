import {
    GALACTIC_TONES, SOLAR_SEALS, 
} from '../../constants/mayaKin';
import {
    GALACTIC_TONE_MEANINGS, SOLAR_SEAL_MEANINGS,
} from '../../constants/mayaKinMeanings';
import type { FixedResultResponse } from '../../schemas/api/fixedResult.schema';
import {
    kinName, sealName, toneName, type Kin,
} from '../../utils/mayaKin';

/** The same groups, in the same order, as the readings of a tarot card and a rune (see adapters/state.ts) */
export type KinTodayGroup = {
    title: string;
    readings: Array<{ title: string; text: string }>;
};

export type KinTodayReading = {
    /** The theme of the day with what to watch for, quoted at the head of the overview */
    lead: string;
    facts: Array<{ label: string; value: string; subtitle?: string }>;
    groups: KinTodayGroup[];
    /** "今天可以試試：…" and "想一想：…", as the advice of the other reports */
    advice: string[];
};

const text = (value: string | undefined): string => value?.trim() ?? '';

/** A group with the readings that have text; a group with none is left out */
const group = (title: string, readings: Array<[string, string | undefined]>): KinTodayGroup[] => {
    const filled = readings.filter(([, body]) => text(body) !== '').map(([label, body]) => ({
        title: label, text: text(body),
    }));

    return filled.length > 0 ? [
        {
            title, readings: filled,
        },
    ] : [];
};

/**
 * Today's Kin as the sections of a draw: the theme of the day, the keywords, what the seal and the tone mean, how it
 * can look in daily life, light and shadow, and what to try with the questions to think over. The seal and the tone
 * are each a part of the reading, as the 260 daily messages are put together from them.
 */
export function kinTodayReading(params: { kin: Kin; content: FixedResultResponse }): KinTodayReading {
    const {
        kin, content,
    } = params;
    const seal = SOLAR_SEAL_MEANINGS[kin.solarSeal - 1];
    const tone = GALACTIC_TONE_MEANINGS[kin.galacticTone - 1];
    const watch = content.blindSpots.map(text).filter((item) => item !== '').join('；');
    const attempt = text(content.growthAdvice).replace(/^今天可以試試[：:，、]?/, '');

    return {
        lead: `${text(content.summary)}${watch ? `但要注意，${watch}` : ''}`,
        facts: [
            {
                label: '今日的 Kin', value: kinName(kin), subtitle: `Kin ${kin.kinNumber}`,
            },
            {
                label: '圖騰', value: sealName(kin.solarSeal), subtitle: SOLAR_SEALS[kin.solarSeal - 1]?.englishName,
            },
            {
                label: '調性', value: toneName(kin.galacticTone), subtitle: GALACTIC_TONES[kin.galacticTone - 1]?.englishName,
            },
        ],
        groups: [
            ...group('關鍵字', [['關鍵字', content.strengths.map(text).filter((word) => word !== '').join('、')]]),
            ...group('圖騰與調性', [['圖騰', seal?.meaning], ['調性', tone?.meaning]]),
            ...group('生活面向', [
                ['感情', seal?.love],
                ['工作', seal?.work],
                ['自我', seal?.self],
                ['人際', seal?.relationship],
            ]),
            ...group('光明、陰影與成長', [
                ['光明面', seal?.light],
                ['陰影面', seal?.shadow],
                ['成長課題', tone?.growthTask],
            ]),
        ],
        advice: [...(attempt ? [`今天可以試試：${attempt}`] : []), ...[...(seal?.reflections ?? []), ...(tone ? [tone.reflection] : [])].map((question) => `想一想：${question}`)],
    };
}
