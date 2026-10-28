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
                    v-if="!report.persisted"
                    type="info"
                    variant="tonal"
                    class="mb-4"
                >
                    你還沒登入，這份報告不會保存。登入後再開啟這一頁，報告就會保存下來。
                </v-alert>

                <SingleReportView :report="report" />
            </template>
        </template>
    </div>
</template>

<script lang="ts" setup>
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
};

const route = useRoute();
const slug = String(route.params.system);
const meta: Meta | null = Object.hasOwn(META, slug) && SINGLE_REPORT_SYSTEMS.includes((META[slug] as Meta).system) ? (META[slug] as Meta) : null;

useHead({ title: meta ? `${meta.title}完整報告` : '完整報告' });

const {
    report, status, need,
} = useSingleReport(meta ? meta.system : null);

const NEED_MESSAGES: Readonly<Record<SingleReportNeed, { type: 'info' | 'warning'; text: string; to?: string; action?: string }>> = {
    PROFILE_REQUIRED: {
        type: 'info', text: '先填寫出生日期，才能看到這份報告。', to: '/#fill', action: '去填寫',
    },
    BLOOD_REQUIRED: {
        type: 'info', text: '先填寫血型，才能看到這份報告。', to: '/#fill', action: '去填寫',
    },
    MBTI_REQUIRED: {
        type: 'info', text: '請先完成 16 型人格測驗。', to: '/test', action: '去測驗',
    },
    NOT_PUBLISHED: {
        type: 'info', text: '這份報告需要的內容還在準備中，晚一點再回來看看。',
    },
};

const needMessage = computed(() => (need.value ? NEED_MESSAGES[need.value] : null));
</script>
