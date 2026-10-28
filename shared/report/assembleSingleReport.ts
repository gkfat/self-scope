import { CONTEXT_VALUES } from '../ontology/context';
import {
    FRAGMENT_TABLE, FRAGMENT_VERSION, lookupFragment, type FragmentTable,
} from '../ontology/fragments';
import {
    isStateSystem, MAPPING_VERSION, 
} from '../ontology/mapping';
import { STABLE_MAPPINGS } from '../ontology/mappings';
import { ONTOLOGY_VERSION } from '../ontology/ontology';
import type { MappingEntry } from '../ontology/schema';
import type {
    ReportSnapshotContent, SnapshotBlock, SnapshotSegment,
} from '../schemas/firestore/reportSnapshot.schema';
import {
    findTensions, selectFacets, type Facet,
} from './facets';
import { SYSTEM_NATURE } from './natureLabels';
import type { SystemReportInput } from './types';

/** Raise whenever the way a report is put together changes (the order of blocks, the wording of fixed lines). */
export const SINGLE_REPORT_TEMPLATE_VERSION = 'single-report-v1';

/** How many reflection questions the advice block takes from the guesses about the past. */
const MAX_REFLECTION_QUESTIONS = 3;

type AssembleOptions = {
    fragments?: FragmentTable;
    mappings?: readonly MappingEntry[];
};

const segment = (text: string, kind: SnapshotSegment['kind'], sources: SnapshotSegment['sources'], extra: Partial<SnapshotSegment> = {}): SnapshotSegment => ({
    text,
    kind,
    sources,
    timeSensitive: false,
    asOf: null,
    ...extra,
});

const block = (key: string, title: string, segments: SnapshotSegment[]): SnapshotBlock[] => (segments.length > 0
    ? [
        {
            key, title, segments,
        },
    ]
    : []);

/** The impact map of one facet: the time, object and domain values that have a sentence, in the order of the list. */
function impactBlock(facet: Facet, system: SystemReportInput['system'], fragments: FragmentTable): { block: SnapshotBlock[]; questions: Array<{ question: string; endId: string }> } {
    const questions: Array<{ question: string; endId: string }> = [];
    const segments = CONTEXT_VALUES.flatMap((context) => {
        const fragment = lookupFragment(fragments, facet.end.id, context.id);

        if (!fragment) return [];

        if (fragment.confirmQuestion) {
            questions.push({
                question: fragment.confirmQuestion, endId: facet.end.id,
            });
        }

        return [
            segment(
                fragment.text,
                'AI_INFERENCE',
                [
                    {
                        system, axisEnd: facet.end.id,
                    }, { fragment: `${facet.end.id}|${context.id}` },
                ],
                fragment.confirmQuestion ? { confirmQuestion: fragment.confirmQuestion } : {},
            ),
        ];
    });

    return {
        block: block(`impact:${facet.end.id}`, `影響地圖：${facet.end.name}`, segments), questions,
    };
}

/**
 * A single-dimension report, in the one order every report has: where the member stands, the system's own facts and
 * what its tradition says of them, what we conclude from those facts, the map of effects, advice, and the limits.
 * Facts come first and an inference is made only from a fact that is shown (a trait term with no fact on the page leads
 * nowhere). A state system (tarot, runes, the sign horoscope) stops after the facts and the advice: today's state is
 * not a lasting trait. Pure: the same input always gives the same report.
 */
