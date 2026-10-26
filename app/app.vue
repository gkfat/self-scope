<template>
    <v-app>
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
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

<style>
/* A page with a full-width banner: its own stacking context keeps the banner's backdrop behind the content. */
.report-page {
    position: relative;
    isolation: isolate;
}

/* In-page links (the cards that point to the form) glide instead of jumping. */
@media (prefers-reduced-motion: no-preference) {
    html {
        scroll-behavior: smooth;
    }
}

/* Outlined cards use a soft grey edge everywhere, not the text color. */
.v-card--variant-outlined {
    border-color: rgba(0, 0, 0, 0.12);
    /* Opaque, so a backdrop behind the card (a banner) does not show through its header */
    background-color: rgb(var(--v-theme-surface));
}
</style>
