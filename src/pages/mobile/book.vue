<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAudioStore } from '@/stores/modules/audio';
import { useAudio } from '@/composables/useAudio';
import type { Song } from '@/stores/interface';
import { getAudiobookDetail } from '@/api';
import Button from '@/components/Ui/Button.vue';
import LazyImage from '@/components/Ui/LazyImage.vue';

const route = useRoute();
const router = useRouter();
const audioStore = useAudioStore();
const { setPlaylist, play, currentSong, isPlaying } = useAudio();

const isLoading = ref(true);

const bookInfo = ref({
    id: '',
    name: '加载中...',
    description: '',
    coverImgUrl: '',
    creator: '',
    playCount: 0,
});

const chapters = ref<Song[]>([]);

const loadBookDetail = async (id: string) => {
    isLoading.value = true;
    try {
        const res = await getAudiobookDetail(id);

        if (res && res.book) {
            let authorStr = '佚名';
            let narratorStr = '佚名';
            if (res.book.authors && Array.isArray(res.book.authors)) {
                if (res.book.authors[0]) authorStr = res.book.authors[0];
                if (res.book.authors[1]) narratorStr = res.book.authors[1];
            }

            bookInfo.value = {
                id: res.book.id,
                name: res.book.title,
                description: res.book.description,
                coverImgUrl: res.book.cover_url,
                creator: `作者：${authorStr} | 演播：${narratorStr}`,
                playCount: 0,
            };
        }

        if (res && res.episodes && Array.isArray(res.episodes)) {
            chapters.value = res.episodes.map((ep: any) => ({
                id: ep.key,
                name: ep.name,
                artist: bookInfo.value.creator,
                album: bookInfo.value.name,
                duration: (ep.duration_seconds || 0) * 1000,
                cover: bookInfo.value.coverImgUrl,
                url: ep.audio_url,
            }));
        }
    } catch (e) {
        console.error('Failed to load audiobook detail:', e);
    } finally {
        isLoading.value = false;
    }
};

onMounted(() => {
    const id = route.params.id as string;
    if (id) {
        loadBookDetail(id);
    }
});

watch(
    () => route.params.id,
    newId => {
        if (newId) {
            loadBookDetail(newId as string);
        }
    }
);

const hasPlayedBefore = computed(() => {
    const history = audioStore.audio.playHistory || [];
    return history.some(h => chapters.value.some(c => c.id === h.id));
});

const handlePlay = () => {
    if (chapters.value.length === 0) return;

    setPlaylist(chapters.value, 0);

    if (hasPlayedBefore.value) {
        const history = audioStore.audio.playHistory || [];
        const lastPlayed = [...history]
            .reverse()
            .find(h => chapters.value.some(c => c.id === h.id));
        if (lastPlayed) {
            const index = chapters.value.findIndex(c => c.id === lastPlayed.id);
            if (index !== -1) {
                play(chapters.value[index], index);
                return;
            }
        }
    }

    play(chapters.value[0], 0);
};

const goBack = () => {
    router.back();
};

const isCurrent = (s: Song) => {
    const cur = currentSong.value;
    if (!cur) return false;
    return String(s.id) === String(cur.id);
};

const formatDuration = (ms: number) => {
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const sec = total % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
};

const handleChapterClick = (s: Song, i: number) => {
    setPlaylist(chapters.value, i);
    play(s, i);
};
</script>

