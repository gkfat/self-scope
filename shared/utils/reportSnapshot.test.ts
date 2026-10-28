import {
    describe, expect, it,
} from 'vitest';
import {
    reportSnapshotContentSchema, snapshotSegmentSchema, snapshotSourceSchema, SNAPSHOT_SEGMENT_KINDS,
} from '../schemas/firestore/reportSnapshot.schema';
import {
    REPORT_SECTIONS, evidenceKindSchema, 
} from '../schemas/firestore/detailedReport.schema';
import { snapshotKindOfEvidence } from './reportSnapshot';

describe('snapshotKindOfEvidence', () => {
    it('turns what the AI report calls OBSERVED into a fact, or into the system\'s interpretation', () => {
        expect(snapshotKindOfEvidence('OBSERVED')).toBe('FACT');
        expect(snapshotKindOfEvidence('OBSERVED', { systemInterpretation: true })).toBe('SYSTEM_INTERPRETATION');
    });

    it('turns INFERRED into the AI\'s own conclusion, whatever else is said', () => {
        expect(snapshotKindOfEvidence('INFERRED')).toBe('AI_INFERENCE');
        expect(snapshotKindOfEvidence('INFERRED', { systemInterpretation: true })).toBe('AI_INFERENCE');
    });

    it('covers every value the AI report has, and leaves its own schema as it was', () => {
        for (const value of evidenceKindSchema.options) {
            expect(SNAPSHOT_SEGMENT_KINDS).toContain(snapshotKindOfEvidence(value));
        }

        expect(evidenceKindSchema.options).toEqual(['OBSERVED', 'INFERRED']);
        expect(REPORT_SECTIONS).toHaveLength(8);
    });
});

describe('the segment and source schemas', () => {
    const segment = {
        text: '你的太陽在天蠍座。', kind: 'FACT', sources: [{ system: 'ZODIAC' }], timeSensitive: false, asOf: null,
    };

    it('hold the four kinds, one of which nothing produces yet', () => {
        expect([...SNAPSHOT_SEGMENT_KINDS]).toEqual([
            'FACT',
            'SYSTEM_INTERPRETATION',
            'AI_INFERENCE',
            'USER_STATEMENT',
        ]);
    });

    it('accept a sound sentence and turn away an unknown kind', () => {
        expect(snapshotSegmentSchema.safeParse(segment).success).toBe(true);
        expect(snapshotSegmentSchema.safeParse({
            ...segment, kind: 'GUESS',
        }).success).toBe(false);
    });

    it('turn away a source that names nothing and one with a field it does not know', () => {
        expect(snapshotSourceSchema.safeParse({}).success).toBe(false);
        expect(snapshotSourceSchema.safeParse({
            system: 'ZODIAC', confidence: 0.9,
        }).success).toBe(false);
        expect(snapshotSourceSchema.safeParse({
            axisEnd: 'A1.A', fragment: 'A1.A|object:self',
        }).success).toBe(true);
    });

    it('keep a report to at least one system and one block', () => {
        const report = {
            kind: 'SINGLE',
            systems: ['ZODIAC'],
            position: '太陽天蠍座',
            blocks: [
                {
                    key: 'a', title: 'A', segments: [segment],
                },
            ],
            versions: {
                ontology: 'o', mapping: 'm', fragments: 'f', templates: 't',
            },
            basis: [],
        };

        expect(reportSnapshotContentSchema.safeParse(report).success).toBe(true);
        expect(reportSnapshotContentSchema.safeParse({
            ...report, blocks: [],
        }).success).toBe(false);
        expect(reportSnapshotContentSchema.safeParse({
            ...report, systems: [],
        }).success).toBe(false);
    });
});
