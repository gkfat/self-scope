<template>
    <v-row dense>
        <v-col cols="4">
            <v-select
                v-model="year"
                :items="years"
                label="年"
                hide-details
            />
        </v-col>
        <v-col cols="4">
            <v-select
                v-model="month"
                :items="months"
                label="月"
                hide-details
            />
        </v-col>
        <v-col cols="4">
            <v-select
                v-model="day"
                :items="days"
                label="日"
                hide-details
            />
        </v-col>
    </v-row>
</template>

<script lang="ts" setup>
const MIN_YEAR = 1900;

/** YYYY-MM-DD, or an empty string until all three parts are chosen. */
const model = defineModel<string>({ default: '' });

const year = ref<number | null>(null);
const month = ref<number | null>(null);
const day = ref<number | null>(null);

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - MIN_YEAR + 1 }, (_, index) => currentYear - index);
const months = Array.from({ length: 12 }, (_, index) => index + 1);

const daysInMonth = computed(() => {
    if (!year.value || !month.value) return 31;

    return new Date(Date.UTC(year.value, month.value, 0)).getUTCDate();
});
const days = computed(() => Array.from({ length: daysInMonth.value }, (_, index) => index + 1));

const pad = (value: number): string => String(value).padStart(2, '0');

function readModel(value: string) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

    year.value = match ? Number(match[1]) : null;
    month.value = match ? Number(match[2]) : null;
    day.value = match ? Number(match[3]) : null;
}

readModel(model.value);

// A parent that fills the value later (e.g. from the saved profile) updates the three selects.
watch(model, (value) => {
    if (value !== composed()) readModel(value);
});

function composed(): string {
    if (!year.value || !month.value || !day.value) return '';

    return `${year.value}-${pad(month.value)}-${pad(day.value)}`;
}

watch([year, month, day], () => {
    // Switching to a shorter month (31 -> Feb) pulls the day back into range.
    if (day.value !== null && day.value > daysInMonth.value) day.value = daysInMonth.value;

    model.value = composed();
});
</script>
