<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import ClerkAuthEntry from '@/components/Auth/ClerkAuthEntry.vue';

// 移动端头部：左侧 Logo/标题，右侧登录入口
const { t } = useI18n();
</script>

<template>
    <header class="glass-nav flex items-center justify-between px-3 py-2">
        <div class="flex items-center gap-2">
            <router-link to="/" class="flex items-center gap-2">
                <img src="/logo.png" alt="logo" class="w-9 rounded" />
                <h1 class="text-primary text-base font-semibold">{{ t('common.appName') }}</h1>
            </router-link>
        </div>
        <ClerkAuthEntry compact />
    </header>
</template>
