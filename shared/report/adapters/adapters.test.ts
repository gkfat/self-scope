import {
    describe, expect, it,
} from 'vitest';
import { computeNatalChart } from '../../../server/astrology/natalChart';
import { BaziService } from '../../../server/services/bazi.service';
import { NatalChartService } from '../../../server/services/natalChart.service';
import { reportSnapshotContentSchema } from '../../schemas/firestore/reportSnapshot.schema';
import { fixedContentBodySchema } from '../../schemas/firestore/fixedContent.schema';
import { personalYearNumber } from '../../utils/numerology';
import { assembleSingleReport } from '../assembleSingleReport';
import { bloodReportInput } from './blood';
import {
    horoscopeReportInput, runeReportInput, tarotReportInput,
} from './state';
import { baziReportInput } from './bazi';
import { calculateHumanDesign } from '../../../server/humanDesign/calculate';
import { humanDesignReportInput } from './humanDesign';
import { mayaKinReportInput } from './mayaKin';
import {
    mbtiReportInput, mbtiStrengthWord, 
} from './mbti';
import { numerologyReportInput } from './numerology';
import {
    NATAL_MISSING_NOTE, zodiacReportInput, 
} from './zodiac';

const body = (title: string) => fixedContentBodySchema.parse({
    title,
    summary: `${title}的簡述。`,
    strengths: ['優勢一', '優勢二'],
    blindSpots: ['盲點一'],
    workStyle: '工作的樣子。',
    growthAdvice: '給自己一點時間。',
    disclaimer: '僅供娛樂與自我探索。',
});

const accepted = (input: Parameters<typeof assembleSingleReport>[0]) => reportSnapshotContentSchema.safeParse(assembleSingleReport(input)).success;

describe('bloodReportInput', () => {
    it('makes a report the snapshot schema accepts, with the blood type as its one fact', () => {
        const input = bloodReportInput({
            bloodType: 'AB', body: body('AB 型'),
        });

        expect(input.position).toBe('AB 型');
        expect(input.facts).toEqual([
            {
                label: '血型', value: 'AB 型', term: 'blood:AB',
            },
        ]);
        expect(input.basis).toEqual([]);
        expect(accepted(input)).toBe(true);
    });

    it('takes its readings from the reviewed words and leaves them unchanged', () => {
        const readings = bloodReportInput({
            bloodType: 'O', body: body('O 型'),
        }).interpretations;

        expect(readings.map((r) => r.title)).toEqual([
            'O 型',
            '可能的優勢',
            '可能的盲點',
            '工作與決策',
        ]);
        expect(readings[1]?.text).toBe('優勢一；優勢二');
    });
});

describe('numerologyReportInput', () => {
    const input = numerologyReportInput({
        birthDate: '1989-10-27', today: '2026-10-28', body: body('生命靈數 1'),
    });

    it('gives the life path number as the position and as a fact the mapping can use', () => {
        expect(input.position).toBe('生命靈數 1');
        expect(input.facts[0]).toMatchObject({
            label: '生命靈數', value: '1', term: 'numerology:1',
        });
        expect(input.traits).toEqual(['numerology:1']);
    });

    it('keeps the year number as a fact with the date it was made for', () => {
        expect(input.timeFacts).toEqual([
            {
                text: `依生命靈數流年，2026 年的流年數是 ${personalYearNumber('1989-10-27', 2026)}。`, asOf: '2026-10-28',
            },
        ]);
        expect(assembleSingleReport(input).blocks.find((b) => b.key === 'time')?.segments[0]).toMatchObject({
            timeSensitive: true, asOf: '2026-10-28',
        });
    });

    it('records what it was calculated from', () => {
        expect(input.basis).toMatchObject([
            {
                system: 'NUMEROLOGY', inputs: { birthDate: '1989-10-27' },
            },
        ]);
        expect(accepted(input)).toBe(true);
    });
});

