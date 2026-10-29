<template>
    <div class="report-page">
        <ReportBanner
            title="今日運勢"
            :headline="drawDate"
            tone="amber"
        />

        <!-- The way in: one card for each -->
        <template v-if="!selected">
            <v-row class="entries">
                <v-col
                    v-for="(entry, position) in entries"
                    :key="entry.value"
                    cols="12"
                    sm="6"
                    :md="entries.length >= 4 ? 3 : entries.length > 2 ? 4 : 6"
                >
                    <v-card
                        variant="outlined"
                        height="100%"
                        class="entry"
                        :class="{ 'entry--done': entry.result }"
                        :style="{ '--i': position }"
                        role="link"
                        tabindex="0"
                        @click="open(entry.value)"
                        @keydown.enter="open(entry.value)"
                    >
                        <div class="entry__inner">
                            <header class="entry__head">
                                <v-icon
                                    :icon="entry.icon"
                                    color="primary"
                                    size="20"
                                />
                                <span class="entry__label">{{ entry.label }}</span>
                                <!-- The sign horoscope is read, not drawn: nothing to reveal, it renews every day -->
                                <v-chip
                                    v-if="entry.kind === 'reading'"
                                    size="x-small"
                                    variant="outlined"
                                    class="entry__status"
                                >
                                    每日更新
                                </v-chip>
                                <v-chip
                                    v-else-if="entry.result"
                                    size="x-small"
                                    color="primary"
                                    variant="tonal"
                                    prepend-icon="mdi-check"
                                    class="entry__status"
                                >
                                    已揭曉
                                </v-chip>
                                <v-chip
                                    v-else
                                    size="x-small"
                                    variant="outlined"
                                    class="entry__status"
                                >
                                    尚未揭曉
                                </v-chip>
                            </header>

                            <!-- The stage: each part's own mark, the same size on every card -->
                            <div
                                class="entry__stage"
                                :class="{ 'entry__stage--stone': entry.result?.stone, 'entry__stage--card': entry.result?.cardIndex !== undefined }"
                            >
                                <template v-if="entry.result">
                                    <span
                                        v-if="entry.result.eyebrow"
                                        class="entry__eyebrow"
                                    >{{ entry.result.eyebrow }}</span>
                                    <!-- A card is shown as its picture, turned round when it was drawn reversed -->
                                    <span
                                        v-if="entry.result.cardIndex !== undefined"
                                        class="entry__card"
                                        :class="{ 'entry__card--reversed': entry.result.reversed }"
                                        role="img"
                                        :aria-label="entry.result.main"
                                        :style="cardStyle(entry.result.cardIndex)"
                                    />
                                    <span
                                        v-else
                                        class="entry__mark"
                                        :class="{ 'entry__mark--reversed': entry.result.reversed, 'entry__mark--stone': entry.result.stone }"
                                    >{{ entry.result.mark }}</span>
                                </template>
                                <v-icon
                                    v-else
                                    :icon="entry.icon"
                                    size="40"
                                    class="entry__placeholder"
                                />
                            </div>

                            <div class="entry__body">
                                <template v-if="entry.result">
                                    <div class="entry__title">
                                        {{ entry.result.main }}
                                    </div>
                                    <div class="entry__sub">
                                        {{ entry.result.sub }}
                                    </div>
                                </template>
                                <template v-else>
                                    <div class="entry__title entry__title--quiet">
                                        {{ entry.hint }}
                                    </div>
                                </template>
                            </div>

                            <footer class="entry__foot">
                                {{ entry.kind === 'reading' || !entry.result ? entry.action : '查看報告' }}
                                <v-icon
                                    icon="mdi-arrow-right"
                                    size="16"
                                />
                            </footer>
                        </div>
                    </v-card>
                </v-col>
            </v-row>
        </template>

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
            <FortuneRunePanel v-else-if="selected === 'rune'" />
            <FortuneHoroscopePanel v-else />
        </template>
    </div>
</template>

<script lang="ts" setup>
import { HOROSCOPE_ENTRY_ENABLED } from '../../shared/constants/horoscope';
import { KIN_ENTRY_ENABLED } from '../../shared/constants/mayaKin';
import {
    RUNE_ENTRY_ENABLED, RUNE_ORIENTATION_LABELS,
} from '../../shared/constants/runes';
import {
    TAROT_ENTRY_ENABLED, TAROT_ORIENTATION_LABELS,
} from '../../shared/constants/tarot';
import {
    kinName, sealName, toneName,
} from '../../shared/utils/mayaKin';
import { ZODIAC_LABELS } from '../../shared/constants/zodiacLabels';
import {
    TAROT_SPRITE, tarotSpriteCell,
} from '../../shared/constants/tarotSprite';
import { taipeiDateKey } from '../../shared/utils/time';

/** Shows one cell of the sheet of tarot pictures on the element it is set on */
function cardStyle(cell: number) {
    const {
        size, position,
    } = tarotSpriteCell(cell);

    return {
        backgroundImage: `url(${TAROT_SPRITE.url})`, backgroundSize: size, backgroundPosition: position,
    };
}

