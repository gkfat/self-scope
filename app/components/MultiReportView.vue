<template>
    <div>
        <v-card
            v-for="item in plainBlocks"
            :key="item.key"
            variant="outlined"
            class="mb-4"
        >
            <v-card-title>{{ item.title }}</v-card-title>
            <v-card-subtitle
                v-if="SUBTITLES[item.key]"
                class="text-wrap"
            >
                {{ SUBTITLES[item.key] }}
            </v-card-subtitle>
            <v-card-text>
                <div
                    v-for="(segment, index) in item.segments"
                    :key="`${item.key}-${index}`"
                    class="mb-3"
                >
                    <p :class="['text-body-2 mb-1', { 'text-medium-emphasis': item.key === 'limits' }]">
                        {{ segment.text }}
                        <span
                            v-if="segment.timeSensitive && segment.asOf"
                            class="text-caption text-medium-emphasis"
                        >（{{ segment.asOf }} 產生）</span>
                    </p>
                    <p
                        v-if="segment.confirmQuestion"
                        class="text-caption text-medium-emphasis mb-0"
                    >
                        對照看看：{{ segment.confirmQuestion }}
                    </p>
                </div>
            </v-card-text>
        </v-card>

        <!-- How each trait can show in different times, toward different people and in different parts of life: all of it -->
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
                    <div class="text-subtitle-1 font-weight-bold">
                        特質{{ NUMERALS[index] ?? index + 1 }}：{{ impact.trait }}
                    </div>
                    <p class="text-caption text-medium-emphasis mb-2">
                        支持的系統：{{ impact.systems.join('、') }}
                    </p>
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

        <v-card
            v-if="report.ai"
            variant="outlined"
            class="mb-4"
        >
            <v-card-title>AI 針對你改寫的解讀</v-card-title>
            <v-card-subtitle class="text-wrap">
                依上面規則找出的洞見改寫；每一段都對應到一條洞見，是 AI 的推測，不是任何一個系統的說法。
            </v-card-subtitle>
            <v-card-text>
                <div
                    v-for="item in report.ai.blocks"
                    :key="item.key"
                    class="mb-4"
                >
                    <div class="text-subtitle-1 font-weight-medium mb-1">
                        {{ item.title }}
                    </div>
                    <template
                        v-for="(segment, index) in item.segments"
                        :key="`${item.key}-${index}`"
                    >
                        <p :class="index % 2 === 0 ? 'text-body-2 mb-1' : 'text-caption text-medium-emphasis mb-3'">
                            {{ segment.text }}
                        </p>
                    </template>
                </div>
                <p class="text-caption text-medium-emphasis mb-0">
                    AI 綜合推論・{{ new Date(report.ai.generatedAt).toLocaleDateString('zh-TW') }} 產生。AI 的分析只是參考，不代表心理評估或專業建議。
                </p>
            </v-card-text>
        </v-card>
    </div>
</template>

<script lang="ts" setup>
import { CONTEXT_VALUES } from '../../shared/ontology/context';
import type { ReportSnapshotDetail } from '../../shared/schemas/api/reportSnapshot.schema';

const props = defineProps<{ report: ReportSnapshotDetail }>();

const SUBTITLES: Readonly<Record<string, string>> = {
    'coordinates': '各系統給你的位置結論，只放事實。',
    'highlights': '各系統自己算出的重點，保留各系統的原語彙；完整內容可到各系統的單維度報告看。',
    'axis-map': '各傳統偏向特質軸的哪一端，以及來源是否彼此獨立；同屬一個傳統的來源只算同源。不顯示任何強度或信心數字。',
    'insights': '由規則庫找出的跨系統洞見，附來源與可以對照自己的問題，是推測，不是定論。',
    'now': '今天的牌、符文或運勢，只拿來對照，不影響上面的判斷。',
};

const CONTEXT_NAMES = new Map(CONTEXT_VALUES.map((value) => [value.id, value.name]));
const GROUP_LABELS = {
    time: '時間', object: '對象', domain: '領域',
} as const;
const GROUP_ORDER = ['time', 'object', 'domain'] as const;

const plainBlocks = computed(() => props.report.blocks.filter((item) => !item.key.startsWith('impact:')));

/** One card per end: its cells sorted into time, object and domain, with the systems that point at the end. */
const impacts = computed(() => props.report.blocks.filter((item) => item.key.startsWith('impact:')).map((item) => {
    const cells = item.segments.flatMap((segment) => {
        const context = segment.sources.find((source) => source.fragment)?.fragment?.split('|')[1];

        return context ? [{
            context,
            kind: context.split(':')[0] ?? '',
            name: CONTEXT_NAMES.get(context) ?? context,
            text: segment.text,
            question: segment.confirmQuestion ?? '',
        }] : [];
    });
    const systems = [...new Set(item.segments.flatMap((segment) => segment.sources.flatMap((source) => (source.system ? [source.system] : []))))];

    return {
        key: item.key,
        trait: item.title.slice(item.title.indexOf('：') + 1),
        systems: systems.map((system) => SYSTEM_NAMES[system] ?? system),
        groups: GROUP_ORDER.map((kind) => ({
            kind, label: GROUP_LABELS[kind], cells: cells.filter((cell) => cell.kind === kind),
        })).filter((group) => group.cells.length > 0),
    };
}));

const SYSTEM_NAMES: Readonly<Record<string, string>> = {
    ZODIAC: '星座',
    BLOOD: '血型',
    MBTI: 'MBTI',
    NUMEROLOGY: '生命靈數',
    MAYA_KIN: '瑪雅 Kin',
    BAZI: '八字',
    HUMAN_DESIGN: '人類圖',
};

/** One, two, three… for the traits, in the order they come */
const NUMERALS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
</script>
