// 用户信息存储模块：Clerk 认证态缓存层
import { defineStore } from 'pinia';

export interface UserProfile {
    userId: string;
    nickname: string;
    avatarUrl: string;
    email?: string;
}

interface ClerkUserLike {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    username?: string | null;
    fullName?: string | null;
    imageUrl?: string;
    primaryEmailAddress?: { emailAddress?: string } | null;
}

export const useUserStore = defineStore('user', {
    state: () => ({
        /** Clerk 是否已完成首次加载 */
        authLoaded: false,
        /** 当前是否已登录（与 Clerk isSignedIn 同步） */
        isSignedIn: false,
        profile: null as UserProfile | null,
    }),
    getters: {
        isLoggedIn: state => state.isSignedIn && !!state.profile,
    },
    actions: {
        setAuthState(payload: { loaded: boolean; signedIn: boolean }) {
            this.authLoaded = payload.loaded;
            this.isSignedIn = payload.signedIn;
        },
        syncFromClerk(user: ClerkUserLike) {
            const nickname =
                user.fullName?.trim() ||
                user.firstName?.trim() ||
                user.username?.trim() ||
                '';
            this.profile = {
                userId: user.id,
                nickname,
                avatarUrl: user.imageUrl || '',
                email: user.primaryEmailAddress?.emailAddress,
            };
            this.isSignedIn = true;
            this.authLoaded = true;
        },
        clear() {
            this.profile = null;
            this.isSignedIn = false;
        },
    },
});
