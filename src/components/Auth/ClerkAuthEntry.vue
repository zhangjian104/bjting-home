<script setup lang="ts">
import { Show, SignInButton, UserButton } from '@clerk/vue';
import { useI18n } from 'vue-i18n';
import Button from '@/components/Ui/Button.vue';

defineProps<{
    /** 移动端：仅显示图标按钮 */
    compact?: boolean;
}>();

const { t } = useI18n();
</script>

<template>
    <div class="flex items-center">
        <Show when="signed-out">
            <SignInButton mode="redirect">
                <Button
                    v-if="!compact"
                    variant="glass"
                    size="sm"
                    rounded="lg"
                    class="gap-1.5 px-3.5 py-1.5"
                    type="button"
                >
                    <span class="icon-[ic--baseline-person-pin] h-4 w-4"></span>
                    {{ t('auth.login') }}
                </Button>
                <button
                    v-else
                    type="button"
                    class="hover:bg-hover-glass rounded-md p-2"
                    :title="t('auth.login')"
                >
                    <span class="icon-[mdi--account] h-5 w-5"></span>
                </button>
            </SignInButton>
        </Show>
        <Show when="signed-in">
            <UserButton
                :appearance="{
                    elements: {
                        avatarBox: compact ? 'h-8 w-8' : 'h-9 w-9',
                    },
                }"
            />
        </Show>
    </div>
</template>
