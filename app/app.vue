<template>
    <v-app>
        <NuxtPage />
    </v-app>
</template>

<script lang="ts" setup>
useHead({
    titleTemplate: '%s | 人格探索',
    meta: [
        {
            property: 'og:type',
            content: 'website',
        },
        {
            property: 'og:locale',
            content: 'zh_TW',
        },
    ],
});
</script>
