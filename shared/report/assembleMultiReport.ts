import { TRAIT_AXES } from '../ontology/axes';
import {
    FRAGMENT_TABLE, FRAGMENT_VERSION, type FragmentTable,
} from '../ontology/fragments';
import {
    INSIGHT_RULES, INSIGHT_RULES_VERSION,
} from '../ontology/insightRules';
import { evaluateInsightRules } from '../ontology/insightRules/evaluate';
import {
    INSIGHT_TYPE_LABELS, type InsightRule,
} from '../ontology/insightRules/schema';
import {
    isStateSystem, MAPPING_VERSION, SOURCE_GROUPS,
} from '../ontology/mapping';
import { STABLE_MAPPINGS } from '../ontology/mappings';
import { ONTOLOGY_VERSION } from '../ontology/ontology';
import type {
    MappingEntry, MappingSystem,
} from '../ontology/schema';
import type { ReportSnapshotContent } from '../schemas/firestore/reportSnapshot.schema';
import {
    MAX_REFLECTION_QUESTIONS, block, impactBlock, segment,
} from './assembleSingleReport';
import { selectFacets } from './facets';
import { SYSTEM_NATURE } from './natureLabels';
import type { SystemReportInput } from './types';

/** Raise whenever the way a multi-dimension report is put together changes (the order of blocks, the wording of fixed lines). */
export const MULTI_REPORT_TEMPLATE_VERSION = 'multi-report-v2';

/** The most facets a multi-dimension report goes into: more systems have more to say than one does. */
export const MAX_MULTI_FACETS = 8;

/** The facts of each system the report picks out: the ones that tie to the trait mapping come first. */
const HIGHLIGHTS_PER_SYSTEM = 6;

type AssembleMultiOptions = {
    fragments?: FragmentTable;
    mappings?: readonly MappingEntry[];
    rules?: readonly InsightRule[];
};

const axisName = (axisId: string) => {
    const axis = TRAIT_AXES.find((item) => item.id === axisId);

    return axis ? `${axis.a.name} ↔ ${axis.b.name}` : axisId;
};

const nameOfSystem = (system: MappingSystem) => SYSTEM_NATURE[system].tradition;
const unique = <T>(items: readonly T[]) => [...new Set(items)];

/**
 * A multi-dimension report from the single-dimension inputs of at least two lasting systems (and, if there are any,
 * today's states, which are only held up against them). Facts come first; the axis map says which end each tradition
 * points at and whether the sources are independent; the insights are what the insight rules found, shown in their
 * rule wording, which the AI later rewrites for the member beside the report. Pure: the same inputs give the same report.
 */