export function assembleSingleReport(input: SystemReportInput, options: AssembleOptions = {}): ReportSnapshotContent {
    const fragments = options.fragments ?? FRAGMENT_TABLE;
    const mappings = options.mappings ?? STABLE_MAPPINGS;
    const nature = SYSTEM_NATURE[input.system];
    const systemSource = { system: input.system };
    const state = isStateSystem(input.system);

    const groundedTerms = new Set(input.facts.flatMap((fact) => (fact.term ? [fact.term] : [])));
    const facets = state ? [] : selectFacets(input.traits, groundedTerms, mappings);
    const factOfTerm = new Map(input.facts.flatMap((fact) => (fact.term ? [[fact.term, `${fact.label}${fact.value}`] as const] : [])));

    const position = block('position', '位置結論', [segment(input.position, 'FACT', [systemSource])]);

    const factsAndReadings = block('facts', '系統的事實與解讀', [
        ...input.facts.map((fact) => segment(`${fact.label}：${fact.value}`, 'FACT', [
            fact.term ? {
                system: input.system, term: fact.term,
            } : systemSource,
        ])), ...input.interpretations.map((reading) => segment(`【依${nature.tradition}】${reading.title}：${reading.text}`, 'SYSTEM_INTERPRETATION', [
            reading.term ? {
                system: input.system, term: reading.term,
            } : systemSource,
        ])),
    ]);

    const timeFacts = block('time', '依系統算出的時間', (input.timeFacts ?? []).map((fact) => segment(fact.text, 'FACT', [
        fact.term ? {
            system: input.system, term: fact.term,
        } : systemSource,
    ], {
        timeSensitive: true, asOf: fact.asOf,
    })));

    const summary = block('summary', '本系統的歸納', [
        ...facets.flatMap((facet) => {
            const sources = [
                ...facet.supports.map((term) => ({
                    system: input.system, term,
                })), { axisEnd: facet.end.id },
            ];
            const basisText = facet.supports.map((term) => factOfTerm.get(term)).filter(Boolean).join('、');

            return [segment(`傾向「${facet.end.name}」：${facet.end.description}。（依據：${basisText}）`, 'AI_INFERENCE', sources), segment(`用得太過時：${facet.end.overuse}。`, 'AI_INFERENCE', sources)];
        }), ...findTensions(facets).map(([first, second]) => segment(
            `「${first.end.name}」與「${second.end.name}」在這個系統裡同時出現：這是系統本身的兩種特徵，不是矛盾，也不用選一個；可以觀察在什麼情境下哪一邊比較明顯。`,
            'AI_INFERENCE',
            [{ axisEnd: first.end.id }, { axisEnd: second.end.id }],
        )),
    ]);

    const impacts = facets.map((facet) => impactBlock(facet, input.system, fragments));

    const questions = impacts.flatMap((impact) => impact.questions).slice(0, MAX_REFLECTION_QUESTIONS);
    const advice = block('advice', '建議與反思', [
        ...input.advice.map((text) => segment(text, 'SYSTEM_INTERPRETATION', [systemSource])), ...questions.map(({
            question, endId,
        }) => segment(`想一想：${question}`, 'AI_INFERENCE', [
            {
                system: input.system, axisEnd: endId,
            },
        ])),
    ]);

    const limits = block('limits', '依據與限制', [
        segment(`系統性質：${nature.label}。`, 'FACT', [systemSource]),
        ...(state || facets.length === 0
            ? []
            : [segment('影響地圖裡「過去、現在、未來」的格子，是依特質作的推測，不是該系統的說法；過去只是可能的猜測，請對照自己的經驗。', 'AI_INFERENCE', [systemSource])]),
        ...(input.notes ?? []).map((note) => segment(note, 'FACT', [systemSource])),
        segment(`規則版本：本體 ${ONTOLOGY_VERSION}、映射 ${MAPPING_VERSION}、片段 ${FRAGMENT_VERSION}、報告模板 ${SINGLE_REPORT_TEMPLATE_VERSION}。`, 'FACT', [systemSource]),
        segment(input.disclaimer, 'FACT', [systemSource]),
    ]);

    return {
        kind: 'SINGLE',
        systems: [input.system],
        position: input.position,
        blocks: [
            ...position,
            ...factsAndReadings,
            ...timeFacts,
            ...summary,
            ...impacts.flatMap((impact) => impact.block),
            ...advice,
            ...limits,
        ],
        versions: {
            ontology: ONTOLOGY_VERSION,
            mapping: MAPPING_VERSION,
            fragments: FRAGMENT_VERSION,
            templates: SINGLE_REPORT_TEMPLATE_VERSION,
        },
        basis: [...input.basis],
    };
}
