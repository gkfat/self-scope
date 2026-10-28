import {
    describe, expect, it,
} from 'vitest';
import { computeNatalChart } from '../../../server/astrology/natalChart';
import { NatalChartService } from '../../../server/services/natalChart.service';
import { reportSnapshotContentSchema } from '../../schemas/firestore/reportSnapshot.schema';
import { fixedContentBodySchema } from '../../schemas/firestore/fixedContent.schema';
import { personalYearNumber } from '../../utils/numerology';
import { assembleSingleReport } from '../assembleSingleReport';
import { bloodReportInput } from './blood';
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
