import { watch } from 'vue';
import { useAuth, useUser } from '@clerk/vue';
import { useUserStore } from '@/stores/modules/user';
import { setClerkTokenGetter } from '@/utils/clerkToken';
import { identifyClerkUser, resetClerkUser } from '@/utils/analytics';

/** 将 Clerk 用户态同步到 Pinia、PostHog，并注册 API Token 获取器 */
export function useClerkSync() {
    const { user, isSignedIn, isLoaded } = useUser();
    const { getToken } = useAuth();
    const userStore = useUserStore();

    setClerkTokenGetter(() => getToken());

    watch(
        [user, isSignedIn, isLoaded],
        () => {
            userStore.setAuthState({
                loaded: Boolean(isLoaded.value),
                signedIn: Boolean(isSignedIn.value),
            });

            if (!isLoaded.value) return;

            if (isSignedIn.value && user.value) {
                userStore.syncFromClerk(user.value);
                identifyClerkUser(user.value);
                return;
            }

            userStore.clear();
            resetClerkUser();
        },
        { immediate: true }
    );
}