describe('zodiacReportInput', () => {
    const chart = new NatalChartService().calculate({
        birthDate: '1989-10-27', birthTime: '06:10', birthPlace: 'tw-taipei',
    });

    it('with a birth time and a city gives the chart, the houses with their rulers and the aspects as facts', () => {
        const input = zodiacReportInput({
            zodiac: 'scorpio', birthDate: '1989-10-27', body: body('天蠍座'), natal: {
                chart, birthTime: '06:10', birthPlace: 'tw-taipei',
            },
        });
        const labels = input.facts.map((fact) => fact.label);

        expect(input.position).toBe('太陽天蠍座');
        expect(labels).toContain('上升');
        expect(labels.filter((label) => label.startsWith('第 ')).length).toBe(12);
        expect(labels).toContain('相位');
        expect(input.facts.find((fact) => fact.label === '第 1 宮（自我與開始）')?.value).toContain('宮主星');
        expect(input.notes).toEqual([]);
        expect(input.basis.map((b) => b.system)).toEqual(['ZODIAC', 'NATAL_CHART']);
        expect(accepted(input)).toBe(true);
    });

    it('reads each placement with the reviewed text of that placement', () => {
        const input = zodiacReportInput({
            zodiac: 'scorpio', birthDate: '1989-10-27', body: body('天蠍座'), natal: {
                chart, birthTime: '06:10', birthPlace: 'tw-taipei',
            },
        });

        expect(input.interpretations.some((reading) => reading.title === '月亮在天秤座' || reading.title.startsWith('月亮在'))).toBe(true);
        expect(input.interpretations.length).toBeGreaterThan(10);
    });

    it('without them has only the sun sign, says what would add the rest, and guesses nothing', () => {
        const input = zodiacReportInput({
            zodiac: 'scorpio', birthDate: '1989-10-27', body: body('天蠍座'), natal: null,
        });

        expect(input.facts).toHaveLength(1);
        expect(input.facts[0]).toMatchObject({ term: 'zodiac:scorpio' });
        expect(input.notes).toEqual([NATAL_MISSING_NOTE]);
        expect(input.basis.map((b) => b.system)).toEqual(['ZODIAC']);
        const shownFacts = assembleSingleReport(input).blocks.find((b) => b.key === 'facts')?.segments.map((s) => s.text) ?? [];

        expect(shownFacts.some((text) => text.startsWith('上升：') || text.startsWith('第 1 宮'))).toBe(false);
    });

    it('does not depend on what the chart function returns beyond its own shape', () => {
        expect(computeNatalChart(new Date(Date.UTC(1989, 9, 26, 22, 10)), 25.033, 121.5654).ascendant.sign).toBe(chart.ascendant.sign);
    });
});

describe('mbtiReportInput', () => {
    const dimensions = {
        EI: {
            score: -18, maxScore: 20, leaning: 'I',
        },
        SN: {
            score: 2, maxScore: 20, leaning: 'S',
        },
        TF: {
            score: 5, maxScore: 20, leaning: 'T',
        },
        JP: {
            score: 8, maxScore: 20, leaning: 'J',
        },
    };

    it('names the four sides of the result and how clear each is', () => {
        const input = mbtiReportInput({
            type: 'ISTJ', dimensions, testVersion: '2', body: body('ISTJ'),
        });

        expect(input.position).toBe('ISTJ');
        expect(input.facts.map((fact) => fact.term)).toEqual([
            'mbti:EI:I',
            'mbti:SN:S',
            'mbti:TF:T',
            'mbti:JP:J',
        ]);
        expect(input.facts[0]?.value).toBe('內向（I），明顯偏向');
        expect(input.facts[1]?.value).toBe('實感（S），稍微偏向');
        expect(input.basis).toMatchObject([
            {
                system: 'MBTI', ruleVersion: '2',
            },
        ]);
        expect(accepted(input)).toBe(true);
    });

    it('says nothing about strength without the scores', () => {
        const input = mbtiReportInput({
            type: 'INTJ', dimensions: null, testVersion: null, body: body('INTJ'),
        });

        expect(input.facts.every((fact) => !fact.value.includes('偏向'))).toBe(true);
        expect(input.basis).toEqual([]);
    });

    it('buckets the strength the same way the page does', () => {
        expect(mbtiStrengthWord(0)).toBe('兩邊接近');
        expect(mbtiStrengthWord(0.33)).toBe('稍微偏向');
        expect(mbtiStrengthWord(0.5)).toBe('偏向');
        expect(mbtiStrengthWord(0.9)).toBe('明顯偏向');
    });

    it('is called a questionnaire of our own in the limits of the report', () => {
        const limits = assembleSingleReport(mbtiReportInput({
            type: 'ISTJ', dimensions, testVersion: '2', body: body('ISTJ'),
        })).blocks.find((b) => b.key === 'limits');

        expect(limits?.segments[0]?.text).toContain('自製');
    });
});

