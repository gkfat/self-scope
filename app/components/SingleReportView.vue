<template>
    <div>
        <v-card
            v-if="overview.length"
            variant="outlined"
            class="mb-4"
        >
            <v-card-title>{{ blockTitle('overview') }}</v-card-title>
            <v-card-text>
                <!-- What the tradition says of the result as a whole: a quote on a row of its own -->
                <blockquote
                    v-if="overviewLead"
                    class="lead"
                >
                    <div class="text-subtitle-1 font-weight-medium mb-1">
                        {{ overviewLead.title }}
                    </div>
                    <p class="lead__text">
                        {{ splitLead(overviewLead.text).rest }}
                    </p>
                </blockquote>

                <!-- The traits the facts point at, ahead of the readings -->
                <SingleReportSummary
                    v-if="facetCards.length"
                    class="mb-4"
                    :facet-cards="facetCards"
                    :other-summary="[]"
                />

                <v-row dense>
                    <v-col
                        v-for="(reading, index) in overviewRest"
                        :key="`overview-${index}`"
                        cols="12"
                        md="6"
                    >
                        <v-card
                            variant="outlined"
                            height="100%"
                        >
                            <v-card-text>
                                <div class="text-subtitle-1 font-weight-bold mb-1">
                                    {{ reading.title }}
                                </div>
                                <p class="text-body-2 mb-0">
                                    {{ reading.text }}
                                </p>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>

        <!-- What the chart says, as a card of its own after the overview: the key words of each placement, then the houses and the aspects -->
        <v-card
            v-if="overview.length && (highlightBlocks.length || otherSummary.length || inferenceGroups.length)"
            variant="outlined"
            class="mb-4"
        >
            <v-card-title>星盤歸納</v-card-title>
            <v-card-text>
                <SingleReportHighlights
                    v-if="highlightBlocks.length"
                    :blocks="highlightBlocks"
                />

                <!-- What else the facts say together (the houses, the aspects) -->
                <div
                    v-if="otherSummary.length || inferenceGroups.length"
                    :class="highlightBlocks.length ? 'mt-2' : ''"
                >
                    <SingleReportSummary
                        :facet-cards="[]"
                        :other-summary="otherSummary"
                        :groups="inferenceGroups"
                    />
                </div>
            </v-card-text>
        </v-card>

        <v-card
            v-if="showFacts"
            variant="outlined"
            class="mb-4"
        >
            <v-card-title>{{ blockTitle('facts') }}</v-card-title>
            <v-card-text>
                <!-- The theme of the day, quoted, ahead of the facts of the draw -->
                <blockquote
                    v-if="leadText"
                    class="lead"
                >
                    <p class="lead__text">
                        {{ leadText }}
                    </p>
                </blockquote>

                <v-row dense>
                    <v-col
                        v-for="(fact, index) in factCards"
                        :key="`fact-${index}`"
                        cols="12"
                        sm="6"
                        md="4"
                    >
                        <v-card
                            variant="outlined"
                            height="100%"
                        >
                            <v-card-text>
                                <div class="text-caption text-medium-emphasis">
                                    {{ fact.label }}
                                </div>
                                <div class="text-body-1 font-weight-medium">
                                    {{ fact.title }}
                                </div>
                                <div
                                    v-if="fact.subtitle"
                                    class="text-body-2 text-medium-emphasis"
                                >
                                    {{ fact.subtitle }}
                                </div>
                                <p
                                    v-if="fact.reading"
                                    class="text-body-2 text-medium-emphasis mt-2 mb-0"
                                >
                                    {{ fact.reading }}
                                </p>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>

                <div
                    v-if="readings.length"
                    class="mt-6"
                >
                    <v-row dense>
                        <v-col
                            v-for="(reading, index) in readings"
                            :key="`reading-${index}`"
                            cols="12"
                            md="6"
                        >
                            <v-card
                                variant="outlined"
                                height="100%"
                            >
                                <v-card-text>
                                    <div class="text-subtitle-1 font-weight-bold mb-1">
                                        {{ reading.title }}
                                    </div>
                                    <p class="text-body-2 mb-0">
                                        {{ reading.text }}
                                    </p>
                                </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>
                </div>

                <ReportReadingGroups :groups="readingGroups" />
            </v-card-text>
        </v-card>

        <NatalChartLocked v-if="natalLocked && !natalChart" />

        <NatalChartPanel
            v-if="natalChart"
            :chart="natalChart"
            :readings="readingsByFact"
        />

        <v-card
            v-if="timeCards.length"
            variant="outlined"
            class="mb-4"
        >
            <v-card-title>{{ blockTitle('time') }}</v-card-title>
            <v-card-text>
                <p
                    v-for="(item, index) in timeCards"
                    :key="`time-${index}`"
                    class="text-body-2"
                >
                    {{ item.text }}
                    <span class="text-caption text-medium-emphasis">（{{ item.asOf }} 產生）</span>
                </p>
            </v-card-text>
        </v-card>

        <v-card
            v-if="(summary.length || inferenceGroups.length) && !overview.length"
            variant="outlined"
            class="mb-4"
        >
            <v-card-title>{{ blockTitle('summary') }}</v-card-title>
            <v-card-text>
                <SingleReportSummary
                    :facet-cards="facetCards"
                    :other-summary="otherSummary"
                    :groups="inferenceGroups"
                />
            </v-card-text>
        </v-card>

        <!-- How each trait can show in different times, toward different people and in different parts of life: all of it, one trait after another -->
        <v-card
            v-if="impacts.length"
            variant="outlined"
            class="mb-4"
        >
            <v-card-title>影響面向推測</v-card-title>
            <v-card-text>
                <div
                    v-for="(impact, index) in impacts"
                    :key="impact.key"
                    :class="{ 'mt-6': index > 0 }"
                >
                    <div class="text-subtitle-1 font-weight-bold mb-2">
                        特質{{ NUMERALS[index] ?? index + 1 }}：{{ impact.trait }}
                    </div>
                    <div
                        v-for="group in impact.groups"
                        :key="group.kind"
                        class="mb-3"
                    >
                        <div class="text-subtitle-2 text-medium-emphasis mb-1">
                            {{ group.label }}
                        </div>
                        <v-row dense>
                            <v-col
                                v-for="cell in group.cells"
                                :key="cell.context"
                                cols="12"
                                sm="6"
                                md="4"
                            >
                                <v-card
                                    variant="outlined"
                                    height="100%"
                                >
                                    <v-card-text>
                                        <div class="text-caption text-medium-emphasis">
                                            {{ cell.name }}
                                        </div>
                                        <p class="text-body-2 mb-0">
                                            {{ cell.text }}
                                        </p>
                                        <p
                                            v-if="cell.question"
                                            class="text-caption text-medium-emphasis mt-2 mb-0"
                                        >
                                            {{ cell.question }}
                                        </p>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>
                    </div>
                </div>
            </v-card-text>
        </v-card>

        <ReportAdviceCard
            :title="blockTitle('advice')"
            :advice="advice.map((segment) => segment.text)"
        />
    </div>
