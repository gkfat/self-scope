import { TRAIT_AXES } from '../ontology/axes';
import { STABLE_MAPPINGS } from '../ontology/mappings';
import { findTraitEnd } from '../ontology/fragments';
import type {
    MappingEntry, TraitEnd,
} from '../ontology/schema';

/** The most facets one report goes into; the rest are left out, never mentioned as less likely. */
export const MAX_FACETS = 5;

/** A trait end the member's facts point at, and the facts that do. */
export type Facet = {
    end: TraitEnd & { id: string };
    /** The terms of the member that point at this end */
    supports: string[];
};

const AXIS_ORDER = new Map(TRAIT_AXES.flatMap((axis, index) => [[`${axis.id}.A`, index * 2], [`${axis.id}.B`, index * 2 + 1]] as const));

/**
 * The ends that most of the member's grounded facts point at. A term counts only when it is one of the `groundedTerms`
 * (a fact the report shows), so that no inference stands on something the member cannot see. There is no strength:
 * ends are ordered by how many different facts support them, then by their place in the list of axes, so the same
 * member always gets the same facets.
 */
export function selectFacets(
    traits: readonly string[],
    groundedTerms: ReadonlySet<string>,
    mappings: readonly MappingEntry[] = STABLE_MAPPINGS,
    max: number = MAX_FACETS,
): Facet[] {
    const supportsByEnd = new Map<string, Set<string>>();
    const memberTerms = new Set(traits.filter((term) => groundedTerms.has(term)));

    for (const entry of mappings) {
        if (!memberTerms.has(entry.term)) continue;

        supportsByEnd.set(entry.axisEnd, (supportsByEnd.get(entry.axisEnd) ?? new Set<string>()).add(entry.term));
    }

    return [...supportsByEnd.entries()]
        .sort(([endA, termsA], [endB, termsB]) => termsB.size - termsA.size || (AXIS_ORDER.get(endA) ?? 0) - (AXIS_ORDER.get(endB) ?? 0))
        .slice(0, max)
        .flatMap(([id, terms]) => {
            const end = findTraitEnd(id);

            return end ? [
                {
                    end, supports: [...terms],
                },
            ] : [];
        });
}

/** The pairs of facets that are the two ends of one axis: something the system itself says both of. */
export function findTensions(facets: readonly Facet[]): Array<[Facet, Facet]> {
    const pairs: Array<[Facet, Facet]> = [];

    for (const facet of facets) {
        if (!facet.end.id.endsWith('.A')) continue;

        const other = facets.find((candidate) => candidate.end.id === `${facet.end.id.slice(0, 2)}.B`);

        if (other) pairs.push([facet, other]);
    }

    return pairs;
}
