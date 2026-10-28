<template>
    <div>
        <v-card
            variant="outlined"
            class="mb-4"
        >
            <v-card-title>{{ blockTitle('facts') }}</v-card-title>
            <v-card-text>
                <v-row dense>
                    <v-col
                        v-for="(fact, index) in factCards"
                        :key="`fact-${index}`"
                        cols="12"
                        sm="6"
                        md="4"
                    >
                        <v-card
                            variant="tonal"
                            height="100%"
                        >
                            <v-card-text>
                                <div class="text-caption text-medium-emphasis">
                                    {{ fact.label }}
                                </div>
                                <div class="text-body-1 font-weight-medium">
                                    {{ fact.value }}
                                </div>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>

                <div
                    v-if="readings.length"
                    class="mt-6"
                >
                    <div class="text-subtitle-1 font-weight-medium mb-2">
                        傳統怎麼解讀
                    </div>
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
                                    <div class="text-caption text-medium-emphasis">
                                        {{ reading.tradition }}
                                    </div>
                                    <div class="text-subtitle-2 mb-1">
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
            </v-card-text>
        </v-card>

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
            v-if="summary.length"
            variant="outlined"
            class="mb-4"
        >
            <v-card-title>{{ blockTitle('summary') }}</v-card-title>
            <v-card-subtitle class="text-wrap">
                由上面的事實歸納出的幾個面向；每一項都附了依據，是我們的歸納，不是該系統的說法。
            </v-card-subtitle>
            <v-card-text>
                <v-row dense>
                    <v-col
                        v-for="(item, index) in summary"
                        :key="`summary-${index}`"
                        cols="12"
                        md="6"
                    >
                        <v-card
                            variant="tonal"
                            height="100%"
                        >
                            <v-card-text>
                                <p class="text-body-2 mb-0">
                                    {{ item }}
                                </p>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>

        <template v-if="impacts.length">
            <div class="text-h6 mb-1">
                影響地圖
            </div>
            <p class="text-body-2 text-medium-emphasis mb-3">
                這些傾向在不同的時間、對象與生活領域上可能怎麼表現。沒有寫到的格子不顯示。時間那一組是依特質作的推測，不是該系統的說法。
            </p>
            <v-card
                v-for="impact in impacts"
                :key="impact.key"
                variant="outlined"
                class="mb-4"
            >
                <v-card-title>{{ impact.title }}</v-card-title>
                <v-tabs
                    v-model="tabs[impact.key]"
                    density="compact"
                    color="primary"
                >
                    <v-tab
                        v-for="group in impact.groups"
                        :key="group.kind"
                        :value="group.kind"
                    >
                        {{ group.label }}（{{ group.cells.length }}）
                    </v-tab>
                </v-tabs>
                <v-card-text>
                    <v-window v-model="tabs[impact.key]">
                        <v-window-item
                            v-for="group in impact.groups"
                            :key="group.kind"
                            :value="group.kind"
                        >
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
                        </v-window-item>
                    </v-window>
                </v-card-text>
            </v-card>
        </template>

        <v-card
            v-if="advice.length"
            variant="outlined"
            class="mb-4"
        >
            <v-card-title>{{ blockTitle('advice') }}</v-card-title>
            <v-card-text>
                <p
                    v-for="(item, index) in advice"
                    :key="`advice-${index}`"
                    class="text-body-2"
                >
                    {{ item }}
                </p>
            </v-card-text>
        </v-card>

        <v-card
            v-if="limits.length"
            variant="outlined"
            class="mb-4"
        >
            <v-card-title>{{ blockTitle('limits') }}</v-card-title>
            <v-card-text>
                <p
                    v-for="(item, index) in limits"
                    :key="`limit-${index}`"
                    class="text-body-2 text-medium-emphasis"
                >
                    {{ item }}
                </p>
            </v-card-text>
        </v-card>
    </div>
</template>

<script lang="ts" setup>
import { CONTEXT_VALUES } from '../../shared/ontology/context';
import type { SingleReportResponse } from '../../shared/schemas/api/singleReport.schema';

const props = defineProps<{ report: SingleReportResponse }>();

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

const factCards = computed(() => segmentsOf('facts').filter((segment) => segment.kind === 'FACT').map((segment) => splitLabel(segment.text)));

const readings = computed(() => segmentsOf('facts').filter((segment) => segment.kind === 'SYSTEM_INTERPRETATION').map((segment) => {
    const match = /^【(.+?)】(.*)$/s.exec(segment.text);
    const { label, value } = splitLabel(match?.[2] ?? segment.text);

    return {
        tradition: match?.[1] ?? '', title: label, text: value,
    };
}));

const timeCards = computed(() => segmentsOf('time').map((segment) => ({
    text: segment.text, asOf: segment.asOf ?? '',
})));
const summary = computed(() => segmentsOf('summary').map((segment) => segment.text));
const advice = computed(() => segmentsOf('advice').map((segment) => segment.text));
const limits = computed(() => segmentsOf('limits').map((segment) => segment.text));

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
        title: block.title,
        groups: GROUP_ORDER.map((kind) => ({
            kind, label: GROUP_LABELS[kind], cells: cells.filter((cell) => cell.kind === kind),
        })).filter((group) => group.cells.length > 0),
    };
}));

/** Which tab each facet shows; the first group (time) to begin with. */
const tabs = reactive<Record<string, string>>({});

watch(impacts, (list) => {
    for (const impact of list) tabs[impact.key] ??= impact.groups[0]?.kind ?? 'time';
}, { immediate: true });
</script>