describe('mayaKinReportInput', () => {
    const input = mayaKinReportInput({
        birthDate: '2012-12-21', body: body('Kin 207'),
    });

    it('names the Kin, its seal and its tone, with the keywords of the Dreamspell table', () => {
        expect(input.position).toBe('Kin 207・水晶的藍手');
        expect(input.facts.find((fact) => fact.label === '圖騰')).toMatchObject({
            value: '藍手', term: 'kin:seal:7',
        });
        expect(input.facts.find((fact) => fact.label === '調性')).toMatchObject({
            value: '水晶', term: 'kin:tone:12',
        });
        expect(input.facts.find((fact) => fact.label === '圖騰的關鍵字')?.value).toBe('實踐、療癒');
        expect(input.traits).toEqual(['kin:seal:7', 'kin:tone:12']);
    });

    it('says that this is the Dreamspell, not an old Maya calendar, in the facts and in the limits', () => {
        expect(input.facts.find((fact) => fact.label === '曆法')?.value).toContain('不是古瑪雅原有的曆法');

        const limits = assembleSingleReport(input).blocks.find((b) => b.key === 'limits')?.segments[0]?.text;

        expect(limits).toContain('不是古瑪雅原有的曆法');
    });

    it('records what it was calculated from and gives a report the snapshot schema accepts', () => {
        expect(input.basis).toMatchObject([
            {
                system: 'MAYA_KIN', ruleVersion: 'dreamspell-v1', inputs: { birthDate: '2012-12-21' },
            },
        ]);
        expect(accepted(input)).toBe(true);
    });
});

describe('baziReportInput', () => {
    const NOW = Date.parse('2026-10-27T12:00:00+08:00');
    const run = async (params: { birthTime: string | null; gender: 'MALE' | null }) => {
        const service = new BaziService({
            clock: () => NOW,
            content: {
                getPublished: async (type: string, key: string) => ({
                    ...body(key), contentType: type, key, contentVersion: '1',
                }), 
            } as never,
        });
        const chart = await service.calculate({
            birthDate: '1989-10-27', birthTime: params.birthTime, birthPlace: 'tw-taipei', gender: params.gender,
        });

        return baziReportInput({
            chart, birthDate: '1989-10-27', birthTime: params.birthTime, birthPlace: 'tw-taipei', gender: params.gender, today: '2026-10-27',
        });
    };

    it('names the pillars and the day master, with the time facts dated', async () => {
        const input = await run({
            birthTime: '06:00', gender: 'MALE', 
        });

        expect(input.facts.find((fact) => fact.label === '四柱')?.value).toContain('時柱');
        expect(input.facts.find((fact) => fact.label === '日主')?.term).toMatch(/^bazi:daymaster:/);
        expect(input.timeFacts.length).toBeGreaterThan(0);
        expect(input.timeFacts.every((fact) => fact.asOf === '2026-10-27')).toBe(true);
        expect(accepted(input)).toBe(true);
    });

    it('says what is missing without a birth time or a gender', async () => {
        const input = await run({
            birthTime: null, gender: null, 
        });

        expect(input.facts.find((fact) => fact.label === '四柱')?.value).toContain('時柱 未知');
        expect(input.notes.join('')).toContain('沒有出生時間');
        expect(input.notes.join('')).toContain('性別');
        expect(accepted(input)).toBe(true);
    });
});

