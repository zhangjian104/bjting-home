<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAudioStore } from '@/stores/modules/audio';
import { useAudio } from '@/composables/useAudio';
import type { Song } from '@/stores/interface';
import { getAudiobookDetail } from '@/api';
import { getResourceUrl } from '@/utils';
import Button from '@/components/Ui/Button.vue';
import LazyImage from '@/components/Ui/LazyImage.vue';
import SongList from '@/components/SongList.vue';

const route = useRoute();
const router = useRouter();
const audioStore = useAudioStore();
const { setPlaylist, play } = useAudio();

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
                coverImgUrl: res.book.cover_path ? getResourceUrl(res.book.cover_path, 'cover') : '',
                creator: `作者：${authorStr} | 演播：${narratorStr}`,
                playCount: 0, // 接口暂无
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
                url: ep.key ? getResourceUrl(ep.key, 'media') : '',
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

// 计算是否播放过
const hasPlayedBefore = computed(() => {
    const history = audioStore.audio.playHistory || [];
    // 只要有任何一集在这个书的章节列表里，就认为播放过
    return history.some(h => chapters.value.some(c => c.id === h.id));
});

const handlePlay = () => {
    if (chapters.value.length === 0) return;

    setPlaylist(chapters.value, 0);

    if (hasPlayedBefore.value) {
        const history = audioStore.audio.playHistory || [];
        // 找到最后播放的这一本书的章节
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

    // 开始播放第一集
    play(chapters.value[0], 0);
};

const goBack = () => {
    router.back();
};
</script>

<template>
    <div class="flex h-full w-full flex-col overflow-x-hidden p-4">
        <div class="flex flex-1 flex-col gap-3 overflow-hidden">
            <div class="relative shrink-0">
                <div class="absolute inset-0 overflow-hidden rounded-3xl">
                    <img
                        :src="bookInfo.coverImgUrl"
                        class="h-full w-full scale-150 object-cover opacity-30 blur-3xl"
                    />
                    <div
                        class="to-overlay absolute inset-0 bg-linear-to-b from-transparent via-transparent"
                    ></div>
                </div>

                <div class="relative z-10 overflow-hidden rounded-3xl">
                    <div class="glass-container">
                        <div class="relative flex flex-col gap-6 p-6 lg:flex-row lg:gap-10">
                            <!-- 返回按钮 -->
                            <div class="absolute top-4 left-4 z-20">
                                <Button
                                    variant="ghost"
                                    size="icon-md"
                                    rounded="full"
                                    @click="goBack"
                                >
                                    <span class="icon-[mdi--arrow-left] h-6 w-6"></span>
                                </Button>
                            </div>

                            <div
                                class="group relative mx-auto w-56 shrink-0 lg:mx-0 lg:ml-12 lg:w-64"
                            >
                                <div
                                    class="ring-glass aspect-square overflow-hidden rounded-3xl shadow-2xl ring-1"
                                >
                                    <LazyImage
                                        :src="bookInfo.coverImgUrl"
                                        alt="cover"
                                        imgClass="h-full w-full object-cover"
                                        wrapperClass="h-full w-full"
                                    />
                                </div>
                            </div>

                            <div
                                class="flex min-w-0 flex-1 flex-col justify-center pt-8 text-center lg:pt-0 lg:text-left"
                            >
                                <h1
                                    class="text-primary mb-4 line-clamp-2 text-xl leading-tight font-bold lg:text-4xl"
                                >
                                    {{ bookInfo.name }}
                                </h1>

                                <div
                                    class="mb-5 flex items-center justify-center gap-3 lg:justify-start"
                                >
                                    <span class="text-primary font-medium">{{
                                        bookInfo.creator
                                    }}</span>
                                </div>

                                <p
                                    class="text-primary/70 mb-6 line-clamp-2 text-sm leading-relaxed lg:text-base"
                                >
                                    {{ bookInfo.description }}
                                </p>

                                <div
                                    class="flex flex-wrap items-center justify-center gap-3 lg:justify-start"
                                >
                                    <Button
                                        variant="solid"
                                        size="md"
                                        rounded="full"
                                        class="px-8 py-3 shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/40"
                                        @click="handlePlay"
                                    >
                                        <span class="icon-[mdi--play] mr-2 h-5 w-5"></span>
                                        {{ hasPlayedBefore ? '继续播放' : '开始播放' }}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 章节列表 -->
            <section class="relative mt-2 min-h-[300px] flex-1 overflow-hidden">
                <div class="absolute inset-0">
                    <SongList :songs="chapters" :show-header="true" />
                </div>
            </section>
        </div>
    </div>
</template>

<style scoped>
.glass-container {
    background: var(--glass-card-bg);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
}
</style>
