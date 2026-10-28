import {
    describe, expect, it,
} from 'vitest';
import { reportSnapshotContentSchema } from '../schemas/firestore/reportSnapshot.schema';
import type { MappingEntry } from '../ontology/schema';
import { findTraitEnd } from '../ontology/fragments';
import {
    SINGLE_REPORT_TEMPLATE_VERSION, assembleSingleReport,
} from './assembleSingleReport';
import { MAX_FACETS } from './facets';
import type { SystemReportInput } from './types';

const zodiac = (overrides: Partial<SystemReportInput> = {}): SystemReportInput => ({
    system: 'ZODIAC',
    position: '太陽天蠍座',
    facts: [
        {
            label: '太陽星座', value: '天蠍座', term: 'zodiac:scorpio',
        },
    ],
    interpretations: [
        {
            title: '天蠍座', text: '深入專注的洞察者。', term: 'zodiac:scorpio',
        },
    ],
    traits: ['zodiac:scorpio'],
    advice: ['給自己一點時間，把懷疑說出口。'],
    disclaimer: '僅供娛樂與自我探索。',
    basis: [],
    ...overrides,
});

const blockKeys = (input: SystemReportInput, options = {}) => assembleSingleReport(input, options).blocks.map((b) => b.key);

describe('assembleSingleReport', () => {
    it('puts the blocks in the one order: position, facts, conclusions, effects, advice, limits', () => {
        const keys = blockKeys(zodiac());

        expect(keys[0]).toBe('position');
        expect(keys[1]).toBe('facts');
        expect(keys[2]).toBe('summary');
        expect(keys.slice(3, -2).every((key) => key.startsWith('impact:'))).toBe(true);
        expect(keys.slice(-2)).toEqual(['advice', 'limits']);
    });

    it('gives a report the snapshot schema accepts, about one system', () => {
        const report = assembleSingleReport(zodiac());

        expect(reportSnapshotContentSchema.safeParse(report).success).toBe(true);
        expect(report).toMatchObject({
            kind: 'SINGLE', systems: ['ZODIAC'],
        });
        expect(report.versions).toMatchObject({ templates: SINGLE_REPORT_TEMPLATE_VERSION });
        expect(report).not.toHaveProperty('ai');
    });

    it('is the same report for the same input', () => {
        expect(assembleSingleReport(zodiac())).toEqual(assembleSingleReport(zodiac()));
    });

    describe('facts before conclusions', () => {
        it('marks the system\'s own facts and readings as such, and each reading with the tradition it rests on', () => {
            const segments = assembleSingleReport(zodiac()).blocks.find((b) => b.key === 'facts')?.segments ?? [];

            expect(segments[0]).toMatchObject({
                text: '太陽星座：天蠍座', kind: 'FACT',
            });
            expect(segments[1]).toMatchObject({ kind: 'SYSTEM_INTERPRETATION' });
            expect(segments[1]?.text).toMatch(/^【依傳統占星】/);
        });

        it('grounds every conclusion in a fact that is shown, naming it in the text and in the sources', () => {
            const summary = assembleSingleReport(zodiac()).blocks.find((b) => b.key === 'summary')?.segments ?? [];

            expect(summary.length).toBeGreaterThan(0);

            for (const item of summary) {
                expect(item.kind).toBe('AI_INFERENCE');
                expect(item.sources.some((source) => source.term === 'zodiac:scorpio' && source.system === 'ZODIAC')).toBe(true);
            }

            expect(summary[0]?.text).toContain('依據：太陽星座天蠍座');
        });

        it('makes no conclusion from a trait whose fact is not shown', () => {
            const keys = blockKeys(zodiac({
                facts: [
                    {
                        label: '太陽星座', value: '天蠍座',
                    },
                ],
            }));

            expect(keys).not.toContain('summary');
            expect(keys.some((key) => key.startsWith('impact:'))).toBe(false);
        });

        it('makes no conclusion at all from a term the mapping does not know', () => {
            const keys = blockKeys(zodiac({
                traits: ['zodiac:ophiuchus'],
                facts: [
                    {
                        label: '太陽星座', value: '蛇夫座', term: 'zodiac:ophiuchus',
                    },
                ],
            }));

            expect(keys).not.toContain('summary');
        });
    });

    describe('the map of effects', () => {
        it('has a block for each facet, with time, object and domain sentences and no empty cell', () => {
            const report = assembleSingleReport(zodiac());
            const impacts = report.blocks.filter((b) => b.key.startsWith('impact:'));

            expect(impacts).toHaveLength(3);

            for (const impact of impacts) {
                const fragments = impact.segments.map((s) => s.sources.find((source) => source.fragment)?.fragment ?? '');

                expect(fragments.every((id) => id.includes('|'))).toBe(true);
                expect(fragments.some((id) => id.includes('|time:'))).toBe(true);
                expect(fragments.some((id) => id.includes('|object:'))).toBe(true);
                expect(fragments.some((id) => id.includes('|domain:'))).toBe(true);
                expect(impact.segments.every((s) => s.text.trim().length > 0)).toBe(true);
            }
        });

        it('leaves out a cell with no sentence and borrows none from another', () => {
            const sources = assembleSingleReport(zodiac(), { fragments: {} }).blocks
                .filter((b) => b.key.startsWith('impact:'))
                .flatMap((b) => b.segments.map((s) => s.sources.find((source) => source.fragment)?.fragment ?? ''));

            // Only the time templates remain: the object and domain sentences were not written
            expect(sources.length).toBeGreaterThan(0);
            expect(sources.every((id) => id.includes('|time:'))).toBe(true);
        });

        it('keeps the past a guess with a question to check it against, and puts those questions in the advice', () => {
            const report = assembleSingleReport(zodiac());
            const past = report.blocks.flatMap((b) => b.segments).filter((s) => s.sources.some((source) => source.fragment?.endsWith('|time:past')));

            expect(past.length).toBeGreaterThan(0);

            for (const item of past) {
                expect(item.text).toMatch(/可能/);
                expect(item.confirmQuestion).toMatch(/回頭看/);
            }

            const questions = report.blocks.find((b) => b.key === 'advice')?.segments.filter((s) => s.text.startsWith('想一想：')) ?? [];

            expect(questions.length).toBeGreaterThan(0);
            expect(questions.length).toBeLessThanOrEqual(3);
        });

        it('goes into at most the most-supported facets', () => {
            const many = Array.from({ length: 8 }, (_, index) => ({
                system: 'ZODIAC', term: 'zodiac:scorpio', axisEnd: `A${(index % 6) + 1}.A`, method: 'keyword', kind: 'trait',
            })) as MappingEntry[];
            const impacts = assembleSingleReport(zodiac(), { mappings: many }).blocks.filter((b) => b.key.startsWith('impact:'));

            expect(impacts.length).toBeLessThanOrEqual(MAX_FACETS);
        });
    });

    describe('the two ends of one axis', () => {
        const entry = (axisEnd: string): MappingEntry => ({
            system: 'ZODIAC', term: 'zodiac:scorpio', axisEnd, method: 'keyword', kind: 'trait',
        });

        it('are both shown and called what they are: two features of the one system, not a contradiction', () => {
            const summary = assembleSingleReport(zodiac(), { mappings: [entry('C1.A'), entry('C1.B')] }).blocks.find((b) => b.key === 'summary')?.segments ?? [];
            const tension = summary.find((s) => s.text.includes('同時出現'));

            expect(tension?.text).toContain(findTraitEnd('C1.A')?.name);
            expect(tension?.text).toContain(findTraitEnd('C1.B')?.name);
            expect(tension?.text).toContain('不是矛盾');
        });
    });

    describe('what the report says about the system', () => {
        it('says plainly that the MBTI here is a questionnaire of our own', () => {
            const limits = assembleSingleReport({
                ...zodiac(), system: 'MBTI', position: 'ISTJ',
                facts: [
                    {
                        label: '外向或內向', value: '內向（I）', term: 'mbti:EI:I',
                    },
                ],
                traits: ['mbti:EI:I'],
            }).blocks.find((b) => b.key === 'limits')?.segments ?? [];

            expect(limits[0]?.text).toContain('自製');
            expect(limits[0]?.text).toContain('不是官方量表');
        });

        it('says what kind of system each is, in every report', () => {
            for (const system of [
                'ZODIAC',
                'BAZI',
                'HUMAN_DESIGN',
                'NUMEROLOGY',
                'MAYA_KIN',
                'BLOOD',
            ] as const) {
                const limits = assembleSingleReport({
                    ...zodiac(), system, traits: [], facts: [],
                }).blocks.find((b) => b.key === 'limits');

                expect(limits?.segments[0]?.text).toMatch(/^系統性質：/);
            }
        });

        it('says the time cells are guesses from the traits, not what the system says', () => {
            const limits = assembleSingleReport(zodiac()).blocks.find((b) => b.key === 'limits')?.segments.map((s) => s.text).join('\n');

            expect(limits).toContain('依特質作的推測，不是該系統的說法');
        });

        it('keeps the disclaimer and the notes, and the versions it was made from', () => {
            const limits = assembleSingleReport(zodiac({ notes: ['填寫出生時間與城市，可以看到上升、宮位與相位。'] })).blocks.find((b) => b.key === 'limits')?.segments.map((s) => s.text).join('\n');

            expect(limits).toContain('僅供娛樂與自我探索。');
            expect(limits).toContain('填寫出生時間與城市');
            expect(limits).toMatch(/本體 ontology-v1/);
        });
    });

    describe('what depends on the date', () => {
        it('keeps a luck cycle or a year number as a time-sensitive fact with the date it was made for', () => {
            const time = assembleSingleReport(zodiac({
                timeFacts: [
                    {
                        text: '依八字大運，目前這一步運主題偏向穩定累積。', asOf: '2026-10-28',
                    },
                ],
            })).blocks.find((b) => b.key === 'time')?.segments ?? [];

            expect(time[0]).toMatchObject({
                kind: 'FACT', timeSensitive: true, asOf: '2026-10-28',
            });
        });

        it('has no time block when the system has no time of its own', () => {
            expect(blockKeys(zodiac())).not.toContain('time');
        });
    });

    describe('a state system', () => {
        const tarot = (): SystemReportInput => zodiac({
            system: 'TAROT',
            position: '今天：隱者（逆位）',
            facts: [
                {
                    label: '牌', value: '隱者（逆位）', term: 'tarot:9:reversed',
                },
            ],
            traits: ['tarot:9:reversed'],
        });

        it('stops after the facts and the advice: no conclusion about the trait and no map of effects', () => {
            const keys = blockKeys(tarot());

            expect(keys).toEqual([
                'position',
                'facts',
                'advice',
                'limits',
            ]);
        });

        it('does not claim the time cells are guesses, since it has none', () => {
            const limits = assembleSingleReport(tarot()).blocks.find((b) => b.key === 'limits')?.segments.map((s) => s.text).join('\n');

            expect(limits).not.toContain('依特質作的推測');
        });
    });
});
