<template>
    <div class="pillars">
        <div
            class="pillars__grid"
            role="table"
            aria-label="四柱表"
        >
            <div
                class="pillars__head"
                role="row"
            >
                <span role="columnheader" />
                <span
                    v-for="column in columns"
                    :key="column.position"
                    class="pillars__title"
                    role="columnheader"
                >
                    {{ column.label }}
                    <v-icon
                        v-if="column.borderline"
                        icon="mdi-alert-circle-outline"
                        size="14"
                        color="warning"
                        :title="column.borderline"
                        aria-label="接近交界，不同算法可能得到不同結果"
                    />
                </span>
            </div>

            <div
                v-for="row in visibleRows"
                :key="row.key"
                class="pillars__row"
                role="row"
            >
                <span
                    class="pillars__label"
                    role="rowheader"
                >{{ row.label }}</span>
                <template
                    v-for="(cell, index) in row.cells"
                    :key="index"
                >
                    <span
                        v-if="cell"
                        class="pillars__cell"
                        :class="{ 'pillars__cell--master': row.key === 'stem' && index === DAY_INDEX }"
                        role="cell"
                    >
                        <span
                            v-for="(line, lineIndex) in cell"
                            :key="lineIndex"
                            class="pillars__line"
                            :class="{
                                'pillars__line--muted': line.muted,
                                'pillars__line--strong': line.strong,
                            }"
                        >
                            <span
                                v-if="line.element && line.tile"
                                class="pillars__tile"
                                :style="tileStyle(line.element)"
                            >{{ line.text }}</span>
                            <template v-else>{{ line.text }}</template>
                        </span>
                    </span>
                    <span
                        v-else
                        class="pillars__missing"
                        role="cell"
                    >{{ row.key === firstRowKey ? '需要出生時間' : '' }}</span>
                </template>
            </div>
        </div>

        <div class="d-flex align-center flex-wrap ga-2 mt-3">
            <v-btn
                v-if="xs"
                size="small"
                variant="text"
                :prepend-icon="showAll ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                @click="showAll = !showAll"
            >
                {{ showAll ? '收合藏干、地勢、空亡、納音' : '展開藏干、地勢、空亡、納音' }}
            </v-btn>
            <span class="text-caption text-medium-emphasis">
                顏色是五行：
                <template
                    v-for="element in ELEMENTS"
                    :key="element"
                >
                    <span
                        class="pillars__legend"
                        :style="tileStyle(element)"
                    >{{ ELEMENT_LABELS[element] }}</span>
                </template>
            </span>
        </div>

        <ul
            v-if="notices.length"
            class="pillars__notices"
        >
            <li
                v-for="notice in notices"
                :key="notice"
            >
                <v-icon
                    icon="mdi-alert-circle-outline"
                    size="16"
                    color="warning"
                />
                {{ notice }}
            </li>
        </ul>
    </div>
</template>

<script lang="ts" setup>
import {
    ELEMENTS,
    ELEMENT_COLORS,
    ELEMENT_LABELS,
    type Element,
} from '../../../shared/constants/bazi';
import { BAZI_POSITION_LABELS } from '../../../shared/constants/baziLabels';
import type { BaziResponse } from '../../../shared/schemas/api/bazi.schema';
import { useDisplay } from 'vuetify';

type Line = {
    text: string;
    element?: Element;
    /** Print the text as an element-coloured tile */
    tile?: boolean;
    muted?: boolean;
    strong?: boolean;
};

/** null where the pillar does not exist (no birth time) */
type Cell = Line[] | null;

type Row = {
    key: string;
    label: string;
    /** Rows that can fold away on a narrow screen */
    secondary: boolean;
    cells: Cell[];
};

const props = defineProps<{
    result: BaziResponse;
}>();

const POSITIONS = [
    'year',
    'month',
    'day',
    'hour',
] as const;
const DAY_INDEX = 2;

const { xs } = useDisplay();
const showAll = ref(!xs.value);

const tileStyle = (element: Element) => ({
    backgroundColor: ELEMENT_COLORS[element].fill,
    color: ELEMENT_COLORS[element].text,
    borderColor: ELEMENT_COLORS[element].border,
});

const columns = computed(() => POSITIONS.map((position) => {
    const notes = props.result.borderline.filter((note) => {
        if (note.kind === 'HOUR') return position === 'hour';

        return position === 'month' || (note.term === '立春' && position === 'year');
    });

    return {
        position,
        label: BAZI_POSITION_LABELS[position],
        borderline: notes.length ? '距離節氣或時辰界線很近，不同算法可能得到不同結果' : '',
    };
}));

function chartOf(position: (typeof POSITIONS)[number]) {
    return props.result.chart.find((item) => item.position === position) ?? null;
}

function factOf<T extends { position: string }>(list: T[], position: string): T | null {
    return list.find((item) => item.position === position) ?? null;
}

