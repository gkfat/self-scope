<template>
    <v-autocomplete
        v-model="model"
        :items="items"
        item-title="name"
        item-value="code"
        label="出生地點（選填）"
        hint="從清單選擇城市；未填出生時間與地點則無法計算人類圖"
        persistent-hint
        clearable
    />
</template>

<script lang="ts" setup>
import { CITIES } from '../../../shared/constants/cities';

const model = defineModel<string | null>({ default: null });

const items = CITIES.map((city) => ({
    code: city.code,
    name: city.name,
}));
</script>
