<template>
    <div class="report-page">
        <ReportBanner
            :title="meta ? meta.title : '完整報告'"
            :headline="report ? report.position : undefined"
            :tagline="tagline"
            :extended="status === 'ready'"
            :tone="meta ? meta.tone : 'green'"
        />

        <v-alert
            v-if="!meta"
            type="info"
            variant="tonal"
            class="mb-4"
        >
            找不到這份報告。
            <template #append>
                <v-btn
                    to="/"
                    size="small"
                    variant="text"
                >
                    回首頁
                </v-btn>
            </template>
        </v-alert>

        <template v-else>
            <v-card
                v-if="status === 'loading'"
                variant="outlined"
                class="mb-4"
            >
                <v-card-text>
                    <v-skeleton-loader type="paragraph, paragraph, paragraph" />
                </v-card-text>
            </v-card>

            <v-alert
                v-else-if="status === 'needs' && needMessage"
                :type="needMessage.type"
                variant="tonal"
                class="mb-4"
            >
                {{ needMessage.text }}
                <template
                    v-if="needMessage.to"
                    #append
                >
                    <v-btn
                        :to="needMessage.to"
                        size="small"
                        variant="text"
                    >
                        {{ needMessage.action }}
                    </v-btn>
                </template>
            </v-alert>

            <v-alert
                v-else-if="status === 'failed'"
                type="error"
                variant="tonal"
                class="mb-4"
            >
                暫時無法產生報告，請重新整理頁面再試一次。
            </v-alert>

            <template v-else-if="report">
                <v-alert
                    v-if="!report.persisted && canAnalyse"
                    type="info"
                    variant="tonal"
                    class="mb-4"
                >
                    你還沒登入，這份報告不會保存。登入後再開啟這一頁，報告就會保存下來。
                </v-alert>

                <v-card
                    v-if="chart"
                    variant="outlined"
                    class="mb-4"
                >
                    <v-card-title>人類圖</v-card-title>
                    <v-card-text>
                        <HumanDesignChart :chart="chart" />
                    </v-card-text>
                </v-card>

                <BaziChartPanel
                    v-if="baziChart"
                    :result="baziChart"
                />

                <SingleReportView
                    :report="report"
                    :natal-chart="natalChart"
                    :natal-locked="natalLocked"
                />

                <SingleReportAiPanel
                    v-if="canAnalyse"
                    :report="report"
                    :refresh="refresh"
                />
            </template>
        </template>
    </div>
</template>

<script lang="ts" setup>
import { isStateSystem } from '../../../shared/ontology/mapping';
import type { NatalChartResponse } from '../../../shared/schemas/api/natalChart.schema';
import type { BaziResponse } from '../../../shared/schemas/api/bazi.schema';
import type { HumanDesignResponse } from '../../../shared/schemas/api/humanDesign.schema';
import { SINGLE_REPORT_SYSTEMS, type SingleReportSystem } from '../../../shared/report/systems';
import { splitLead } from '../../utils/overviewLead';
import { useSingleReport, type SingleReportNeed } from '../../composables/useSingleReport';

type Meta = {
    system: SingleReportSystem; title: string; tone: 'green' | 'amber' | 'red';
};

const META: Readonly<Record<string, Meta>> = {
    zodiac: {
        system: 'ZODIAC', title: '星座', tone: 'amber',
    },
    blood: {
        system: 'BLOOD', title: '血型', tone: 'red',
    },
    numerology: {
        system: 'NUMEROLOGY', title: '生命靈數', tone: 'green',
    },
    mbti: {
        system: 'MBTI', title: 'MBTI', tone: 'green',
    },
    'maya-kin': {
        system: 'MAYA_KIN', title: '瑪雅 Kin', tone: 'amber',
    },
    bazi: {
        system: 'BAZI', title: '八字', tone: 'amber',
    },
    'human-design': {
        system: 'HUMAN_DESIGN', title: '人類圖', tone: 'green',
    },
    tarot: {
        system: 'TAROT', title: '今日塔羅', tone: 'amber',
    },
    rune: {
        system: 'RUNE', title: '今日盧恩', tone: 'green',
    },
    horoscope: {
        system: 'HOROSCOPE', title: '今日星座運勢', tone: 'amber',
    },
};

const route = useRoute();
const slug = String(route.params.system);
const meta: Meta | null = Object.hasOwn(META, slug) && SINGLE_REPORT_SYSTEMS.includes((META[slug] as Meta).system) ? (META[slug] as Meta) : null;

useHead({ title: meta ? `${meta.title}完整報告` : '完整報告' });

const { post } = useApi();
const { state } = useExploration();