definePageMeta({ middleware: 'member' });
useHead({ title: '今日運勢' });

type FortuneView = 'tarot' | 'kin' | 'rune' | 'horoscope';

const route = useRoute();
const router = useRouter();

/** What each part has already revealed today; the landing cards show it so the page can be read at a glance. */
const { today: tarotToday, load: loadTarot } = useDailyTarot();
const { today: kinToday, load: loadKin } = useKinToday();
const { today: runeToday, load: loadRune } = useDailyRune();
const {
    today: horoscopeToday, status: horoscopeStatus, load: loadHoroscope,
} = useDailyHoroscope();

type EntryResult = {
    main: string;
    sub: string;
    /** The part's own mark, shown large on the stage: the numeral of the card, the Kin number, the rune's character */
    mark: string;
    /** A small label above the mark */
    eyebrow?: string;
    /** A reversed rune's character is turned around */
    reversed?: boolean;
    /** The mark is laid on the picture of the stone, as the rune is on its page */
    stone?: boolean;
    /** The cell of the tarot sheet that holds the picture of the card */
    cardIndex?: number;
};

const tarotResult = computed<EntryResult | null>(() => {
    const drawn = tarotToday.value?.drawn ? tarotToday.value : null;

    return drawn
        ? {
            main: `${drawn.card.name}（${TAROT_ORIENTATION_LABELS[drawn.card.orientation]}）`,
            sub: drawn.card.englishName,
            mark: drawn.card.roman,
            reversed: drawn.card.orientation === 'reversed',
            cardIndex: drawn.card.index,
        }
        : null;
});

const kinResult = computed<EntryResult | null>(() => {
    const unlocked = kinToday.value?.unlocked ? kinToday.value : null;

    return unlocked
        ? {
            main: kinName(unlocked.kin),
            sub: `圖騰 ${sealName(unlocked.kin.solarSeal)} · 調性 ${toneName(unlocked.kin.galacticTone)}`,
            mark: String(unlocked.kin.kinNumber),
            eyebrow: 'KIN',
        }
        : null;
});

const runeResult = computed<EntryResult | null>(() => {
    const drawn = runeToday.value?.drawn ? runeToday.value : null;

    return drawn
        ? {
            main: `${drawn.rune.name}（${RUNE_ORIENTATION_LABELS[drawn.rune.orientation]}）`,
            sub: drawn.rune.meaning,
            mark: drawn.rune.glyph,
            reversed: drawn.rune.orientation === 'reversed',
            stone: true,
        }
        : null;
});

/** Today's Moon in the member's houses, the headline of the sign horoscope: there is nothing to reveal, so it is shown at once. */
const horoscopeResult = computed<EntryResult | null>(() => {
    const moon = horoscopeToday.value?.bodies.find((entry) => entry.body === 'MOON');

    return horoscopeToday.value && moon
        ? {
            main: `月亮在你的第 ${moon.house} 宮`,
            sub: `你是${ZODIAC_LABELS[horoscopeToday.value.sign]} · ${moon.area}`,
            mark: String(moon.house),
            eyebrow: 'HOUSE',
        }
        : null;
});

/** The parts that are switched on, in the order they are shown. */
const entries = computed(() => [
    ...(TAROT_ENTRY_ENABLED
        ? [{
            value: 'tarot' as const, label: '塔羅', icon: 'mdi-cards-playing-outline', kind: 'ritual' as const, hint: '每天翻一張牌', action: '去翻牌', result: tarotResult.value,
        }]
        : []),
    ...(KIN_ENTRY_ENABLED
        ? [{
            value: 'kin' as const, label: '瑪雅 Kin', icon: 'mdi-calendar-star', kind: 'ritual' as const, hint: '每天揭曉一次今日 Kin', action: '去揭曉', result: kinResult.value,
        }]
        : []),
    ...(RUNE_ENTRY_ENABLED
        ? [{
            value: 'rune' as const, label: '盧恩符文', icon: 'mdi-alpha-r-circle-outline', kind: 'ritual' as const, hint: '每天抽一枚符文', action: '去抽符', result: runeResult.value,
        }]
        : []),
    ...(HOROSCOPE_ENTRY_ENABLED
        ? [{
            value: 'horoscope' as const,
            label: '星座運勢',
            icon: 'mdi-zodiac-leo',
            kind: 'reading' as const,
            // Without a birth date there is no sign to read the sky from
            hint: horoscopeStatus.value === 'needsProfile' ? '先填寫出生日期' : '以你的星座看今天',
            action: horoscopeStatus.value === 'needsProfile' ? '去填寫' : '看運勢',
            result: horoscopeResult.value,
        }]
        : []),
]);

/** The Taipei date that today's parts belong to */
const todayKey = taipeiDateKey(new Date());

// Ask what has been revealed today, so the cards can show it. Nothing is written by asking.
onMounted(() => {
    if (TAROT_ENTRY_ENABLED) void loadTarot();
    if (KIN_ENTRY_ENABLED) void loadKin();
    if (RUNE_ENTRY_ENABLED) void loadRune();
    if (HOROSCOPE_ENTRY_ENABLED) void loadHoroscope();
});

