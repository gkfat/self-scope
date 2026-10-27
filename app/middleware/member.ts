/**
 * Pages that need a signed-in member. Firebase restores the session asynchronously,
 * so wait for it before deciding; a visitor without a session goes back to the home page.
 */
export default defineNuxtRouteMiddleware(async () => {
    const {
        isAuthenticated, initialized, user, idToken, initAuthListener,
    } = useAuth();

    initAuthListener();

    // The session is restored once Firebase has answered and, for a member, the token is ready.
    const settled = () => initialized.value && (!user.value || Boolean(idToken.value));

    if (!settled()) {
        await new Promise<void>((resolve) => {
            const stop = watch([
                initialized,
                user,
                idToken,
            ], () => {
                if (!settled()) return;

                stop();
                resolve();
            }, { immediate: true });
        });
    }

    if (!isAuthenticated.value) return navigateTo('/');
});