const {
    report, status, need, refresh,
} = useSingleReport(meta ? meta.system : null);

const NEED_MESSAGES: Readonly<Record<SingleReportNeed, { type: 'info' | 'warning'; text: string; to?: string; action?: string }>> = {
    PROFILE_REQUIRED: {
        type: 'info', text: '先填寫出生日期，才能看到這份報告。', to: '/#fill', action: '去填寫',
    },
    BLOOD_REQUIRED: {
        type: 'info', text: '先填寫血型，才能看到這份報告。', to: '/#fill', action: '去填寫',
    },
    BIRTH_TIME_REQUIRED: {
        type: 'info', text: '人類圖需要出生時間，先補上才能看到這份報告。', to: '/#fill', action: '去填寫',
    },
    BIRTH_PLACE_REQUIRED: {
        type: 'info', text: '人類圖需要出生城市，先補上才能看到這份報告。', to: '/#fill', action: '去填寫',
    },
    LOGIN_REQUIRED: {
        type: 'info', text: '今日的報告要登入後才看得到。', to: '/login', action: '去登入',
    },
    NOT_DRAWN: {
        type: 'info', text: '今天還沒抽，先到今日運勢抽一次，再回來看報告。', to: '/fortune', action: '去抽',
    },
    MBTI_REQUIRED: {
        type: 'info', text: '請先完成 16 型人格測驗。', to: '/test', action: '去測驗',
    },
    NOT_PUBLISHED: {
        type: 'info', text: '這份報告需要的內容還在準備中，晚一點再回來看看。',
    },
};

/** The AI analysis is for the reports built from birth data and the like; today's state is not kept, so it has none */
const canAnalyse = computed(() => Boolean(report.value) && !isStateSystem(report.value?.systems[0] ?? 'ZODIAC'));

/** The verdict on the result in a few words (the first words of the overview), shown under the headline */
const tagline = computed(() => {
    const first = report.value?.blocks.find((block) => block.key === 'overview')?.segments[0]?.text;
    const text = first ? (/^【.+?】(.*)$/s.exec(first)?.[1] ?? first) : '';
    const body = text.slice(text.indexOf('：') + 1);

    return text ? splitLead(body).tagline : '';
});

const needMessage = computed(() => (need.value ? NEED_MESSAGES[need.value] : null));

// The human design is also drawn as a chart; it is worked out from the same birth data as the report
const chart = ref<HumanDesignResponse | null>(null);

watch(() => report.value, async (current) => {
    if (meta?.system !== 'HUMAN_DESIGN' || !current || chart.value) return;

    try {
        chart.value = await post<HumanDesignResponse>('/api/human-design/calculations', {}, {}, 'optional');
    } catch (error) {
        // The report reads fine without the drawing
        console.error('[full-report] human design chart failed:', error);
    }
}, { immediate: true });

// The BaZi chart is drawn too; nothing is saved, it is worked out from the same birth data as the report
const baziChart = ref<BaziResponse | null>(null);

watch(() => report.value, async (current) => {
    const birth = state.value.birthData;

    if (meta?.system !== 'BAZI' || !current || baziChart.value || !birth?.birthDate || !birth.birthTime) return;

    try {
        baziChart.value = await post<BaziResponse>('/api/bazi/calculations', {
            birthDate: birth.birthDate,
            birthTime: birth.birthTime,
            birthPlace: birth.birthPlace ?? null,
            gender: state.value.gender,
        }, {}, 'optional');
    } catch (error) {
        // The report reads fine without the drawing
        console.error('[full-report] bazi chart failed:', error);
    }
}, { immediate: true });

// The birth chart is drawn too (houses and aspects are read from it); nothing is saved, it is worked out from the same birth data
const natalChart = ref<NatalChartResponse | null>(null);

/** The sun-sign report is shown, but the chart waits for a birth time and a city */
const natalLocked = computed(() => meta?.system === 'ZODIAC'
    && state.value.loaded
    && !(state.value.birthData?.birthTime && state.value.birthData.birthPlace));

watch(() => report.value, async (current) => {
    const birth = state.value.birthData;

    if (meta?.system !== 'ZODIAC' || !current || natalChart.value || !birth?.birthDate || !birth.birthTime || !birth.birthPlace) return;

    try {
        natalChart.value = await post<NatalChartResponse>('/api/zodiac/natal-chart', {
            birthDate: birth.birthDate, birthTime: birth.birthTime, birthPlace: birth.birthPlace,
        }, {}, 'optional');
    } catch (error) {
        // The report reads fine without the drawing
        console.error('[full-report] natal chart failed:', error);
    }
}, { immediate: true });
</script>
