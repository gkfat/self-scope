<template>
    <div>
        <v-row dense>
            <v-col cols="4">
                <v-select
                    v-model="period"
                    clearable
                    :items="periods"
                    :label="label"
                    hide-details
                />
            </v-col>
            <v-col cols="4">
                <v-select
                    v-model="hour"
                    clearable
                    :items="hours"
                    label="時"
                    hide-details
                />
            </v-col>
            <v-col cols="4">
                <v-select
                    v-model="minute"
                    clearable
                    :items="minutes"
                    label="分"
                    hide-details
                />
            </v-col>
        </v-row>
        <div
            v-if="hint"
            class="text-caption text-medium-emphasis mt-1 px-2"
        >
            {{ hint }}
        </div>
    </div>
</template>

<script lang="ts" setup>
import {
    fromTimeOfDay, toTimeOfDay, type DayPeriod,
} from '../../../shared/utils/timeOfDay';

withDefaults(defineProps<{
    label?: string;
    hint?: string;
}>(), {
    label: '出生時間（上下午）',
    hint: '',
});

/** HH:mm (24h), or an empty string until all three parts are chosen. */
const model = defineModel<string>({ default: '' });

const period = ref<DayPeriod | null>(null);
const hour = ref<number | null>(null);
const minute = ref<number | null>(null);

const pad = (value: number): string => String(value).padStart(2, '0');

const periods = [
    {
        title: '上午', value: 'AM',
    },
    {
        title: '下午', value: 'PM',
    },
];
const hours = Array.from({ length: 12 }, (_, index) => ({
    title: pad(index + 1), value: index + 1,
}));
const minutes = Array.from({ length: 60 }, (_, index) => ({
    title: pad(index), value: index,
}));

function composed(): string {
    if (period.value === null || hour.value === null || minute.value === null) return '';

    return toTimeOfDay({
        period: period.value, hour: hour.value, minute: minute.value,
    });
}

function readModel(value: string) {
    const parts = fromTimeOfDay(value);

    period.value = parts?.period ?? null;
    hour.value = parts?.hour ?? null;
    minute.value = parts?.minute ?? null;
}

readModel(model.value);

// A parent that fills the value later (e.g. from the saved profile) updates the three selects.
watch(model, (value) => {
    if (value !== composed()) readModel(value);
});

watch([period, hour, minute], () => {
    model.value = composed();
});
</script>
