<script setup lang="ts">
import { useAudio } from '@/composables/useAudio';
import LazyImage from '@/components/Ui/LazyImage.vue';

const { playlist } = useAudio();

const likedSongs = computed(() => (playlist.value || []).filter(s => s.liked));
const playSong = (s: any) => {
    const { play } = useAudio();
    play(s, 0);
};
</script>

<template>
    <div class="flex-1 overflow-auto px-3 pb-6">
        <template v-if="!likedSongs.length">
            <div class="text-primary/70 py-10 text-center">{{ $t('likes.empty') }}</div>
        </template>
        <div v-else class="space-y-3">
            <div
                v-for="s in likedSongs"
                :key="s.id"
                class="glass-card flex items-center gap-3 p-3"
                @click="playSong(s)"
            >
                <div class="h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                    <LazyImage
                        v-if="s.cover"
                        :src="s.cover"
                        alt="cover"
                        imgClass="h-full w-full object-cover"
                    />
                    <div
                        v-else
                        class="glass-button flex h-full w-full items-center justify-center rounded-lg"
                    >
                        🎵
                    </div>
                </div>
                <div class="min-w-0 flex-1">
                    <p class="text-primary truncate text-sm font-medium">{{ s.name }}</p>
                    <p class="text-primary/70 truncate text-xs">{{ s.artist }}</p>
                </div>
                <span class="icon-[mdi--heart] text-primary/70 h-5 w-5"></span>
            </div>
        </div>
    </div>
</template>
