<template>
    <div>
        <!-- Upright and reversed side by side: the current one is marked -->
        <v-card
            variant="outlined"
            class="mb-4"
        >
            <v-card-title class="section__title">
                <v-icon
                    icon="mdi-swap-horizontal"
                    class="mr-2"
                />
                正位與逆位對照
            </v-card-title>
            <v-card-text>
                <p class="text-body-2 text-medium-emphasis mb-3">
                    逆位不是正位的反義詞，也不等於壞結果，而是同一個主題的另一種樣貌。
                </p>
                <v-row dense>
                    <v-col
                        v-for="side in sides"
                        :key="side.orientation"
                        cols="12"
                        sm="6"
                    >
                        <v-card
                            variant="outlined"
                            height="100%"
                            :class="{ 'side--current': side.current }"
                        >
                            <v-card-text>
                                <div class="text-subtitle-2 mb-1">
                                    {{ side.label }}
                                    <v-chip
                                        v-if="side.current"
                                        size="x-small"
                                        color="primary"
                                        class="ml-1"
                                    >
                                        今天抽到
                                    </v-chip>
                                </div>
                                <p class="mb-0">
                                    {{ side.core }}
                                </p>
                            </v-card-text>
                        </v-card>
                    </v-col>
                    <v-col cols="12">
                        <v-card variant="outlined">
                            <v-card-text>
                                <div class="text-subtitle-2 mb-1">
                                    差異說明
                                </div>
                                <p class="mb-0">
                                    {{ meaning.contrast }}
                                </p>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>

        <v-card
            variant="outlined"
            class="mb-4"
        >
            <v-card-title class="section__title">
                <v-icon
                    icon="mdi-theme-light-dark"
                    class="mr-2"
                />
                光明面與陰影面
            </v-card-title>
            <v-card-text>
                <v-row dense>
                    <v-col
                        v-for="shade in shades"
                        :key="shade.label"
                        cols="12"
                        sm="6"
                    >
                        <v-card
                            variant="outlined"
                            height="100%"
                        >
                            <v-card-text>
                                <div class="text-subtitle-2 mb-1">
                                    <v-icon
                                        :icon="shade.icon"
                                        :color="shade.color"
                                        size="18"
                                        class="mr-1"
                                    />
                                    {{ shade.label }}
                                </div>
                                <p class="mb-0">
                                    {{ shade.text }}
                                </p>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>

        <v-card
            variant="outlined"
            class="mb-4"
        >
            <v-card-title class="section__title">
                <v-icon
                    icon="mdi-sprout-outline"
                    class="mr-2"
                />
                內在衝突與成長課題
            </v-card-title>
            <v-card-text>
                <v-row dense>
                    <v-col
                        v-for="row in growthRows"
                        :key="row.label"
                        cols="12"
                        sm="6"
                    >
                        <v-card
                            variant="outlined"
                            height="100%"
                        >
                            <v-card-text>
                                <div class="text-subtitle-2 mb-1">
                                    {{ row.label }}
                                </div>
                                <p class="mb-0">
                                    {{ row.text }}
                                </p>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>

        <v-card
            variant="outlined"
            class="mb-4"
        >
            <v-card-title class="section__title">
                <v-icon
                    icon="mdi-help-circle-outline"
                    class="mr-2"
                />
                給自己的反思問題
            </v-card-title>
            <v-card-text>
                <p class="text-body-2 text-medium-emphasis mb-3">
                    不需要馬上有答案，挑一個你有感覺的問題想一想就好。
                </p>
                <v-row dense>
                    <v-col
                        v-for="(question, index) in reading.reflections"
                        :key="question"
                        cols="12"
                        md="4"
                    >
                        <v-card
                            variant="outlined"
                            height="100%"
                        >
                            <v-card-text>
                                <div class="text-caption text-medium-emphasis mb-1">
                                    問題 {{ index + 1 }}
                                </div>
                                <p class="mb-0">
                                    {{ question }}
                                </p>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>

        <v-card
            variant="outlined"
            class="mb-4"
        >
            <v-card-title class="section__title">
                <v-icon
                    icon="mdi-palette-outline"
                    class="mr-2"
                />
                牌面象徵
            </v-card-title>
            <v-card-text>
                <v-row dense>
                    <v-col
                        v-for="row in symbolRows"
                        :key="row.label"
                        cols="12"
                        sm="6"
                    >
                        <v-card
                            variant="outlined"
                            height="100%"
                        >
                            <v-card-text>
                                <div class="text-subtitle-2 mb-1">
                                    {{ row.label }}
                                </div>
                                <p class="mb-0">
                                    {{ row.text }}
                                </p>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>

        <v-card variant="outlined">
            <v-card-title class="section__title">
                <v-icon
                    icon="mdi-book-open-page-variant-outline"
                    class="mr-2"
                />
                傳統牌義與現代詮釋
            </v-card-title>
            <v-card-text>
                <v-row dense>
                    <v-col
                        v-for="row in meaningRows"
                        :key="row.label"
                        cols="12"
                        sm="6"
                    >
                        <v-card
                            variant="outlined"
                            height="100%"
                        >
                            <v-card-text>
                                <div class="text-subtitle-2 mb-1">
                                    {{ row.label }}
                                </div>
                                <p class="mb-0">
                                    {{ row.text }}
                                </p>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>
    </div>
</template>

<script lang="ts" setup>
import type { TarotOrientation } from '../../../shared/constants/tarot';
import { TAROT_CARD_MEANINGS } from '../../../shared/constants/tarotMeanings';

const props = defineProps<{
    cardIndex: number;
    orientation: TarotOrientation;
}>();

const meaning = computed(() => {
    const found = TAROT_CARD_MEANINGS[props.cardIndex];

    if (!found) throw new RangeError(`Unknown tarot card index ${props.cardIndex}`);

    return found;
});

const reading = computed(() => meaning.value[props.orientation]);

const sides = computed(() => [
    {
        orientation: 'upright', label: '正位核心', core: meaning.value.uprightCore, current: props.orientation === 'upright',
    },
    {
        orientation: 'reversed', label: '逆位核心', core: meaning.value.reversedCore, current: props.orientation === 'reversed',
    },
]);

const shades = computed(() => [
    {
        label: '光明面：資源與優勢', text: meaning.value.light, icon: 'mdi-white-balance-sunny', color: 'warning',
    },
    {
        label: '陰影面：過度的傾向', text: meaning.value.shadow, icon: 'mdi-weather-night', color: 'primary',
    },
]);

const growthRows = computed(() => [
    {
        label: '內在衝突', text: reading.value.innerConflict,
    },
    {
        label: '成長課題', text: reading.value.growthTask,
    },
]);

const meaningRows = computed(() => [
    {
        label: '傳統牌義', text: meaning.value.traditional,
    },
    {
        label: '現代詮釋', text: meaning.value.modern,
    },
]);

const symbolRows = computed(() => [
    {
        label: '人物', text: meaning.value.symbols.figure,
    },
    {
        label: '顏色', text: meaning.value.symbols.colors,
    },
    {
        label: '道具', text: meaning.value.symbols.props,
    },
    {
        label: '構圖', text: meaning.value.symbols.composition,
    },
]);
</script>

<style scoped>
.section__title {
    font-size: 1rem;
    font-weight: 500;
}

.side--current {
    border-color: rgb(var(--v-theme-primary));
    background: rgba(var(--v-theme-primary), 0.05);
}
</style>
