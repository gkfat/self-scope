<template>
    <div class="d-flex justify-center mb-4">
        <v-btn
            :to="`/full-report/${slug}`"
            color="primary"
            variant="tonal"
            prepend-icon="mdi-text-box-search-outline"
        >
            看完整報告：事實、歸納與影響地圖
        </v-btn>
    </div>
</template>

<script lang="ts" setup>
defineProps<{
    /** The slug of the report page, e.g. zodiac or bazi */
    slug: string;
}>();
</script>
