<template>
    <div class="report-page">
        <ReportBanner
            :title="meta ? meta.title : '完整報告'"
            :headline="report ? report.position : undefined"
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

                <SingleReportView :report="report" />

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
import { SINGLE_REPORT_SYSTEMS, type SingleReportSystem } from '../../../shared/report/systems';
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

const needMessage = computed(() => (need.value ? NEED_MESSAGES[need.value] : null));
</script>
