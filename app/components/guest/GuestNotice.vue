<template>
    <v-alert
        v-if="!isAuthenticated"
        type="info"
        variant="tonal"
        class="mb-4"
    >
        <div class="mb-2">
            未登入將不保留結果，離開後（或 1 天後）即會消失。登入後可儲存這次的結果。
        </div>
        <v-btn
            color="primary"
            :loading="busy"
            @click="signInAndSave"
        >
            以 Google 登入並儲存
        </v-btn>
    </v-alert>
    <v-snackbar
        v-model="snackbar"
        :color="snackbarColor"
    >
        {{ message }}
    </v-snackbar>
</template>

<script lang="ts" setup>
const {
    isAuthenticated, signInWithGoogle, error,
} = useAuth();
const { claim } = useGuestSession();

const busy = ref(false);
const snackbar = ref(false);
const snackbarColor = ref('success');
const message = ref('');

const emit = defineEmits<{ saved: [] }>();

function notify(text: string, color: string) {
    message.value = text;
    snackbarColor.value = color;
    snackbar.value = true;
}

async function signInAndSave() {
    busy.value = true;

    try {
        if (!await signInWithGoogle()) {
            notify(error.value ?? '登入失敗', 'error');
            return;
        }

        const outcome = await claim();

        if (outcome.status === 'saved') {
            notify('已將這次的結果存入帳號', 'success');
            emit('saved');
        } else if (outcome.status === 'expired') {
            notify('暫存的結果已過期，請重新測驗', 'warning');
        } else if (outcome.status === 'failed') {
            notify(outcome.message, 'error');
        }
    } finally {
        busy.value = false;
    }
}
</script>
