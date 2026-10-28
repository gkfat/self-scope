import type {
    MappingEntry, MappingSystem,
} from '../schema';

/** Builds the entries of one term of a system that is mapped by what its terms are known to stand for. */
export const keywordRule = (system: MappingSystem) => (term: string, ...axisEnds: string[]): MappingEntry[] => axisEnds.map((axisEnd) => ({
    system,
    term,
    axisEnd,
    method: 'keyword',
    kind: 'trait',
}));
