import {
    describe, expect, it,
} from 'vitest';
import { TRAIT_AXES } from './axes';
import { CONTEXT_VALUES } from './context';
import {
    ONTOLOGY_VERSION, endId, findContextIssues, findTraitAxesIssues, loadOntology,
} from './ontology';
import { TRAIT_GROUP_LETTERS } from './schema';

const axis = (id: string, overrides: Record<string, unknown> = {}) => ({
    id,
    group: 'THINKING',
    a: {
        name: '甲', description: '甲說明', overuse: '甲過度',
    },
    b: {
        name: '乙', description: '乙說明', overuse: '乙過度',
    },
    ...overrides,
});

describe('the trait axes', () => {
    it('are 28, each with two ends that have a name, a description and what overdoing looks like', () => {
        expect(TRAIT_AXES).toHaveLength(28);
        expect(findTraitAxesIssues(TRAIT_AXES)).toEqual([]);
    });

    it('sort into the five groups, whose ids start with the letter of the group', () => {
        for (const axisItem of TRAIT_AXES) {
            expect(axisItem.id.startsWith(TRAIT_GROUP_LETTERS[axisItem.group])).toBe(true);
        }

        expect(new Set(TRAIT_AXES.map((a) => a.group)).size).toBe(5);
    });

    it('give every end an id of its own', () => {
        const ids = TRAIT_AXES.flatMap((a) => [endId(a.id, 'A'), endId(a.id, 'B')]);

        expect(ids).toHaveLength(56);
        expect(new Set(ids).size).toBe(56);
    });

    it('reject an axis with a single end, naming the axis', () => {
        const single: Record<string, unknown> = axis('A1');

        delete single.b;

        expect(findTraitAxesIssues([single], 1).join('\n')).toMatch(/axis A1: b/);
    });

    it('reject an end with nothing written for what overdoing looks like', () => {
        const issues = findTraitAxesIssues([
            axis('A1', {
                a: {
                    name: '甲', description: '甲說明', overuse: '',
                },
            }),
        ], 1);

        expect(issues.join('\n')).toMatch(/axis A1: a\.overuse/);
    });

    it('reject an id used twice, an id from the wrong group and a wrong count', () => {
        expect(findTraitAxesIssues([axis('A1'), axis('A1')], 2).join('\n')).toMatch(/A1 is used more than once/);
        expect(findTraitAxesIssues([axis('B1')], 1).join('\n')).toMatch(/B1 belongs to THINKING/);
        expect(findTraitAxesIssues([axis('A1')], 28).join('\n')).toMatch(/expected 28 axes, found 1/);
    });

    it('reject a name that ranks an end above the other', () => {
        const issues = findTraitAxesIssues([
            axis('A1', {
                a: {
                    name: '優秀', description: '說明', overuse: '過度',
                },
            }),
        ], 1);

        expect(issues.join('\n')).toMatch(/ranks the end/);
    });
});

describe('the context axes', () => {
    it('have 3 time values, 10 objects and 10 domains with unique ids', () => {
        expect(findContextIssues(CONTEXT_VALUES)).toEqual([]);
        expect(CONTEXT_VALUES.filter((v) => v.kind === 'time')).toHaveLength(3);
        expect(CONTEXT_VALUES.filter((v) => v.kind === 'object')).toHaveLength(10);
        expect(CONTEXT_VALUES.filter((v) => v.kind === 'domain')).toHaveLength(10);
        expect(new Set(CONTEXT_VALUES.map((v) => v.id)).size).toBe(23);
    });

    it('call the domain "人際互動" and have no "人際關係"', () => {
        const domains = CONTEXT_VALUES.filter((v) => v.kind === 'domain').map((v) => v.name);

        expect(domains).toContain('人際互動');
        expect(domains).not.toContain('人際關係');
    });

    it('turn away a domain called "人際關係"', () => {
        const issues = findContextIssues([
            {
                id: 'domain:relations', kind: 'domain', name: '人際關係', description: '說明',
            },
        ], {
            time: 0, object: 0, domain: 1,
        });

        expect(issues.join('\n')).toMatch(/人際互動/);
    });

    it('turn away an id that does not match its kind and a repeated id', () => {
        const value = {
            id: 'object:x', kind: 'domain', name: '甲', description: '說明',
        };
        const issues = findContextIssues([value, value], {
            time: 0, object: 0, domain: 2,
        });

        expect(issues.join('\n')).toMatch(/is used more than once/);
        expect(issues.join('\n')).toMatch(/listed as domain/);
    });
});

describe('loadOntology', () => {
    it('gives the validated axes and context, with the id of every end and a version', () => {
        const ontology = loadOntology();

        expect(ontology.version).toBe(ONTOLOGY_VERSION);
        expect(ONTOLOGY_VERSION).toMatch(/\S/);
        expect(ontology.axes).toHaveLength(28);
        expect(ontology.endIds.size).toBe(56);
        expect(ontology.endIds.has('A1.A')).toBe(true);
    });
});
