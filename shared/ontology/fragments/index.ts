import { ACTION_OBJECT_FRAGMENTS } from './objects/action';
import { EMOTION_OBJECT_FRAGMENTS } from './objects/emotion';
import { RELATION_OBJECT_FRAGMENTS } from './objects/relation';
import { THINKING_OBJECT_FRAGMENTS } from './objects/thinking';
import { VALUE_OBJECT_FRAGMENTS } from './objects/value';
import type {
    CoverageTargets, FragmentTable,
} from './fragments';

export * from './fragments';

/** Every written fragment: the sentences of the object axis (toward whom) and, later, of the domain axis (in what). */
export const FRAGMENT_TABLE: FragmentTable = {
    ...THINKING_OBJECT_FRAGMENTS,
    ...ACTION_OBJECT_FRAGMENTS,
    ...EMOTION_OBJECT_FRAGMENTS,
    ...RELATION_OBJECT_FRAGMENTS,
    ...VALUE_OBJECT_FRAGMENTS,
};

/**
 * The groups of axes each phase has written so far. A group is added the day its sentences are in, and from then on
 * every one of its ends must reach the lower bound; the lists are complete when the content is.
 */
export const COVERAGE_TARGETS: CoverageTargets = {
    object: [
        'THINKING',
        'ACTION',
        'EMOTION',
        'RELATION',
        'VALUE',
    ],
    domain: [],
};
