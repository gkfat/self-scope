<template>
    <v-autocomplete
        v-model="model"
        :items="items"
        item-title="title"
        item-value="code"
        :label="label"
        :hint="hint"
        no-data-text="找不到符合的城市"
        persistent-hint
        clearable
    />
</template>

<script lang="ts" setup>
import {
    CITIES, cityLabel,
} from '../../../shared/constants/cities';

withDefaults(defineProps<{
    label?: string;
    hint?: string;
}>(), {
    label: '出生地點（選填）',
    hint: '輸入中文或英文即可搜尋；未填出生時間與地點則無法計算人類圖',
});

const model = defineModel<string | null>({ default: null });

// "巴黎 (Paris)": typing either language matches, because the search runs over the whole title.
const items = CITIES.map((city) => ({
    code: city.code,
    title: cityLabel(city),
}));
</script>
