<template>
    <v-card
        v-if="entries.length"
        class="mb-6"
        variant="outlined"
    >
        <v-card-text class="d-flex flex-wrap align-center ga-4">
            <v-avatar
                color="primary"
                variant="tonal"
                size="48"
            >
                <v-icon icon="mdi-cards-playing-outline" />
            </v-avatar>
            <div class="flex-grow-1">
                <div class="text-subtitle-1 font-weight-medium">
                    今日運勢
                </div>
                <p
                    v-if="!initialized || !isAuthenticated"
                    class="text-body-2 text-medium-emphasis mb-0"
                >
                    每天翻塔羅、算今日 Kin、抽盧恩符文，看看今天給你的提醒。登入後就能使用。
                </p>
                <template v-else>
                    <p
                        v-for="entry in entries"
                        :key="entry.label"
                        class="text-body-2 mb-0"
                        :class="{ 'text-medium-emphasis': !entry.done }"
                    >
                        {{ entry.label }}：{{ entry.text }}
                    </p>
                </template>
            </div>
            <v-btn
                v-if="initialized && !isAuthenticated"
                to="/login"
                color="primary"
            >
                立即登入
            </v-btn>
            <v-btn
                v-else-if="initialized"
                to="/fortune"
                :color="allDone ? undefined : 'primary'"
                :variant="allDone ? 'tonal' : 'flat'"
            >
                看今天的運勢
            </v-btn>
        </v-card-text>
    </v-card>
</template>

<script lang="ts" setup>
import { KIN_ENTRY_ENABLED } from '../../../shared/constants/mayaKin';
import {
    RUNE_ENTRY_ENABLED, RUNE_ORIENTATION_LABELS,
} from '../../../shared/constants/runes';
import {
    TAROT_ENTRY_ENABLED, TAROT_ORIENTATION_LABELS,
} from '../../../shared/constants/tarot';
import { kinName } from '../../../shared/utils/mayaKin';

const {
    isAuthenticated, initialized,
} = useAuth();
const {
    today: tarotToday, load: loadTarot,
} = useDailyTarot();
const {
    today: kinToday, load: loadKin,
} = useKinToday();
const {
    today: runeToday, load: loadRune,
} = useDailyRune();

const tarotDrawn = computed(() => (tarotToday.value?.drawn ? tarotToday.value : null));
const kinUnlocked = computed(() => (kinToday.value?.unlocked ? kinToday.value : null));
const runeDrawn = computed(() => (runeToday.value?.drawn ? runeToday.value : null));

/** One line for each part that is switched on. */
const entries = computed(() => [
    ...(TAROT_ENTRY_ENABLED
        ? [{
            label: '今日塔羅',
            done: Boolean(tarotDrawn.value),
            text: tarotDrawn.value
                ? `${tarotDrawn.value.card.name}（${TAROT_ORIENTATION_LABELS[tarotDrawn.value.card.orientation]}）`
                : '還沒翻牌，每天可以翻一張',
        }]
        : []),
    ...(KIN_ENTRY_ENABLED
        ? [{
            label: '今日 Kin',
            done: Boolean(kinUnlocked.value),
            text: kinUnlocked.value
                ? `${kinName(kinUnlocked.value.kin)}（Kin ${kinUnlocked.value.kin.kinNumber}）`
                : '還沒計算，每天可以計算一次',
        }]
        : []),
    ...(RUNE_ENTRY_ENABLED
        ? [{
            label: '盧恩符文',
            done: Boolean(runeDrawn.value),
            text: runeDrawn.value
                ? `${runeDrawn.value.rune.glyph} ${runeDrawn.value.rune.name}（${RUNE_ORIENTATION_LABELS[runeDrawn.value.rune.orientation]}）`
                : '還沒抽符，每天可以抽一枚',
        }]
        : []),
]);

const allDone = computed(() => entries.value.every((entry) => entry.done));
// Only a member's cards are asked for; a visitor sees the invitation and nothing of today's results.
watch(() => initialized.value && isAuthenticated.value, (member) => {
    if (!member) return;

    if (TAROT_ENTRY_ENABLED) void loadTarot();
    if (KIN_ENTRY_ENABLED) void loadKin();
    if (RUNE_ENTRY_ENABLED) void loadRune();
}, { immediate: true });
</script>
