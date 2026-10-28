import type {
    MappingEntry, MappingSystem,
} from '../schema';

/**
 * Builds the entries of one term of a system that describes how today is, not a lasting trait. A state entry says which
 * axis end today leans toward (or, for a reversed card, which end is being overdone today); it is only ever held up
 * against the stable traits, never added to them.
 */
export const stateRule = (system: MappingSystem) => (term: string, ...axisEnds: string[]): MappingEntry[] => axisEnds.map((axisEnd) => ({
    system,
    term,
    axisEnd,
    method: 'keyword',
    kind: 'state',
}));
