import { ACTION_DOMAIN_FRAGMENTS } from './domains/action';
import { EXTENDED_DOMAIN_FRAGMENTS } from './domains/extended';
import { EMOTION_DOMAIN_FRAGMENTS } from './domains/emotion';
import { RELATION_DOMAIN_FRAGMENTS } from './domains/relation';
import { THINKING_DOMAIN_FRAGMENTS } from './domains/thinking';
import { VALUE_DOMAIN_FRAGMENTS } from './domains/value';
import { ACTION_OBJECT_FRAGMENTS } from './objects/action';
import { EXTENDED_OBJECT_FRAGMENTS } from './objects/extended';
import { EMOTION_OBJECT_FRAGMENTS } from './objects/emotion';
import { RELATION_OBJECT_FRAGMENTS } from './objects/relation';
import { THINKING_OBJECT_FRAGMENTS } from './objects/thinking';
import { VALUE_OBJECT_FRAGMENTS } from './objects/value';
import {
    mergeFragmentTables, type CoverageTargets, type FragmentTable,
} from './fragments';

export * from './fragments';

/** Every written fragment: the sentences of the object axis (toward whom) and of the domain axis (in what part of life). */
export const FRAGMENT_TABLE: FragmentTable = mergeFragmentTables([
    THINKING_OBJECT_FRAGMENTS,
    ACTION_OBJECT_FRAGMENTS,
    EMOTION_OBJECT_FRAGMENTS,
    RELATION_OBJECT_FRAGMENTS,
    VALUE_OBJECT_FRAGMENTS,
    THINKING_DOMAIN_FRAGMENTS,
    ACTION_DOMAIN_FRAGMENTS,
    EMOTION_DOMAIN_FRAGMENTS,
    RELATION_DOMAIN_FRAGMENTS,
    VALUE_DOMAIN_FRAGMENTS,
    EXTENDED_OBJECT_FRAGMENTS,
    EXTENDED_DOMAIN_FRAGMENTS,
]);

/**
 * The groups of axes each phase has written so far. A group is added the day its sentences are in, and from then on
 * every one of its ends must reach the lower bound; the lists are complete when the content is.
 */
const ALL_GROUPS = [
    'THINKING',
    'ACTION',
    'EMOTION',
    'RELATION',
    'VALUE',
] as const;

export const COVERAGE_TARGETS: CoverageTargets = {
    object: ALL_GROUPS,
    domain: ALL_GROUPS,
};