<template>
    <div class="playlist-page flex h-full flex-1 flex-col overflow-hidden">
        <!-- TODO: 目前全局的 MobileHeader 缺少返回按钮。后续需修改 src/layout/mobile/Header.vue，
             在深层路由（如本页面）时动态在左侧显示返回按钮，取代现有的这个内嵌式返回按钮。-->
        <div class="header-section relative shrink-0">
            <div class="absolute top-4 left-4 z-50">
                <Button
                    variant="ghost"
                    size="icon-md"
                    rounded="full"
                    @click="goBack"
                    class="bg-black/20 text-white backdrop-blur-md"
                >
                    <span class="icon-[mdi--arrow-left] h-6 w-6"></span>
                </Button>
            </div>

            <div class="header-bg absolute inset-0 overflow-hidden">
                <LazyImage
                    :src="bookInfo.coverImgUrl"
                    alt="cover"
                    imgClass="h-full w-full object-cover scale-110"
                />
                <div class="header-overlay absolute inset-0"></div>
            </div>

            <div class="header-content relative z-10 px-4 pt-16 pb-6">
                <div class="flex gap-4">
                    <div class="cover-wrapper relative shrink-0">
                        <LazyImage
                            :src="bookInfo.coverImgUrl"
                            alt="cover"
                            imgClass="cover-image h-32 w-32 rounded-2xl object-cover"
                        />
                    </div>

                    <div class="flex min-w-0 flex-1 flex-col justify-between py-1">
                        <div>
                            <h1
                                class="text-accent mb-2 line-clamp-2 text-lg leading-tight font-bold text-white"
                            >
                                {{ bookInfo.name }}
                            </h1>
                            <div class="creator-info flex items-center gap-2">
                                <span class="text-sm text-white/80">{{ bookInfo.creator }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="desc-section mt-4">
                    <p class="line-clamp-2 text-xs leading-relaxed text-white/70">
                        {{ bookInfo.description }}
                    </p>
                </div>
            </div>
        </div>

        <div class="action-bar flex shrink-0 items-center justify-center bg-transparent px-4 py-4">
            <Button
                variant="gradient"
                size="md"
                rounded="full"
                class="flex w-full items-center justify-center gap-2 py-3 text-base font-medium shadow-lg"
                icon="icon-[mdi--play-circle]"
                icon-class="h-6 w-6"
                @click="handlePlay"
            >
                {{ hasPlayedBefore ? '继续播放' : '开始播放' }}
            </Button>
        </div>

        <div class="custom-scrollbar flex-1 overflow-auto px-4 pb-6">
            <section class="overflow-hidden py-2">
                <div
                    v-for="(song, index) in chapters"
                    :key="song.id"
                    class="song-item-compact group flex items-center gap-3 rounded-xl p-2.5 transition-all duration-200"
                    :class="isCurrent(song) ? 'song-item-active' : ''"
                    @click="handleChapterClick(song, index)"
                >
                    <div class="w-6 shrink-0 text-center">
                        <div v-if="isCurrent(song)" class="playing-icon">
                            <span class="bar" :class="{ animate: isPlaying }"></span>
                            <span class="bar" :class="{ animate: isPlaying }"></span>
                            <span class="bar" :class="{ animate: isPlaying }"></span>
                        </div>
                        <span
                            v-else
                            class="song-index text-xs font-bold"
                            :class="index < 3 ? 'text-pink-400' : ''"
                            >{{ index + 1 }}</span
                        >
                    </div>
                    <div class="min-w-0 flex-1">
                        <p
                            class="song-name truncate text-sm font-medium"
                            :class="isCurrent(song) ? 'text-pink-400' : ''"
                        >
                            {{ song.name }}
                        </p>
                    </div>
                    <span class="song-duration text-primary/30 shrink-0 text-xs">{{
                        formatDuration(song.duration)
                    }}</span>
                </div>
            </section>
        </div>
    </div>
</template>

<style scoped>
.header-bg::after {
    content: '';
    position: absolute;
    inset: 0;
    backdrop-filter: blur(40px) saturate(1.5);
    -webkit-backdrop-filter: blur(40px) saturate(1.5);
}

.header-overlay {
    background: linear-gradient(
        to bottom,
        rgba(0, 0, 0, 0.3) 0%,
        rgba(0, 0, 0, 0.5) 50%,
        var(--glass-bg-solid) 100%
    );
}

.cover-wrapper {
    filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.4));
}

.cover-image {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.song-item-compact:not(.song-item-active):active {
    background: var(--glass-interactive-hover-muted);
}

.song-item-active {
    background: linear-gradient(to right, rgba(236, 72, 153, 0.2), rgba(139, 92, 246, 0.2));
}

:root.dark .song-item-active,
html.dark .song-item-active {
    background: linear-gradient(to right, rgba(236, 72, 153, 0.25), rgba(139, 92, 246, 0.25));
}

.song-name {
    color: var(--glass-text-primary);
}

.song-index {
    color: var(--glass-text-primary);
    opacity: 0.3;
}
</style>
