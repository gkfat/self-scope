import { TRAIT_AXES } from '../axes';
import { CONTEXT_VALUES } from '../context';
import { endId } from '../ontology';
import type {
    ContextKind, TraitEnd, TraitGroup,
} from '../schema';

/** Raise whenever a fragment, a time template or the list of words a fragment may not use changes (stored with a report). */
export const FRAGMENT_VERSION = 'fragments-v1';

/** One sentence about how a trait end shows in one context value. */
export type Fragment = {
    text: string;
    /** Required for the past: the question that lets the reader check the guess against their own life */
    confirmQuestion?: string;
};

/** A bare string is a fragment with no question. */
export type FragmentEntry = string | Fragment;

/** End id ("A1.A") -> context value id ("object:partner") -> the sentence. A pair that makes no sense is left out. */
export type FragmentTable = Readonly<Record<string, Readonly<Record<string, FragmentEntry>>>>;

/** Puts several tables into one: the sentences of an end that appear in more than one table are all kept. */
export function mergeFragmentTables(tables: readonly FragmentTable[]): FragmentTable {
    const merged: Record<string, Record<string, FragmentEntry>> = {};

    for (const table of tables) {
        for (const [id, byContext] of Object.entries(table)) {
            merged[id] = {
                ...merged[id], ...byContext,
            };
        }
    }

    return merged;
}

export const toFragment = (entry: FragmentEntry): Fragment => (typeof entry === 'string' ? { text: entry } : entry);

export const MIN_FRAGMENT_LENGTH = 8;
export const MAX_FRAGMENT_LENGTH = 60;

/** Words no fragment may use: medical, legal and financial advice is not what a trait sentence is for. */
export const FORBIDDEN_ADVICE_WORDS: readonly string[] = [
    '治療',
    '診斷',
    '藥',
    '疾病',
    '憂鬱症',
    '焦慮症',
    '失眠',
    '訴訟',
    '法律',
    '投資',
    '理財',
    '股票',
    '基金',
    '報酬',
    '貸款',
];

/** Words that state something as certain: never for the past or the future, which can only be guessed at. */
export const ASSERTION_WORDS: readonly string[] = [
    '一定會',
    '必定',
    '必然',
    '肯定會',
    '注定',
    '絕對會',
    '將會發生',
    '勢必',
];

/** A past sentence must be a guess ... */
export const PAST_HEDGES: readonly string[] = [
    '可能',
    '也許',
    '或許',
    '說不定',
];

/** ... and a future sentence must speak of a tendency or of something one can prepare. */
export const FUTURE_TENDENCY_WORDS: readonly string[] = [
    '可能',
    '傾向',
    '容易',
    '若',
    '如果',
    '可以',
    '不妨',
];

/** The trait end an end id names, or null. */
export function findTraitEnd(id: string): (TraitEnd & { id: string }) | null {
    for (const axis of TRAIT_AXES) {
        if (id === endId(axis.id, 'A')) return {
            ...axis.a, id,
        };

        if (id === endId(axis.id, 'B')) return {
            ...axis.b, id,
        };
    }

    return null;
}

/**
 * The sentence for a time value when no sentence of its own was written: built from the end's own name, description and
 * what overdoing it looks like, so it says nothing the (reviewed) end does not already say.
 */
export function timeTemplate(end: TraitEnd, timeId: string): Fragment | null {
    if (timeId === 'time:past') {
        return {
            text: `過去的你，可能就已經偏向「${end.name}」：${end.description}。`,
            confirmQuestion: `回頭看，你是否一向偏向「${end.name}」？`,
        };
    }

    if (timeId === 'time:present') {
        return { text: `日常裡，你傾向${end.description}。` };
    }

    if (timeId === 'time:future') {
        return { text: `若一直不調整，「${end.name}」過度時可能${end.overuse}；可以提早留意。` };
    }

    return null;
}

/**
 * The fragment of an end in a context value, or null. An exact sentence wins; a time value without one gets the
 * template sentence; anything else with no sentence is null, and nothing is borrowed from a neighbouring pair.
 */
export function lookupFragment(table: FragmentTable, id: string, contextId: string): Fragment | null {
    const entry = table[id]?.[contextId];

    if (entry !== undefined) return toFragment(entry);

    if (!contextId.startsWith('time:')) return null;

    const end = findTraitEnd(id);

    return end ? timeTemplate(end, contextId) : null;
}

type FragmentContext = {
    endIds: ReadonlySet<string>;
    /** Context value id -> its kind */
    contextKinds: ReadonlyMap<string, ContextKind>;
};

