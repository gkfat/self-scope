import {
    describe, expect, it,
} from 'vitest';
import {
    humanDesignAuthoritySchema, humanDesignDefinitionSchema, humanDesignTypeSchema, incarnationCrossAngleSchema,
} from '../schemas/firestore/humanDesign.schema';
import { calculateHumanDesign } from '../../server/humanDesign/calculate';
import {
    HUMAN_DESIGN_AUTHORITY_INTERPRETATIONS,
    HUMAN_DESIGN_CROSS_ANGLE_INTERPRETATIONS,
    HUMAN_DESIGN_DEFINITION_INTERPRETATIONS,
    HUMAN_DESIGN_LINE_NAMES,
    HUMAN_DESIGN_PROFILES,
    HUMAN_DESIGN_PROFILE_INTERPRETATIONS,
    HUMAN_DESIGN_TYPE_INTERPRETATIONS,
    type HumanDesignInterpretation,
} from './humanDesignInterpretations';

const FIELDS = [
    'summary',
    'strengths',
    'blindSpots',
    'reflection',
] as const;

const complete = (entry: HumanDesignInterpretation) => FIELDS.every((field) => entry[field].trim().length > 0);

const everyText = () => [
    ...Object.values(HUMAN_DESIGN_TYPE_INTERPRETATIONS).flatMap((e) => [...FIELDS.map((f) => e[f]), e.strategy]),
    ...Object.values(HUMAN_DESIGN_AUTHORITY_INTERPRETATIONS).flatMap((e) => FIELDS.map((f) => e[f])),
    ...Object.values(HUMAN_DESIGN_PROFILE_INTERPRETATIONS).flatMap((e) => FIELDS.map((f) => e[f])),
    ...Object.values(HUMAN_DESIGN_DEFINITION_INTERPRETATIONS).flatMap((e) => FIELDS.map((f) => e[f])),
    ...Object.values(HUMAN_DESIGN_CROSS_ANGLE_INTERPRETATIONS).flatMap((e) => FIELDS.map((f) => e[f])),
];

describe('Human Design interpretations', () => {
    it('cover every type, authority, definition and cross angle with all four fields', () => {
        const groups: Array<[readonly string[], Record<string, HumanDesignInterpretation>]> = [
            [humanDesignTypeSchema.options, HUMAN_DESIGN_TYPE_INTERPRETATIONS],
            [humanDesignAuthoritySchema.options, HUMAN_DESIGN_AUTHORITY_INTERPRETATIONS],
            [humanDesignDefinitionSchema.options, HUMAN_DESIGN_DEFINITION_INTERPRETATIONS],
            [incarnationCrossAngleSchema.options, HUMAN_DESIGN_CROSS_ANGLE_INTERPRETATIONS],
        ];

        for (const [values, interpretations] of groups) {
            expect(Object.keys(interpretations).sort()).toEqual([...values].sort());

            for (const value of values) {
                expect(complete(interpretations[value] as HumanDesignInterpretation)).toBe(true);
            }
        }
    });

    it('has exactly the twelve profiles, each with a name made of its two lines', () => {
        expect([...HUMAN_DESIGN_PROFILES].sort()).toEqual([
            '1/3',
            '1/4',
            '2/4',
            '2/5',
            '3/5',
            '3/6',
            '4/1',
            '4/6',
            '5/1',
            '5/2',
            '6/2',
            '6/3',
        ]);
        expect(Object.keys(HUMAN_DESIGN_PROFILE_INTERPRETATIONS).sort()).toEqual([...HUMAN_DESIGN_PROFILES].sort());

        for (const profile of HUMAN_DESIGN_PROFILES) {
            const entry = HUMAN_DESIGN_PROFILE_INTERPRETATIONS[profile];
            const [conscious = '', design = ''] = profile.split('/');

            expect(complete(entry)).toBe(true);
            expect(entry.name).toBe(`${HUMAN_DESIGN_LINE_NAMES[Number(conscious)]}／${HUMAN_DESIGN_LINE_NAMES[Number(design)]}`);
        }
    });

    it('describes the strategy of every type', () => {
        for (const entry of Object.values(HUMAN_DESIGN_TYPE_INTERPRETATIONS)) {
            expect(entry.strategy.trim().length).toBeGreaterThan(0);
        }

        expect(HUMAN_DESIGN_TYPE_INTERPRETATIONS.PROJECTOR.strategy).toContain('等待邀請');
    });

    it('never ranks one kind above another and gives no medical, legal or financial advice', () => {
        const banned = [
            '比較好',
            '比較差',
            '更好',
            '更差',
            '優於',
            '劣於',
            '最好',
            '最差',
            '治療',
            '診斷',
            '醫',
            '藥',
            '投資',
            '報酬',
            '訴訟',
            '法律',
        ];

        for (const text of everyText()) {
            for (const word of banned) {
                expect(text, `"${word}" in: ${text}`).not.toContain(word);
            }
        }
    });

    it('has a profile reading for every profile a real chart can have', () => {
        const seen = new Set<string>();

        for (let year = 1930; year <= 2020; year += 1) {
            for (const month of [
                '02',
                '05',
                '08',
                '11',
            ]) {
                seen.add(calculateHumanDesign(`${year}-${month}-14`, '09:30', 'Asia/Taipei').profile);
            }
        }

        for (const profile of seen) {
            expect(HUMAN_DESIGN_PROFILES as readonly string[]).toContain(profile);
        }
    });
});
