import {
    describe, expect, it,
} from 'vitest';
import { INSIGHT_RULES_VERSION } from '../ontology/insightRules';
import { reportSnapshotContentSchema } from '../schemas/firestore/reportSnapshot.schema';
import { fixedContentBodySchema } from '../schemas/firestore/fixedContent.schema';
import { bloodReportInput } from './adapters/blood';
import { mbtiReportInput } from './adapters/mbti';
import { tarotReportInput } from './adapters/state';
import { zodiacReportInput } from './adapters/zodiac';
import { assembleMultiReport } from './assembleMultiReport';
import type { SystemReportInput } from './types';

const body = (title: string) => fixedContentBodySchema.parse({
    title,
    summary: `${title}的簡述。`,
    strengths: ['優勢一'],
    blindSpots: ['盲點一'],
    growthAdvice: '給自己一點時間。',
    disclaimer: '僅供娛樂與自我探索。',
});

const zodiac = (sign: 'virgo' | 'taurus' | 'gemini'): SystemReportInput => zodiacReportInput({
    zodiac: sign, birthDate: '1989-09-10', body: body('星座'), natal: null,
});
const blood = (type: 'A' | 'B' | 'O' | 'AB' = 'A') => bloodReportInput({
    bloodType: type, body: body(`${type} 型`),
});
const mbti = (type: 'ENFP' | 'ISTJ' = 'ISTJ') => mbtiReportInput({
    type, dimensions: null, testVersion: null, body: body(type),
});
const tarot = () => tarotReportInput({
    date: '2026-10-28',
    card: {
        index: 0, roman: '0', name: '愚者', englishName: 'The Fool', orientation: 'upright', illustration: null,
    },
    content: {
        ...body('愚者'), contentType: 'TAROT', key: '0_upright', contentVersion: '1',
    },
    drawVersion: 'tarot-v1',
});

const keysOf = (report: ReturnType<typeof assembleMultiReport>) => report.blocks.map((item) => item.key);
const textsOf = (report: ReturnType<typeof assembleMultiReport>, key: string) => report.blocks.find((item) => item.key === key)?.segments.map((s) => s.text) ?? [];

describe('assembleMultiReport', () => {
    it('is a MULTI report of the lasting systems, in the order title, coordinates, highlights, axis map, insights, impact, advice, limits', () => {
        const report = assembleMultiReport([
            zodiac('virgo'),
            blood('A'),
            mbti('ISTJ'),
        ]);
        const keys = keysOf(report);

        expect(report.kind).toBe('MULTI');
        expect(report.systems).toEqual([
            'ZODIAC',
            'BLOOD',
            'MBTI',
        ]);
        expect(keys.slice(0, 4)).toEqual([
            'title',
            'coordinates',
            'highlights',
            'axis-map',
        ]);
        expect(keys.at(-2)).toBe('advice');
        expect(keys.at(-1)).toBe('limits');
        expect(keys.indexOf('insights')).toBeGreaterThan(keys.indexOf('axis-map'));
        expect(keys.indexOf('insights')).toBeLessThan(keys.findIndex((key) => key.startsWith('impact:')));
        expect(reportSnapshotContentSchema.safeParse(report).success).toBe(true);
    });

    it('refuses fewer than two lasting systems, and does not count a state of today as one', () => {
        expect(() => assembleMultiReport([blood()])).toThrow(/at least two/);
        expect(() => assembleMultiReport([blood(), tarot()])).toThrow(/at least two/);
    });

    it('puts the position of every system side by side, as facts only', () => {
        const report = assembleMultiReport([zodiac('virgo'), blood('A')]);
        const coordinates = report.blocks.find((item) => item.key === 'coordinates');

        expect(coordinates?.segments).toHaveLength(2);
        expect(coordinates?.segments.every((s) => s.kind === 'FACT')).toBe(true);
    });

    it('marks sources of different traditions as independent in the axis map, and of one tradition as one source', () => {
        // Virgo and blood type A are different traditions; both lean to order
        const independent = textsOf(assembleMultiReport([zodiac('virgo'), blood('A')]), 'axis-map').join('\n');

        expect(independent).toMatch(/條理秩序.*來源彼此獨立/);
    });

    it('shows no strength or confidence number in the axis map', () => {
        const report = assembleMultiReport([
            zodiac('virgo'),
            blood('A'),
            mbti('ISTJ'),
        ]);

        expect(textsOf(report, 'axis-map').join('')).not.toMatch(/\d|%|％|信心|強度/);
    });

    it('finds insights by the rules, each with its rule, its sources and a hypothesis to check', () => {
        const report = assembleMultiReport([zodiac('virgo'), blood('A')]);
        const insights = report.blocks.find((item) => item.key === 'insights');

        expect(insights?.segments.length).toBeGreaterThan(0);

        for (const item of insights?.segments ?? []) {
            expect(item.kind).toBe('AI_INFERENCE');
            expect(item.sources.some((source) => source.rule)).toBe(true);
            expect(item.confirmQuestion).toBeTruthy();
            expect(item.text).toMatch(/多個獨立來源|同源/);
        }

        expect(report.versions.insightRules).toBe(INSIGHT_RULES_VERSION);
    });

    it('holds a state of today against the report in its own block, and keeps it out of the axis map and the insights', () => {
        const without = assembleMultiReport([zodiac('virgo'), blood('A')]);
        const withToday = assembleMultiReport([zodiac('virgo'), blood('A')], [tarot()]);

        expect(keysOf(withToday)).toContain('now');
        expect(keysOf(without)).not.toContain('now');
        expect(textsOf(withToday, 'axis-map')).toEqual(textsOf(without, 'axis-map'));
        expect(textsOf(withToday, 'insights')).toEqual(textsOf(without, 'insights'));
        expect(withToday.blocks.find((item) => item.key === 'now')?.segments[0]).toMatchObject({
            timeSensitive: true, asOf: '2026-10-28',
        });
        expect(withToday.systems).not.toContain('TAROT');
    });

    it('lists, in an impact block, every system that points at the end', () => {
        const report = assembleMultiReport([zodiac('virgo'), blood('A')]);
        const order = report.blocks.find((item) => item.key === 'impact:B5.A');
        const systems = new Set(order?.segments.flatMap((s) => s.sources.flatMap((source) => (source.system ? [source.system] : []))));

        expect(systems).toEqual(new Set(['ZODIAC', 'BLOOD']));
    });

    it('is the same report for the same inputs', () => {
        expect(assembleMultiReport([zodiac('virgo'), blood('A')])).toEqual(assembleMultiReport([zodiac('virgo'), blood('A')]));
    });
});