/** What a sentence may not say, as plain sentences; empty when it is fine. `kind` and `contextId` tell which rules apply. */
export function findTextIssues(fragment: Fragment, contextId: string, label: string): string[] {
    const issues: string[] = [];
    const { text } = fragment;

    if (text.trim().length < MIN_FRAGMENT_LENGTH) issues.push(`${label}: the text is empty or too short`);
    if (text.length > MAX_FRAGMENT_LENGTH) issues.push(`${label}: the text is ${text.length} characters, more than ${MAX_FRAGMENT_LENGTH}`);

    for (const word of FORBIDDEN_ADVICE_WORDS) {
        if (text.includes(word) || fragment.confirmQuestion?.includes(word)) issues.push(`${label}: "${word}" is medical, legal or financial wording`);
    }

    if (contextId === 'time:past') {
        if (!fragment.confirmQuestion?.trim()) issues.push(`${label}: a past sentence needs a confirmation question`);
        if (!PAST_HEDGES.some((word) => text.includes(word))) issues.push(`${label}: a past sentence has to be a guess (${PAST_HEDGES.join('、')})`);
    }

    if (contextId === 'time:future' && !FUTURE_TENDENCY_WORDS.some((word) => text.includes(word))) {
        issues.push(`${label}: a future sentence has to speak of a tendency or of something to prepare`);
    }

    if (contextId === 'time:past' || contextId === 'time:future') {
        for (const word of ASSERTION_WORDS) {
            if (text.includes(word)) issues.push(`${label}: "${word}" states the ${contextId === 'time:past' ? 'past' : 'future'} as certain`);
        }
    }

    return issues;
}

/** Everything wrong with a table of fragments; empty when it is sound. */
export function findFragmentIssues(table: FragmentTable, context: FragmentContext): string[] {
    const issues: string[] = [];

    for (const [id, byContext] of Object.entries(table)) {
        if (!context.endIds.has(id)) {
            issues.push(`fragment ${id}: not an end of any axis`);
            continue;
        }

        for (const [contextId, entry] of Object.entries(byContext)) {
            const label = `fragment ${id} / ${contextId}`;

            if (!context.contextKinds.has(contextId)) {
                issues.push(`${label}: not a context value`);
                continue;
            }

            issues.push(...findTextIssues(toFragment(entry), contextId, label));
        }
    }

    return issues;
}

/** Every sentence the time templates give, for every end: they have to follow the same rules as the written ones. */
export function findTimeTemplateIssues(): string[] {
    const issues: string[] = [];

    for (const axis of TRAIT_AXES) {
        for (const side of ['A', 'B'] as const) {
            const end = side === 'A' ? axis.a : axis.b;

            for (const timeId of [
                'time:past',
                'time:present',
                'time:future',
            ]) {
                const fragment = timeTemplate(end, timeId);

                issues.push(...(fragment ? findTextIssues(fragment, timeId, `template ${endId(axis.id, side)} / ${timeId}`) : [`template ${timeId}: none`]));
            }
        }
    }

    return issues;
}

export type FragmentCoverage = Readonly<Record<string, { object: number; domain: number }>>;

/** How many object and domain sentences each end has. */
export function computeFragmentCoverage(table: FragmentTable): FragmentCoverage {
    const kindOf = new Map(CONTEXT_VALUES.map((value) => [value.id, value.kind]));

    return Object.fromEntries(TRAIT_AXES.flatMap((axis) => (['A', 'B'] as const).map((side) => {
        const id = endId(axis.id, side);
        const kinds = Object.keys(table[id] ?? {}).map((contextId) => kindOf.get(contextId));

        return [
            id, {
                object: kinds.filter((kind) => kind === 'object').length,
                domain: kinds.filter((kind) => kind === 'domain').length,
            },
        ];
    })));
}

/** Fewest object and domain sentences an end must have, in the groups a phase has reached. */
export const MIN_OBJECT_FRAGMENTS_PER_END = 3;
export const MIN_DOMAIN_FRAGMENTS_PER_END = 3;

export type CoverageTargets = {
    /** Trait groups whose ends must have enough object sentences */
    object: readonly TraitGroup[];
    /** Trait groups whose ends must have enough domain sentences */
    domain: readonly TraitGroup[];
};

/** The ends short of the lower bound, for the groups the targets name. */
export function findFragmentCoverageIssues(coverage: FragmentCoverage, targets: CoverageTargets): string[] {
    const issues: string[] = [];

    for (const axis of TRAIT_AXES) {
        for (const side of ['A', 'B'] as const) {
            const id = endId(axis.id, side);
            const counts = coverage[id] ?? {
                object: 0, domain: 0,
            };

            if (targets.object.includes(axis.group) && counts.object < MIN_OBJECT_FRAGMENTS_PER_END) {
                issues.push(`end ${id} has ${counts.object} object sentences, at least ${MIN_OBJECT_FRAGMENTS_PER_END} are needed`);
            }

            if (targets.domain.includes(axis.group) && counts.domain < MIN_DOMAIN_FRAGMENTS_PER_END) {
                issues.push(`end ${id} has ${counts.domain} domain sentences, at least ${MIN_DOMAIN_FRAGMENTS_PER_END} are needed`);
            }
        }
    }

    return issues;
}
