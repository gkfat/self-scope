import { CONTEXT_VALUES } from './context';
import { TRAIT_AXES } from './axes';
import {
    CONTEXT_KINDS, TRAIT_GROUP_LETTERS, contextValueSchema, traitAxisSchema,
    type ContextKind, type ContextValue, type TraitAxis,
} from './schema';

/** Raise whenever an axis, an end or a context value changes in content; it is stored with every report (basis). */
export const ONTOLOGY_VERSION = 'ontology-v1';

export const EXPECTED_AXIS_COUNT = 28;

export const EXPECTED_CONTEXT_COUNTS: Readonly<Record<ContextKind, number>> = {
    time: 3,
    object: 10,
    domain: 10,
};

export type AxisSide = 'A' | 'B';

/** The id of one end of an axis, e.g. "A1.A" */
export const endId = (axisId: string, side: AxisSide): string => `${axisId}.${side}`;

const duplicates = (ids: readonly string[]): string[] => [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];

/**
 * Everything wrong with a list of axes, as plain sentences; empty when it is sound. Takes unknown values so a hand-written
 * data file can be checked as it is, not as the type system hopes it is.
 */
export function findTraitAxesIssues(axes: readonly unknown[], expectedCount: number = EXPECTED_AXIS_COUNT): string[] {
    const issues: string[] = [];
    const valid: TraitAxis[] = [];

    axes.forEach((axis, index) => {
        const parsed = traitAxisSchema.safeParse(axis);

        if (!parsed.success) {
            const id = (axis as { id?: unknown } | null)?.id;

            for (const issue of parsed.error.issues) {
                issues.push(`axis ${typeof id === 'string' ? id : `#${index}`}: ${issue.path.join('.')}: ${issue.message}`);
            }

            return;
        }

        valid.push(parsed.data);
    });

    for (const id of duplicates(valid.map((axis) => axis.id))) {
        issues.push(`axis id ${id} is used more than once`);
    }

    for (const axis of valid) {
        if (!axis.id.startsWith(TRAIT_GROUP_LETTERS[axis.group])) {
            issues.push(`axis ${axis.id} belongs to ${axis.group}, whose ids start with ${TRAIT_GROUP_LETTERS[axis.group]}`);
        }
    }

    // Neutral wording: an end's name must not say it is the better or the worse one
    for (const axis of valid) {
        for (const side of ['a', 'b'] as const) {
            const hit = [...'好壞優劣佳差'].find((char) => axis[side].name.includes(char));

            if (hit) {
                issues.push(`axis ${axis.id} end ${side.toUpperCase()}: the name "${axis[side].name}" ranks the end ("${hit}")`);
            }
        }
    }

    if (axes.length !== expectedCount) {
        issues.push(`expected ${expectedCount} axes, found ${axes.length}`);
    }

    return issues;
}

/** Everything wrong with a list of context values; empty when it is sound. */
export function findContextIssues(
    values: readonly unknown[],
    expectedCounts: Readonly<Record<ContextKind, number>> = EXPECTED_CONTEXT_COUNTS,
): string[] {
    const issues: string[] = [];
    const valid: ContextValue[] = [];

    values.forEach((value, index) => {
        const parsed = contextValueSchema.safeParse(value);

        if (!parsed.success) {
            const id = (value as { id?: unknown } | null)?.id;

            for (const issue of parsed.error.issues) {
                issues.push(`context value ${typeof id === 'string' ? id : `#${index}`}: ${issue.path.join('.')}: ${issue.message}`);
            }

            return;
        }

        valid.push(parsed.data);
    });

    for (const id of duplicates(valid.map((value) => value.id))) {
        issues.push(`context value id ${id} is used more than once`);
    }

    for (const value of valid) {
        if (!value.id.startsWith(`${value.kind}:`)) {
            issues.push(`context value ${value.id} is listed as ${value.kind}, whose ids start with "${value.kind}:"`);
        }

        // "Interpersonal relations" overlaps the object axis: who the other person is already says it
        if (value.kind === 'domain' && value.name === '人際關係') {
            issues.push(`context value ${value.id}: use "人際互動" for the domain, the object axis already covers the relationships`);
        }
    }

    for (const kind of CONTEXT_KINDS) {
        const count = valid.filter((value) => value.kind === kind).length;

        if (count !== expectedCounts[kind]) {
            issues.push(`expected ${expectedCounts[kind]} ${kind} values, found ${count}`);
        }
    }

    return issues;
}

export type Ontology = {
    version: string;
    axes: readonly TraitAxis[];
    context: readonly ContextValue[];
    /** Every end of every axis, e.g. "A1.A" */
    endIds: ReadonlySet<string>;
};

/** The validated ontology. Throws, listing every problem, when the data files are not sound. */
export function loadOntology(): Ontology {
    const issues = [...findTraitAxesIssues(TRAIT_AXES), ...findContextIssues(CONTEXT_VALUES)];

    if (issues.length > 0) {
        throw new Error(`The trait ontology is not sound:\n- ${issues.join('\n- ')}`);
    }

    return {
        version: ONTOLOGY_VERSION,
        axes: TRAIT_AXES,
        context: CONTEXT_VALUES,
        endIds: new Set(TRAIT_AXES.flatMap((axis) => [endId(axis.id, 'A'), endId(axis.id, 'B')])),
    };
}
