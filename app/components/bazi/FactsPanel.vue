<template>
    <div class="facts">
        <dl class="facts__grid">
            <div
                v-for="item in items"
                :key="item.label"
                class="facts__item"
            >
                <dt>{{ item.label }}</dt>
                <dd>{{ item.value }}</dd>
            </div>
        </dl>

        <div
            v-if="result.bone"
            class="facts__bone"
        >
            <div class="text-subtitle-2">
                稱骨：{{ result.bone.label }}
            </div>
            <p class="text-body-2 text-medium-emphasis mb-0">
                農曆{{ ganzhiLabel(result.bone.lunarYear) }}年{{ result.bone.leapMonth ? '閏' : '' }}{{ monthName }}月{{ dayName }}，
                {{ hourName }}。稱骨用農曆生年（正月初一換年），和八字年柱以立春換年的依據不同。
                <template v-if="result.bone.leapMonth">
                    出生在閏月，依傳統做法歸入該月計算。
                </template>
            </p>
        </div>

        <div class="mt-3">
            <div class="text-subtitle-2 mb-1">
                合沖關係
            </div>
            <p
                v-if="relations.length === 0"
                class="text-body-2 text-medium-emphasis mb-0"
            >
                四柱之間沒有天干五合、地支六合或六沖。
            </p>
            <ul
                v-else
                class="facts__relations"
            >
                <li
                    v-for="relation in relations"
                    :key="relation.text"
                >
                    <v-chip
                        size="small"
                        variant="tonal"
                        class="mr-2"
                    >
                        {{ relation.kind }}
                    </v-chip>{{ relation.text }}
                </li>
            </ul>
            <p class="text-caption text-medium-emphasis mt-2 mb-0">
                這裡只列出哪兩個字相合或相沖，不代表好壞。
            </p>
        </div>
    </div>
</template>

<script lang="ts" setup>
import {
    BAZI_POLARITY_LABELS, BAZI_POSITION_LABELS, BAZI_RELATION_LABELS,
} from '../../../shared/constants/baziLabels';
import type { BaziResponse } from '../../../shared/schemas/api/bazi.schema';
import { ganzhiLabel } from '../../../shared/utils/bazi/ganzhi';

const props = defineProps<{
    result: BaziResponse;
}>();

const LUNAR_MONTHS = [
    '正',
    '二',
    '三',
    '四',
    '五',
    '六',
    '七',
    '八',
    '九',
    '十',
    '十一',
    '臘',
];
const DAY_TENS = [
    '初',
    '十',
    '廿',
    '三',
];
const DAY_DIGITS = [
    '十',
    '一',
    '二',
    '三',
    '四',
    '五',
    '六',
    '七',
    '八',
    '九',
];

const monthName = computed(() => LUNAR_MONTHS[(props.result.bone?.lunarMonth ?? 1) - 1]);

/** 初一 … 初十, 十一 … 二十 (shown as 十x / 二十), 廿一 … 廿九, 三十 */
const dayName = computed(() => {
    const day = props.result.bone?.lunarDay ?? 1;

    if (day === 10) return '初十';
    if (day === 20) return '二十';
    if (day === 30) return '三十';

    return `${DAY_TENS[Math.floor(day / 10)]}${DAY_DIGITS[day % 10]}`;
});

const hourName = computed(() => {
    const hour = props.result.pillars.hour;

    return hour ? `${hour.branch}時` : '';
});

const items = computed(() => {
    const { facts } = props.result;
    return [
        {
            label: '生肖', value: facts.zodiac,
        },
        {
            label: '年干陰陽', value: `${BAZI_POLARITY_LABELS[facts.yearPolarity]}年`,
        },
        {
            label: '出生時的節氣', value: `${facts.solarTerm}（${facts.season}）`,
        },
        {
            label: '胎元', value: ganzhiLabel(facts.taiYuan),
        },
        {
            label: '命宮', value: facts.mingGong ? ganzhiLabel(facts.mingGong) : '需要出生時間',
        },
    ];
});

const relations = computed(() => props.result.facts.relations.map((relation) => {
    const [a, b] = relation.positions;
    const where = `${BAZI_POSITION_LABELS[a]}與${BAZI_POSITION_LABELS[b]}`;
    const verb = relation.kind === 'BRANCH_CLASH' ? '相沖' : '相合';

    return {
        kind: BAZI_RELATION_LABELS[relation.kind],
        text: `${relation.pair.split('').join('、')}${verb}（${where}）`,
    };
}));
</script>

<style scoped>
.facts__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 8px;
    margin: 0;
}

.facts__item {
    padding: 8px 10px;
    border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
    border-radius: 10px;
}

.facts__item dt {
    font-size: 0.75rem;
    color: rgba(var(--v-theme-on-surface), 0.6);
}

.facts__item dd {
    margin: 0;
    font-weight: 600;
}

.facts__bone {
    margin-top: 12px;
    padding: 10px 12px;
    border-radius: 10px;
    background: rgba(var(--v-theme-primary), 0.06);
}

.facts__relations {
    margin: 0;
    padding: 0;
    list-style: none;
    line-height: 2;
}
</style>
