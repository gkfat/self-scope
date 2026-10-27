<template>
    <div class="report-page">
        <ReportBanner
            title="今日運勢"
            tone="amber"
        />

        <!-- The way in: one card for each, side by side -->
        <v-row v-if="!selected">
            <v-col
                v-for="entry in entries"
                :key="entry.value"
                cols="12"
                sm="6"
                :md="entries.length > 2 ? 4 : 6"
            >
                <v-card
                    variant="outlined"
                    height="100%"
                    class="entry"
                    role="link"
                    tabindex="0"
                    @click="open(entry.value)"
                    @keydown.enter="open(entry.value)"
                >
                    <v-card-text class="d-flex flex-column align-center text-center ga-2 py-8">
                        <v-avatar
                            color="primary"
                            variant="tonal"
                            size="64"
                        >
                            <v-icon
                                :icon="entry.icon"
                                size="32"
                            />
                        </v-avatar>
                        <div class="text-h6">
                            {{ entry.label }}
                        </div>
                        <div class="text-body-2 text-medium-emphasis">
                            {{ entry.hint }}
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <!-- Opened here: its own content, with a way back -->
        <template v-else>
            <div class="d-flex align-center ga-2 mb-4">
                <v-btn
                    variant="text"
                    prepend-icon="mdi-arrow-left"
                    @click="back"
                >
                    今日運勢
                </v-btn>
                <span class="text-subtitle-1 font-weight-medium">{{ selectedLabel }}</span>
            </div>
            <FortuneTarotPanel v-if="selected === 'tarot'" />
            <FortuneKinPanel v-else-if="selected === 'kin'" />
            <FortuneRunePanel v-else />
        </template>
    </div>
</template>

<script lang="ts" setup>
import { KIN_ENTRY_ENABLED } from '../../shared/constants/mayaKin';
import { RUNE_ENTRY_ENABLED } from '../../shared/constants/runes';
import { TAROT_ENTRY_ENABLED } from '../../shared/constants/tarot';

definePageMeta({ middleware: 'member' });
useHead({ title: '今日運勢' });

type FortuneView = 'tarot' | 'kin' | 'rune';

const route = useRoute();
const router = useRouter();

/** The parts that are switched on, in the order they are shown. */
const entries = computed(() => [
    ...(TAROT_ENTRY_ENABLED
        ? [{
            value: 'tarot' as const, label: '塔羅', icon: 'mdi-cards-playing-outline', hint: '每天翻一張牌',
        }]
        : []),
    ...(KIN_ENTRY_ENABLED
        ? [{
            value: 'kin' as const, label: '瑪雅 Kin', icon: 'mdi-calendar-star', hint: '每天算一次今日 Kin',
        }]
        : []),
    ...(RUNE_ENTRY_ENABLED
        ? [{
            value: 'rune' as const, label: '盧恩符文', icon: 'mdi-alpha-r-circle-outline', hint: '每天抽一枚符文',
        }]
        : []),
]);

// Which one is open lives in the address (/fortune#tarot, #kin, #rune), so the browser's back button, a
// reload and the links from the home page and the old /tarot and /kin addresses all work.
const selected = computed<FortuneView | null>(() => {
    const wanted = route.hash.slice(1);

    return entries.value.find((entry) => entry.value === wanted)?.value ?? null;
});

const selectedLabel = computed(() => entries.value.find((entry) => entry.value === selected.value)?.label ?? '');

function open(view: FortuneView) {
    void router.push({
        path: route.path, hash: `#${view}`,
    });
}

function back() {
    void router.push({ path: route.path });
}
</script>

<style scoped>
.entry {
    cursor: pointer;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.entry:hover,
.entry:focus-visible {
    border-color: rgb(var(--v-theme-primary));
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
    outline: none;
}
</style>