</template>

<script lang="ts" setup>
import { CONTEXT_VALUES } from '../../shared/ontology/context';
import type { NatalChartResponse } from '../../shared/schemas/api/natalChart.schema';
import { NATAL_LABELS } from '../../shared/constants/natalLabels';
import { splitLead } from '../utils/overviewLead';
import type { SingleReportResponse } from '../../shared/schemas/api/singleReport.schema';

const props = defineProps<{
    report: SingleReportResponse;
    /** The birth chart, when there is one to draw: the houses and the aspects are then shown with it instead of as lines */
    natalChart?: NatalChartResponse | null;
    /** The chart cannot be drawn yet: it waits for a birth time and a city */
    natalLocked?: boolean;
}>();

const CONTEXT_NAMES = new Map(CONTEXT_VALUES.map((value) => [value.id, value.name]));
const GROUP_LABELS = {
    time: '時間', object: '對象', domain: '領域',
} as const;
const GROUP_ORDER = ['time', 'object', 'domain'] as const;

const segmentsOf = (key: string) => props.report.blocks.find((block) => block.key === key)?.segments ?? [];
const blockTitle = (key: string) => props.report.blocks.find((block) => block.key === key)?.title ?? '';

/** "太陽星座：天蠍座" -> a label and a value; text without a colon is all value. */
function splitLabel(text: string): { label: string; value: string } {
    const at = text.indexOf('：');

    return at < 0
        ? {
            label: '', value: text,
        }
        : {
            label: text.slice(0, at), value: text.slice(at + 1),
        };
}

/** The readings that belong to a fact, by the label of that fact: "太陽在天蠍座：…" is shown in the card of the sun sign */
const readingsByFact = computed(() => {
    const byFact: Record<string, string[]> = {};

    for (const segment of segmentsOf('facts')) {
        if (segment.kind !== 'SYSTEM_INTERPRETATION') continue;

        const text = splitLabel(/^【.+?】(.*)$/s.exec(segment.text)?.[1] ?? segment.text).value;

        for (const source of segment.sources) {
            if (source.fact) (byFact[source.fact] ??= []).push(text);
        }
    }

    return Object.fromEntries(Object.entries(byFact).map(([label, lines]) => [label, lines.join('\n')]));
});

/** What the chart panel shows (the houses and the aspects) is not listed again among the facts */
const PLACEMENT_LABELS = new Set(Object.values(NATAL_LABELS).map((item) => item.name));
const isChartFact = (label: string) => props.natalChart != null && (/^第 \d+ 宮/.test(label) || label.startsWith('相位・') || PLACEMENT_LABELS.has(label));

const factCards = computed(() => segmentsOf('facts').filter((segment) => segment.kind === 'FACT').filter((segment) => !isChartFact(splitLabel(segment.text).label)).map((segment) => {
    const { label, value } = splitLabel(segment.text);

    // A second line in the value is the subtitle (the English name of a card)
    const [title = '', ...subtitle] = value.split('\n');

    return {
        label, title, subtitle: subtitle.join(' '), reading: readingsByFact.value[label] ?? '',
    };
}));