const rows = computed<Row[]>(() => {
    const { facts } = props.result;
    // eslint-disable-next-line no-unused-vars
    const build = (make: (position: (typeof POSITIONS)[number], chart: NonNullable<ReturnType<typeof chartOf>>) => Line[]): Cell[] => (
        POSITIONS.map((position) => {
            const chart = chartOf(position);

            return chart ? make(position, chart) : null;
        })
    );

    return [
        {
            key: 'tenGod',
            label: '十神',
            secondary: false,
            cells: build((_position, chart) => [{
                text: chart.stemTenGod ?? '日主', strong: chart.stemTenGod === null,
            }]),
        },
        {
            key: 'stem',
            label: '天干',
            secondary: false,
            cells: build((_position, chart) => [{
                text: chart.stem, element: chart.stemElement, tile: true,
            }]),
        },
        {
            key: 'branch',
            label: '地支',
            secondary: false,
            cells: build((_position, chart) => [{
                text: chart.branch, element: chart.branchElement, tile: true,
            }]),
        },
        {
            key: 'hidden',
            label: '藏干',
            secondary: true,
            cells: build((_position, chart) => chart.hiddenStems.map((hidden) => ({
                text: `${hidden.stem}${ELEMENT_LABELS[hidden.element]}・${hidden.tenGod}`,
                muted: hidden.role !== 'MAIN',
            }))),
        },
        {
            key: 'element',
            label: '五行',
            secondary: false,
            cells: build((_position, chart) => [{
                text: `${ELEMENT_LABELS[chart.stemElement]}・${ELEMENT_LABELS[chart.branchElement]}`,
            }]),
        },
        {
            key: 'stage',
            label: '地勢',
            secondary: true,
            cells: build((position) => [
                {
                    text: factOf(facts.stages, position)?.stage ?? '',
                },
                {
                    text: `自坐${factOf(facts.ownStages, position)?.stage ?? ''}`, muted: true,
                },
            ]),
        },
        {
            key: 'void',
            label: '空亡',
            secondary: true,
            cells: build((position) => {
                const voidBranches = factOf(facts.voids, position)?.branches.join('') ?? '';
                const hit = position !== 'day' && facts.dayVoid.positions.includes(position);

                return [{
                    text: voidBranches,
                }, ...(hit ? [{
                    text: '落日柱空亡', muted: true,
                }] : [])];
            }),
        },
        {
            key: 'nayin',
            label: '納音',
            secondary: true,
            cells: build((position) => [{ text: factOf(facts.nayin, position)?.name ?? '' }]),
        },
    ];
});

const visibleRows = computed(() => rows.value.filter((row) => !row.secondary || showAll.value));
const firstRowKey = computed(() => visibleRows.value[0]?.key);

/** Plain-language notes under the table: borderline moments, a 節 on an unknown-time date, the late 子 hour. */
const notices = computed(() => {
    const list: string[] = [];

    for (const note of props.result.borderline) {
        list.push(note.kind === 'JIE'
            ? `出生時間距離「${note.term}」只有約 ${note.minutes} 分鐘，這個時間接近交界，不同算法可能得到不同結果。`
            : `出生時間距離時辰的交界只有 ${note.minutes} 分鐘，這個時間接近交界，不同算法可能得到不同結果。`);
    }

    if (props.result.termDay) {
        list.push(props.result.termDay.changesYear
            ? `出生日是「${props.result.termDay.term}」當天，沒有出生時間時，年柱與月柱可能不同。`
            : `出生日是「${props.result.termDay.term}」當天，沒有出生時間時，當天換月，月柱可能不同。`);
    }

    if (props.result.lateZi) {
        list.push('出生在 23:00 到 24:00 的晚子時：日柱仍採當天，時柱的天干依隔天的日干推算。');
    }

    return list;
});
</script>

<style scoped>
.pillars__grid {
    display: grid;
    gap: 2px;
}

.pillars__head,
.pillars__row {
    display: grid;
    grid-template-columns: 3.2em repeat(4, minmax(0, 1fr));
    gap: 4px;
    align-items: stretch;
}

.pillars__title {
    padding: 4px 0;
    text-align: center;
    font-weight: 700;
    font-size: 0.9rem;
}

.pillars__label {
    display: flex;
    align-items: center;
    font-size: 0.75rem;
    color: rgba(var(--v-theme-on-surface), 0.6);
}

.pillars__row {
    padding: 4px 0;
    border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.pillars__cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-width: 0;
    padding: 2px;
    border: 2px solid transparent;
    border-radius: 10px;
    text-align: center;
    font-size: 0.8rem;
    overflow-wrap: anywhere;
}

/* The day stem is the day master: it gets a frame so it can be found at a glance */
.pillars__cell--master {
    border-color: rgb(var(--v-theme-primary));
    background: rgba(var(--v-theme-primary), 0.08);
}

.pillars__line--muted {
    color: rgba(var(--v-theme-on-surface), 0.6);
    font-size: 0.72rem;
}

.pillars__line--strong {
    font-weight: 700;
    color: rgb(var(--v-theme-primary));
}

.pillars__tile {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.2rem;
    height: 2.2rem;
    border: 1px solid;
    border-radius: 8px;
    font-size: 1.3rem;
    font-weight: 700;
}

.pillars__missing {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    border: 1px dashed rgba(var(--v-theme-on-surface), 0.3);
    border-radius: 10px;
    text-align: center;
    font-size: 0.8rem;
    color: rgba(var(--v-theme-on-surface), 0.6);
}

.pillars__legend {
    display: inline-block;
    min-width: 1.6em;
    margin: 0 2px;
    padding: 0 4px;
    border: 1px solid;
    border-radius: 4px;
    text-align: center;
    font-weight: 700;
}

.pillars__notices {
    margin: 12px 0 0;
    padding: 0;
    list-style: none;
    font-size: 0.85rem;
    line-height: 1.7;
}

@media (max-width: 599px) {
    .pillars__head,
    .pillars__row {
        grid-template-columns: 2.6em repeat(4, minmax(0, 1fr));
        gap: 2px;
    }

    .pillars__tile {
        width: 1.9rem;
        height: 1.9rem;
        font-size: 1.1rem;
    }

    .pillars__cell {
        font-size: 0.72rem;
    }
}
</style>