export function assembleMultiReport(
    inputs: readonly SystemReportInput[],
    today: readonly SystemReportInput[] = [],
    options: AssembleMultiOptions = {},
): ReportSnapshotContent {
    const fragments = options.fragments ?? FRAGMENT_TABLE;
    const mappings = options.mappings ?? STABLE_MAPPINGS;
    const rules = options.rules ?? INSIGHT_RULES;
    const lasting = inputs.filter((input) => !isStateSystem(input.system));
    const systems = unique(lasting.map((input) => input.system));

    if (systems.length < 2) throw new RangeError('A multi-dimension report combines at least two lasting systems');

    const names = systems.map(nameOfSystem);
    const systemsSource = systems.map((system) => ({ system }));

    const title = block('title', '這份報告用到的系統', [segment(`這份報告把 ${names.join('、')} 放在一起看。`, 'FACT', systemsSource), ...systems.map((system) => segment(`${nameOfSystem(system)}：${SYSTEM_NATURE[system].label}。`, 'FACT', [{ system }]))]);

    const coordinates = block('coordinates', '座標', lasting.map((input) => segment(`${nameOfSystem(input.system)}：${input.position}`, 'FACT', [{ system: input.system }])));

    const highlightSegments = lasting.flatMap((input) => {
        const ordered = [...input.facts.filter((fact) => fact.term), ...input.facts.filter((fact) => !fact.term)].slice(0, HIGHLIGHTS_PER_SYSTEM);

        return [
            ...ordered.map((fact) => segment(`${nameOfSystem(input.system)}｜${fact.label}：${fact.value}`, 'FACT', [
                fact.term ? {
                    system: input.system, term: fact.term,
                } : { system: input.system },
            ])), ...(input.timeFacts ?? []).map((fact) => segment(`${nameOfSystem(input.system)}｜${fact.text}`, fact.reading ? 'SYSTEM_INTERPRETATION' : 'FACT', [{ system: input.system }], {
                timeSensitive: true, asOf: fact.asOf,
            })),
        ];
    });
    const highlights = block('highlights', '各系統的重點事實', highlightSegments);

    // The terms of the member that are a fact on the page, with the system each belongs to
    const groundedTerms = new Set(lasting.flatMap((input) => input.facts.flatMap((fact) => (fact.term ? [fact.term] : []))));
    const memberTerms = unique(lasting.flatMap((input) => input.traits.filter((term) => groundedTerms.has(term))));
    const systemOfTerm = new Map(mappings.map((entry) => [entry.term, entry.system] as const));

    // The axis map: for each axis that two or more sources speak to, which end each tradition points at
    const sourcesByEnd = new Map<string, Array<{ system: MappingSystem; term: string }>>();

    for (const entry of mappings) {
        if (entry.kind !== 'trait' || !memberTerms.includes(entry.term)) continue;

        const list = sourcesByEnd.get(entry.axisEnd) ?? [];

        list.push({
            system: entry.system, term: entry.term,
        });
        sourcesByEnd.set(entry.axisEnd, list);
    }

    const axisSegments = TRAIT_AXES.flatMap((axis) => {
        const ends = (['A', 'B'] as const).flatMap((side) => {
            const sources = sourcesByEnd.get(`${axis.id}.${side}`) ?? [];

            return sources.length > 0 ? [
                {
                    id: `${axis.id}.${side}`, name: axis[side === 'A' ? 'a' : 'b'].name, sources,
                },
            ] : [];
        });
        const sourceCount = ends.reduce((total, end) => total + end.sources.length, 0);

        // Only an axis that two or more sources speak to is a map worth drawing
        if (sourceCount < 2) return [];

        const lines = ends.map((end) => {
            const groups = unique(end.sources.map((source) => SOURCE_GROUPS[source.system]));
            const independence = groups.length >= 2 ? '來源彼此獨立' : end.sources.length >= 2 ? '來源同屬一個傳統，只算同源' : '只有一個來源';

            return `偏向「${end.name}」：${unique(end.sources.map((source) => nameOfSystem(source.system))).join('、')}（${independence}）`;
        });
        const both = ends.length === 2 ? '。兩端都有來源，這會在洞見裡一併討論。' : '。';

        return [
            segment(`${axisName(axis.id)}：${lines.join('；')}${both}`, 'AI_INFERENCE', ends.flatMap((end) => [
                ...unique(end.sources.map((source) => source.system)).map((system) => ({
                    system, axisEnd: end.id,
                })),
            ])),
        ];
    });
    const axisMap = block('axis-map', '軸向地圖', axisSegments);

    const candidates = evaluateInsightRules(rules, memberTerms, mappings);
    const insightSegments = candidates.map((candidate) => {
        const label = candidate.withinSystem ? '系統內張力' : INSIGHT_TYPE_LABELS[candidate.type];
        const independence = candidate.independent ? '多個獨立來源' : '同源';

        return segment(
            `【${label}・${independence}】${candidate.template}`,
            'AI_INFERENCE',
            [
                { rule: candidate.ruleId }, ...candidate.sources.map((source) => ({
                    system: source.system, term: source.term, axisEnd: source.axisEnd,
                })),
            ],
            { confirmQuestion: candidate.hypothesis },
        );
    });
    const insights = block('insights', '洞見', insightSegments);

    // The impact map: the ends most of the facts point at, across all the systems, each with every system behind it
    const facets = selectFacets(memberTerms, groundedTerms, mappings, MAX_MULTI_FACETS);
    const impacts = facets.map((facet) => impactBlock(facet, unique(facet.supports.flatMap((term) => {
        const system = systemOfTerm.get(term);

        return system ? [system] : [];
    })), fragments));

    const now = block('now', '當下對照', today.filter((input) => isStateSystem(input.system)).map((input) => {
        const asOf = input.timeFacts?.[0]?.asOf;

        return segment(`${nameOfSystem(input.system)}：${input.position}`, 'FACT', [{ system: input.system }], asOf ? {
            timeSensitive: true, asOf,
        } : {});
    }));

    const questions = impacts.flatMap((impact) => impact.questions).slice(0, MAX_REFLECTION_QUESTIONS);
    const advice = block('advice', '建議與反思', [
        ...lasting.flatMap((input) => input.advice.map((text) => segment(`${nameOfSystem(input.system)}：${text}`, 'SYSTEM_INTERPRETATION', [{ system: input.system }]))), ...questions.map(({
            question, endId,
        }) => segment(`想一想：${question}`, 'AI_INFERENCE', [{ axisEnd: endId }])),
    ]);

    const limits = block('limits', '依據與限制', [
        ...(candidates.length > 0 || facets.length > 0
            ? [segment('洞見與影響面向推測是依各系統的事實與規則推得的傾向，不是任何一個系統的說法；過去的格子只是可能的猜測，請對照自己的經驗。', 'AI_INFERENCE', systemsSource)]
            : []),
        segment('軸向地圖只標出各傳統偏向哪一端，以及來源是否彼此獨立；同屬一個傳統的來源說相似的話，不算多次驗證。', 'FACT', systemsSource),
        ...lasting.flatMap((input) => (input.notes ?? []).map((note) => segment(`${nameOfSystem(input.system)}：${note}`, 'FACT', [{ system: input.system }]))),
        segment(`規則版本：本體 ${ONTOLOGY_VERSION}、映射 ${MAPPING_VERSION}、片段 ${FRAGMENT_VERSION}、洞見規則 ${INSIGHT_RULES_VERSION}、報告模板 ${MULTI_REPORT_TEMPLATE_VERSION}。`, 'FACT', systemsSource),
        ...unique(lasting.map((input) => input.disclaimer)).map((text) => segment(text, 'FACT', systemsSource)),
    ]);

    return {
        kind: 'MULTI',
        systems,
        position: lasting.map((input) => input.position).join('・'),
        blocks: [
            ...title,
            ...coordinates,
            ...highlights,
            ...axisMap,
            ...insights,
            ...impacts.flatMap((impact) => impact.block),
            ...now,
            ...advice,
            ...limits,
        ],
        versions: {
            ontology: ONTOLOGY_VERSION,
            mapping: MAPPING_VERSION,
            fragments: FRAGMENT_VERSION,
            templates: MULTI_REPORT_TEMPLATE_VERSION,
            insightRules: INSIGHT_RULES_VERSION,
        },
        basis: lasting.flatMap((input) => [...input.basis]),
    };
}