// Which one is open lives in the address (/fortune#tarot, #kin, #rune), so the browser's back button, a
// reload and the links from the home page and the old /tarot and /kin addresses all work.
const selected = computed<FortuneView | null>(() => {
    const wanted = route.hash.slice(1);

    return entries.value.find((entry) => entry.value === wanted)?.value ?? null;
});

/** The date under the title of the page: today on the way in, the date of the part that is open once it has been revealed */
const drawDate = computed(() => {
    if (!selected.value) return todayKey;
    if (selected.value === 'tarot' && tarotToday.value?.drawn) return tarotToday.value.date;
    if (selected.value === 'rune' && runeToday.value?.drawn) return runeToday.value.date;
    if (selected.value === 'kin' && kinToday.value?.unlocked) return kinToday.value.date;
    if (selected.value === 'horoscope') return horoscopeToday.value?.date;

    return undefined;
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
/* Every card has the same four parts, so the three line up whatever each one holds. */
.entry {
    cursor: pointer;
    animation: entry-in 0.45s ease backwards;
    animation-delay: calc(var(--i) * 60ms);
    transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
}

.entry--done {
    border-color: rgb(var(--v-theme-primary));
}

.entry__inner {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 16px 18px 14px;
}

.entry__head {
    display: flex;
    align-items: center;
    gap: 8px;
}

.entry__label {
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: 0.04em;
}

.entry__status {
    margin-left: auto;
}

/* The stage keeps one height, so a revealed card and an open one are as tall as each other. */
.entry__stage {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    --stage-h: 136px;

    height: var(--stage-h);
    margin: 14px 0 12px;
    border-radius: 10px;
    background: rgba(var(--v-theme-primary), 0.06);
}

/* The rune is on its stone, the picture of the rune page: no tint behind it */
.entry__stage--stone {
    background: url('/rune/stone-front.png') center / auto 100% no-repeat;
}

/* The card keeps its own 7:12 and the height of the stage; no tint behind it */
.entry__stage--card {
    background: transparent;
}

.entry__card {
    height: 100%;
    aspect-ratio: 7 / 12;
    background-repeat: no-repeat;
    filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.25));
}

.entry__card--reversed {
    transform: rotate(180deg);
}

.entry:not(.entry--done) .entry__stage {
    background: transparent;
    border: 1px dashed rgba(var(--v-theme-on-surface), 0.2);
}

.entry__placeholder {
    opacity: 0.35;
}

.entry__eyebrow {
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.3em;
    text-indent: 0.3em;
    color: rgb(var(--v-theme-primary));
}

.entry__mark {
    font-size: clamp(3rem, 5vw, 4rem);
    font-weight: 400;
    line-height: 1.05;
    letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums;
}

.entry__mark--reversed {
    transform: rotate(180deg);
}

/* Sized to the stone (4:5 of the stage), and set in the middle of it as on the rune page */
.entry__mark--stone {
    font-size: calc(var(--stage-h) * 0.68);
    line-height: 1;
    color: #d4af60;
}

.entry__mark--stone.entry__mark--reversed {
    transform: rotate(180deg);
}

.entry__body {
    flex: 1;
    text-align: center;
}

.entry__title {
    font-size: 1.0625rem;
    font-weight: 700;
    line-height: 1.4;
}

.entry__title--quiet {
    font-size: 0.9375rem;
    font-weight: 400;
    color: rgba(var(--v-theme-on-surface), 0.6);
}

.entry__sub {
    margin-top: 2px;
    font-size: 0.8125rem;
    line-height: 1.5;
    color: rgba(var(--v-theme-on-surface), 0.6);
}

.entry__foot {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
    font-size: 0.875rem;
    font-weight: 500;
    color: rgb(var(--v-theme-primary));
}

.entry:hover,
.entry:focus-visible {
    border-color: rgb(var(--v-theme-primary));
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
    outline: none;
}

/* On a phone the stage moves to the side, so three cards do not stack up three screens high. */
@media (max-width: 599px) {
    .entry__inner {
        display: grid;
        grid-template-columns: 104px 1fr;
        grid-template-areas:
            'head head'
            'stage body'
            'foot foot';
        column-gap: 14px;
        padding: 14px 16px 12px;
    }

    .entry__head {
        grid-area: head;
    }

    .entry__stage {
        --stage-h: 104px;

        grid-area: stage;
        height: var(--stage-h);
        margin: 12px 0 0;
    }

    .entry__body {
        grid-area: body;
        align-self: center;
        margin-top: 12px;
        text-align: left;
    }

    .entry__foot {
        grid-area: foot;
        justify-content: flex-end;
    }

    .entry__mark:not(.entry__mark--stone) {
        font-size: 2.5rem;
    }
}

@keyframes entry-in {
    from {
        opacity: 0;
        transform: translateY(8px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@media (prefers-reduced-motion: reduce) {
    .entry {
        animation: none;
        transition: none;
    }
}
</style>
