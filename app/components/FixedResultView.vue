<template>
    <div>
        <!-- Overview: the headline, then what to build on and what to watch -->
        <v-card
            variant="outlined"
            class="mb-4"
        >
            <v-card-title>概覽</v-card-title>
            <v-card-text>
                <blockquote class="quote">
                    <p class="quote__headline">
                        {{ result.title }}
                    </p>
                    <p class="quote__summary">
                        {{ result.summary }}
                    </p>
                </blockquote>

                <section
                    v-if="strengthCards.length"
                    class="mb-6"
                >
                    <div class="text-subtitle-1 font-weight-medium mb-2">
                        <v-icon
                            color="success"
                            size="20"
                        >
                            mdi-thumb-up-outline
                        </v-icon>
                        可能的優勢
                    </div>
                    <v-row dense>
                        <v-col
                            v-for="card in strengthCards"
                            :key="card.name"
                            cols="12"
                            sm="6"
                            md="4"
                        >
                            <v-card
                                variant="outlined"
                                height="100%"
                            >
                                <v-card-text>
                                    <div class="text-subtitle-1 font-weight-medium">
                                        {{ card.name }}
                                    </div>
                                    <p
                                        v-if="card.overused"
                                        class="text-body-2 mt-2 mb-0"
                                    >
                                        <span class="text-medium-emphasis">用得太過時：</span>{{ card.overused }}
                                    </p>
                                </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>
                </section>

                <section v-if="result.blindSpots.length">
                    <div class="text-subtitle-1 font-weight-medium mb-2">
                        <v-icon
                            color="warning"
                            size="20"
                        >
                            mdi-eye-outline
                        </v-icon>
                        可以留意的地方
                    </div>
                    <v-row dense>
                        <v-col
                            v-for="item in result.blindSpots"
                            :key="item"
                            cols="12"
                            sm="6"
                            md="4"
                        >
                            <v-card
                                variant="outlined"
                                height="100%"
                            >
                                <v-card-text class="text-subtitle-1">
                                    {{ item }}
                                </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>
                </section>
            </v-card-text>
        </v-card>

        <!-- Why, and how it shows: the sections speak for themselves -->
        <v-card
            v-if="hasDeeper"
            variant="outlined"
            class="mb-4"
        >
            <v-card-text>
                <section
                    v-if="result.coreNeeds"
                    class="mb-6"
                >
                    <h3 class="text-subtitle-1 font-weight-medium mb-2">
                        深層動機與核心需求
                    </h3>
                    <p class="text-body-2 text-medium-emphasis mb-2">
                        不只是「你是什麼樣的人」，而是行為背後可能的需求。
                    </p>
                    <v-row dense>
                        <v-col
                            v-for="row in coreNeedRows"
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
                </section>

                <section
                    v-if="result.situations"
                    class="mb-6"
                >
                    <h3 class="text-subtitle-1 font-weight-medium mb-2">
                        日常情境中的行為模式
                    </h3>
                    <v-row dense>
                        <v-col
                            v-for="row in situationRows"
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
                </section>

                <section
                    v-for="block in lifeAreas"
                    :key="block.title"
                    class="life-area"
                >
                    <h3 class="text-subtitle-1 font-weight-medium mb-2">
                        {{ block.title }}
                    </h3>
                    <ul class="pl-5">
                        <li
                            v-for="point in block.points"
                            :key="point"
                            class="mb-1"
                        >
                            {{ point }}
                        </li>
                    </ul>
                </section>
            </v-card-text>
        </v-card>

        <!-- Something to do with it -->
        <v-card
            v-if="hasGrowth"
            variant="outlined"
            class="mb-4"
        >
            <v-card-title>給你的建議</v-card-title>
            <v-card-text>
                <blockquote
                    v-if="result.growthAdvice"
                    class="quote"
                    :class="{ 'mb-4': result.growthPractice }"
                >
                    <p class="quote__text">
                        {{ result.growthAdvice }}
                    </p>
                </blockquote>
                <v-row
                    v-if="result.growthPractice"
                    dense
                >
                    <v-col
                        v-for="row in practiceRows"
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
                                    <v-icon
                                        v-if="row.icon"
                                        size="18"
                                        class="mr-1"
                                    >
                                        {{ row.icon }}
                                    </v-icon>
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

        <p
            v-if="showDisclaimer"
            class="text-caption text-medium-emphasis mb-4"
        >
            {{ result.disclaimer }}
        </p>
    </div>
</template>

<script lang="ts" setup>
import type { FixedResultResponse } from '../../shared/schemas/api/fixedResult.schema';

