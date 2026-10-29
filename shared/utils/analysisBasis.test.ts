import {
    describe, expect, it,
} from 'vitest';
import {
    ANALYSIS_SYSTEMS, analysisBasisSchema,
} from '../schemas/analysisBasis.schema';
import {
    RULE_VERSIONS, buildBasis, buildMbtiBasis,
} from './analysisBasis';
import { RUNE_DRAW_VERSION } from './rune';
import { TAROT_DRAW_VERSION } from './tarot';

describe('analysisBasisSchema', () => {
    it('accepts a known system with a method and a version', () => {
        expect(analysisBasisSchema.safeParse({
            system: 'BAZI',
            method: 'bazi-four-pillars',
            ruleVersion: 'bazi-v1',
            inputs: { birthDate: '1990-01-01' },
        }).success).toBe(true);
    });

    it('rejects an unknown system, an empty version and nested inputs', () => {
        const base = {
            system: 'BAZI', method: 'm', ruleVersion: 'v', inputs: {},
        };

        expect(analysisBasisSchema.safeParse({
            ...base, system: 'ASTROLOGY',
        }).success).toBe(false);
        expect(analysisBasisSchema.safeParse({
            ...base, ruleVersion: '',
        }).success).toBe(false);
        expect(analysisBasisSchema.safeParse({
            ...base, inputs: { nested: { a: 1 } },
        }).success).toBe(false);
    });
});

describe('RULE_VERSIONS', () => {
    it('gives every system but MBTI a non-empty version', () => {
        for (const system of ANALYSIS_SYSTEMS.filter((s) => s !== 'MBTI')) {
            expect(RULE_VERSIONS[system as keyof typeof RULE_VERSIONS]).toMatch(/\S/);
        }
    });

    it('reuses the draw versions of the tarot and the runes', () => {
        expect(RULE_VERSIONS.TAROT).toBe(TAROT_DRAW_VERSION);
        expect(RULE_VERSIONS.RUNE).toBe(RUNE_DRAW_VERSION);
    });
});

describe('buildBasis', () => {
    it('gives the same basis for the same inputs and version', () => {
        const inputs = { birthDate: '1987-06-23' };

        expect(buildBasis('MAYA_KIN', inputs)).toEqual(buildBasis('MAYA_KIN', inputs));
    });

    it('carries the version constant of the system', () => {
        expect(buildBasis('MAYA_KIN', { birthDate: '1987-06-23' }).ruleVersion).toBe(RULE_VERSIONS.MAYA_KIN);
    });

    it('rejects inputs that are not flat', () => {
        expect(() => buildBasis('BAZI', { nested: { a: 1 } } as never)).toThrow();
    });
});

describe('buildMbtiBasis', () => {
    it('uses the test version as the rule version', () => {
        expect(buildMbtiBasis('v3').ruleVersion).toBe('v3');
    });
});
