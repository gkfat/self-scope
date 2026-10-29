<template>
    <v-card
        v-if="advice.length"
        variant="outlined"
        class="mb-4"
    >
        <v-card-title>{{ title }}</v-card-title>
        <v-card-text>
            <!-- The advice, quoted, then the parts of the practice, as the pages of a reading show them -->
            <blockquote
                v-for="(item, index) in adviceLines"
                :key="`advice-${index}`"
                class="lead"
                :class="{ 'mb-4': practiceRows.length }"
            >
                <p class="lead__text">
                    {{ item }}
                </p>
            </blockquote>
            <!-- What to try today (a draw): one quote on a row of its own, ahead of the questions -->
            <section
                v-for="(item, index) in tryLines"
                :key="`try-${index}`"
                class="mb-4"
            >
                <div class="text-subtitle-1 font-weight-medium mb-2">
                    <v-icon
                        color="success"
                        size="20"
                    >
                        mdi-check-circle-outline
                    </v-icon>
                    {{ TRY_LABEL }}
                </div>
                <blockquote class="lead mb-0">
                    <p class="lead__text">
                        {{ item }}
                    </p>
                </blockquote>
            </section>
            <v-row
                v-if="practiceRows.length"
                dense
            >
                <v-col
                    v-for="(row, index) in practiceRows"
                    :key="`practice-${index}`"
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
                                    :icon="row.icon"
                                    size="18"
                                    class="mr-1"
                                />
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
</template>

<script lang="ts" setup>
const props = defineProps<{
    title: string;
    /** One line for each part: "一個值得觀察的習慣：…", "今天可以試試：…", "想一想：…", or the advice itself */
    advice: string[];
}>();

/** The parts of the practice, by the label the advice gives them, with the icon each has on the pages of a reading */
const PRACTICE_ICONS = new Map<string, string>([
    ['一個值得觀察的習慣', 'mdi-eye-outline'],
    ['一個可以嘗試改變的行為', 'mdi-swap-horizontal'],
    ['一個自我反思問題', 'mdi-help-circle-outline'],
    ['本週就能完成的小練習', 'mdi-calendar-check-outline'],
    ['想一想', 'mdi-help-circle-outline'],
]);

/** The advice of a draw that is about today, shown as a quote of its own */
const TRY_LABEL = '今天可以試試';

const adviceParts = computed(() => props.advice.map((line) => {
    const colon = line.indexOf('：');
    const label = colon < 0 ? '' : line.slice(0, colon);

    return PRACTICE_ICONS.has(label) || label === TRY_LABEL
        ? {
            label, icon: PRACTICE_ICONS.get(label) ?? '', text: line.slice(colon + 1),
        }
        : {
            label: '', icon: '', text: line,
        };
}));

/** The advice itself, what to try today, and the parts of the practice that go with it */
const adviceLines = computed(() => adviceParts.value.filter((part) => !part.label).map((part) => part.text));
const tryLines = computed(() => adviceParts.value.filter((part) => part.label === TRY_LABEL).map((part) => part.text));
const practiceRows = computed(() => adviceParts.value.filter((part) => part.label && part.label !== TRY_LABEL));
</script>

<style scoped>
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