/** A reading sentence "【依傳統占星】天蠍座：…" as the tradition, the title and the text */
const readingsOf = (key: string) => segmentsOf(key).filter((segment) => segment.kind === 'SYSTEM_INTERPRETATION' && !segment.sources.some((source) => source.fact)).map((segment) => {
    const match = /^【(.+?)】(.*)$/s.exec(segment.text);
    const { label, value } = splitLabel(match?.[2] ?? segment.text);

    return {
        tradition: match?.[1] ?? '', title: label, text: value,
    };
});

const readings = computed(() => readingsOf('facts'));

/** The quote at the head of the overview of a draw: the words after its title */
const leadText = computed(() => readingsOf('lead')[0]?.text ?? '');

/** The readings that come in groups, one block for each group */
const readingGroups = computed(() => props.report.blocks.filter((block) => block.key.startsWith('readings:')).map((block) => ({
    key: block.key, title: block.title, readings: readingsOf(block.key),
})));
const overview = computed(() => readingsOf('overview'));
const overviewLead = computed(() => overview.value[0] ?? null);
const overviewRest = computed(() => overview.value.slice(1));

/**
 * The facts are listed unless they add nothing to what is shown elsewhere: with an overview and the chart (or its
 * invitation) in place, the sun sign is the only fact left and its reading is in the sun's house.
 */
const showFacts = computed(() => !(overview.value.length > 0 && factCards.value.length <= 1 && readings.value.length === 0 && readingGroups.value.length === 0 && (props.natalChart != null || props.natalLocked === true)));

const timeCards = computed(() => segmentsOf('time').map((segment) => ({
    text: segment.text, asOf: segment.asOf ?? '',
})));
const summary = computed(() => segmentsOf('summary').map((segment) => segment.text));

/** A trait the facts point at is written as "傾向「專注深耕」：選定方向長期深入。（依據：…）", then "用得太過時：視野變窄。" */
const FACET_PATTERN = /^傾向「(.+?)」：(.*?)。?（依據：(.+)）$/s;
const OVERUSE_PATTERN = /^用得太過時：(.*?)。?$/s;

const parsedSummary = computed(() => {
    const facets: Array<{ name: string; description: string; basis: string; overuse: string }> = [];
    const others: string[] = [];

    for (const text of summary.value) {
        const facet = FACET_PATTERN.exec(text);
        const overuse = OVERUSE_PATTERN.exec(text);
        const last = facets.at(-1);

        if (facet) {
            facets.push({
                name: facet[1] ?? '', description: facet[2] ?? '', basis: facet[3] ?? '', overuse: '',
            });
        } else if (overuse && last && last.overuse === '') {
            last.overuse = overuse[1] ?? '';
        } else {
            others.push(text);
        }
    }

    return {
        facets, others,
    };
});

const facetCards = computed(() => parsedSummary.value.facets);
const otherSummary = computed(() => parsedSummary.value.others);

/** Conclusions drawn from the facts together that have a heading of their own (the houses, the aspects) */
const allGroups = computed(() => props.report.blocks.filter((block) => block.key.startsWith('inference:')).map((block) => ({
    key: block.key, title: block.title, items: block.segments.map((segment) => segment.text),
})));

/** The key words of each group of planets come first, right under the overview; the other conclusions follow the traits */
const isHighlight = (key: string) => key.startsWith('inference:planets-');
const highlightBlocks = computed(() => props.report.blocks.filter((block) => isHighlight(block.key)));
const inferenceGroups = computed(() => allGroups.value.filter((group) => !isHighlight(group.key)));
const advice = computed(() => segmentsOf('advice'));


/** One card per facet: its cells sorted into time, object and domain, in the order the list of values has them. */
const impacts = computed(() => props.report.blocks.filter((block) => block.key.startsWith('impact:')).map((block) => {
    const cells = block.segments.flatMap((segment) => {
        const context = segment.sources.find((source) => source.fragment)?.fragment?.split('|')[1];

        return context ? [{
            context,
            kind: context.split(':')[0] ?? '',
            name: CONTEXT_NAMES.get(context) ?? context,
            text: segment.text,
            question: segment.confirmQuestion ?? '',
        }] : [];
    });

    return {
        key: block.key,
        // "影響面向推測：專注深耕" (and "影響地圖：專注深耕" in a report kept before): the trait is what follows the colon
        trait: block.title.slice(block.title.indexOf('：') + 1),
        groups: GROUP_ORDER.map((kind) => ({
            kind, label: GROUP_LABELS[kind], cells: cells.filter((cell) => cell.kind === kind),
        })).filter((group) => group.cells.length > 0),
    };
}));

/** One, two, three… for the traits, in the order they come */
const NUMERALS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
</script>

<style scoped>
.lines {
    white-space: pre-line;
}

.lead {
    margin: 0 0 16px;
    padding: 16px 20px;
    border-left: 4px solid rgb(var(--v-theme-primary));
    border-radius: 0 8px 8px 0;
    background: rgba(var(--v-theme-primary), 0.06);
}

.lead__text {
    margin: 0;
    font-size: 1rem;
    line-height: 1.8;
}
</style>
