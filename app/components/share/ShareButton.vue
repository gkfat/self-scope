<template>
    <div>
        <v-btn
            prepend-icon="mdi-share-variant"
            :loading="busy"
            @click="share"
        >
            分享結果
        </v-btn>
        <v-snackbar
            v-model="snackbar"
            :color="snackbarColor"
        >
            {{ message }}
        </v-snackbar>
    </div>
</template>

<script lang="ts" setup>
import type { ShareCard } from '../../../shared/schemas/api/shareCard.schema';

const props = defineProps<{
    source: 'SINGLE_RESULT' | 'SUMMARY' | 'HUMAN_DESIGN';
    referenceId: string;
}>();

const { post } = useApi();

const busy = ref(false);
const snackbar = ref(false);
const snackbarColor = ref('success');
const message = ref('');

function notify(text: string, color: string) {
    message.value = text;
    snackbarColor.value = color;
    snackbar.value = true;
}

async function share() {
    busy.value = true;

    try {
        const card = await post<ShareCard>('/api/share-cards', {
            source: props.source,
            referenceId: props.referenceId,
        }, {}, 'optional');
        const text = `${card.title}\n${card.summaryText}`;

        if (typeof navigator.share === 'function') {
            await navigator.share({
                title: card.title,
                text,
            });
            return;
        }

        await navigator.clipboard.writeText(text);
        notify('已複製分享文字', 'success');
    } catch (error) {
        // Closing the share sheet is not an error.
        if (error instanceof DOMException && error.name === 'AbortError') return;

        console.error('[share] failed:', error);
        notify('分享失敗，請稍後再試', 'error');
    } finally {
        busy.value = false;
    }
}
</script>