const props = withDefaults(defineProps<{
    result: FixedResultResponse;
    /** A page that lists more below can show the disclaimer once, at its very end, instead */
    showDisclaimer?: boolean;
}>(), { showDisclaimer: true });

const coreNeedRows = computed(() => {
    const needs = props.result.coreNeeds;

    return needs
        ? [
            {
                label: '核心追求', text: needs.pursuit,
            },
            {
                label: '安全感來源', text: needs.securitySource,
            },
            {
                label: '深層顧慮', text: needs.deepWorry,
            },
            {
                label: '內在矛盾', text: needs.innerConflict,
            },
        ]
        : [];
});

const situationRows = computed(() => {
    const situations = props.result.situations;

    return situations
        ? [
            {
                label: '面對壓力', text: situations.underStress,
            },
            {
                label: '面對衝突', text: situations.inConflict,
            },
            {
                label: '面對不確定性', text: situations.inUncertainty,
            },
            {
                label: '面對新環境', text: situations.inNewEnvironment,
            },
        ]
        : [];
});

const practiceRows = computed(() => {
    const practice = props.result.growthPractice;

    return practice
        ? [
            {
                label: '一個值得觀察的習慣', text: practice.habitToObserve, icon: 'mdi-eye-outline',
            },
            {
                label: '一個可以嘗試改變的行為', text: practice.behaviorToTry, icon: 'mdi-swap-horizontal',
            },
            {
                label: '一個自我反思問題', text: practice.reflectionQuestion, icon: 'mdi-help-circle-outline',
            },
            {
                label: '本週就能完成的小練習', text: practice.weeklyPractice, icon: 'mdi-calendar-check-outline',
            },
        ]
        : [];
});

const nonEmpty = (items: string[]): string[] => items.map((item) => item.trim()).filter((item) => item !== '');

/**
 * The three life areas, each as bullets. Content written before the bullet fields existed still shows: its
 * single sentences become one bullet each.
 */
const lifeAreas = computed(() => [
    {
        title: '人際關係與溝通',
        points: props.result.relationshipPoints.length
            ? props.result.relationshipPoints
            : nonEmpty([...props.result.relationshipBlindSpots, props.result.communicationStyle]),
    },
    {
        title: '感情',
        points: props.result.lovePoints.length ? props.result.lovePoints : nonEmpty([props.result.loveStyle]),
    },
    {
        title: '工作',
        points: props.result.workPoints.length ? props.result.workPoints : nonEmpty([props.result.workStyle]),
    },
].filter((block) => block.points.length > 0));

const hasDeeper = computed(() => Boolean(
    props.result.coreNeeds
    || props.result.situations
    || lifeAreas.value.length,
));

/**
 * One card per strength. What can go wrong when the strength is overused sits on the same card, matched by
 * name; an over-use pair whose strength is not in the list still gets a card of its own.
 */
const strengthCards = computed(() => {
    const overusedBy = new Map(props.result.overuse.map((item) => [item.strength.trim(), item.whenOverused]));
    const listed = props.result.strengths.map((name) => ({
        name, overused: overusedBy.get(name.trim()) ?? null,
    }));
    const covered = new Set(listed.filter((card) => card.overused).map((card) => card.name.trim()));
    const extra = props.result.overuse
        .filter((item) => !covered.has(item.strength.trim()) && !listed.some((card) => card.name.trim() === item.strength.trim()))
        .map((item) => ({
            name: item.strength, overused: item.whenOverused,
        }));

    return [...listed, ...extra];
});

const hasGrowth = computed(() => Boolean(props.result.growthAdvice.trim() || props.result.growthPractice));
</script>

<style scoped>
/* The headline of the analysis: set apart as a quotation, with an accent edge. */
.quote {
    margin: 0 0 20px;
    padding: 16px 20px;
    border-left: 4px solid rgb(var(--v-theme-primary));
    border-radius: 0 8px 8px 0;
    background: rgba(var(--v-theme-primary), 0.06);
}

.quote__headline {
    margin: 0 0 8px;
    font-size: clamp(1.25rem, 3.4vw, 1.625rem);
    font-weight: 700;
    line-height: 1.4;
}

/* Each life area: its title on its own line, the bullets across the full width */
.life-area + .life-area {
    margin-top: 20px;
}

/* A single quoted sentence (the advice) */
.quote__text {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 500;
    line-height: 1.8;
}

.quote__summary {
    margin: 0;
    font-size: 1rem;
    line-height: 1.8;
    color: rgba(0, 0, 0, 0.75);
}
</style>