describe('humanDesignReportInput', () => {
    const chart = calculateHumanDesign('1989-10-27', '06:00', 'Asia/Taipei');
    const input = humanDesignReportInput({
        chart, birthDate: '1989-10-27', birthTime: '06:00', birthPlace: 'tw-taipei',
    });

    it('names the type, authority and each defined center and channel as facts with terms', () => {
        expect(input.facts.find((fact) => fact.label === '類型')?.term).toBe(`hd:type:${chart.type}`);
        expect(input.facts.find((fact) => fact.label === '內在權威')?.term).toBe(`hd:authority:${chart.authority}`);
        expect(input.facts.filter((fact) => fact.label === '有定義的能量中心')).toHaveLength(chart.definedCenters.length);
        expect(input.facts.filter((fact) => fact.label === '完整的通道')).toHaveLength(chart.channels.length);
        expect(input.traits.length).toBeGreaterThan(2);
    });

    it('keeps the profile, definition and cross out of the terms', () => {
        expect(input.facts.find((fact) => fact.label === '人生角色')?.term).toBeUndefined();
        expect(input.facts.find((fact) => fact.label === '定義')?.term).toBeUndefined();
    });

    it('records the birth data it was worked out from and gives a report the snapshot schema accepts', () => {
        expect(input.basis).toMatchObject([
            {
                system: 'HUMAN_DESIGN', inputs: {
                    birthDate: '1989-10-27', birthTime: '06:00', birthPlace: 'tw-taipei',
                },
            },
        ]);
        expect(accepted(input)).toBe(true);
    });
});

describe('the reports of today', () => {
    const content = {
        ...body('今日'), contentType: 'TAROT' as const, key: 'k', contentVersion: '1',
    };

    it('gives a tarot card a report the snapshot schema accepts, dated, and with the advice of the reading', () => {
        const input = tarotReportInput({
            date: '2026-10-28',
            card: {
                index: 1, roman: 'I', name: '魔術師', englishName: 'The Magician', orientation: 'upright', illustration: null,
            },
            content,
            drawVersion: 'tarot-v1',
        });

        expect(input.timeFacts?.[0]).toMatchObject({ asOf: '2026-10-28' });
        expect(input.advice).toContain('給自己一點時間。');
        expect(accepted(input)).toBe(true);
    });

    it('gives a rune a report the snapshot schema accepts', () => {
        const input = runeReportInput({
            date: '2026-10-28',
            rune: {
                index: 0, name: 'Fehu', glyph: 'ᚠ', meaning: '財富', orientation: 'upright', illustration: null,
            },
            content,
            drawVersion: 'rune-v1',
        });

        expect(input.position).toContain('Fehu');
        expect(accepted(input)).toBe(true);
    });

    it('gives the horoscope a fact for each body, read in the houses of the sign', () => {
        const input = horoscopeReportInput({
            horoscope: {
                date: '2026-10-28',
                sign: 'scorpio',
                bodies: [
                    {
                        body: 'MOON', name: '月亮', area: '今日心情與節奏', transitSign: 'leo', house: 3, content,
                    }, {
                        body: 'SUN', name: '太陽', area: '這段時間的主題', transitSign: 'scorpio', house: 1, content,
                    },
                ] as never,
            },
        });

        expect(input.facts).toHaveLength(2);
        expect(input.position).toContain('天蠍座');
        expect(accepted(input)).toBe(true);
    });
});
