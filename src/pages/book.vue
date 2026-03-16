<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAudioStore } from '@/stores/modules/audio';
import { useAudio } from '@/composables/useAudio';
import type { Song } from '@/stores/interface';
import Button from '@/components/Ui/Button.vue';
import LazyImage from '@/components/Ui/LazyImage.vue';
import SongList from '@/components/SongList.vue';

const route = useRoute();
const router = useRouter();
const audioStore = useAudioStore();
const { setPlaylist, play } = useAudio();

const bookId = route.params.id;

// 写死的数据
const bookInfo = ref({
    id: bookId,
    name: '我的考古探险记',
    description: '超精彩新作，嘎嘎好听。悬疑探险，步步惊心！',
    coverImgUrl: '/r2/authors/ye_qiantong.png',
    creator: '主播名字',
    playCount: 128500,
});

const chapters = ref<Song[]>([]);

onMounted(() => {
    // 初始化死数据章节列表
    const data: Song[] = [];
    for (let i = 1; i <= 20; i++) {
        data.push({
            id: Number(`${bookId}${i.toString().padStart(3, '0')}`),
            name: `第${i.toString().padStart(3, '0')}集`,
            artist: bookInfo.value.creator,
            album: bookInfo.value.name,
            duration: 1000 * 60 * 8, // 8 minutes
            cover: bookInfo.value.coverImgUrl,
            url: '', // 若有真实音频地址可配在此处
        });
    }
    chapters.value = data;
});

// 计算是否播放过
const hasPlayedBefore = computed(() => {
    const history = audioStore.audio.playHistory || [];
    // 只要有任何一集在这个书的章节列表里，就认为播放过
    return history.some((h) => chapters.value.some((c) => c.id === h.id));
});

const handlePlay = () => {
    if (chapters.value.length === 0) return;
    
    setPlaylist(chapters.value, 0);

    if (hasPlayedBefore.value) {
        const history = audioStore.audio.playHistory || [];
        // 找到最后播放的这一本书的章节
        const lastPlayed = [...history].reverse().find((h) => chapters.value.some((c) => c.id === h.id));
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
    <div class="w-full overflow-x-hidden p-4 h-full flex flex-col">
        <div class="flex flex-col gap-3 flex-1 overflow-hidden">
            <div class="relative shrink-0">
                <div class="absolute inset-0 overflow-hidden rounded-3xl">
                    <img
                        :src="bookInfo.coverImgUrl"
                        class="h-full w-full scale-150 object-cover opacity-30 blur-3xl"
                    />
                    <div class="to-overlay absolute inset-0 bg-linear-to-b from-transparent via-transparent"></div>
                </div>

                <div class="relative z-10 overflow-hidden rounded-3xl">
                    <div class="glass-container">
                        <div class="flex flex-col gap-6 p-6 lg:flex-row lg:gap-10 relative">
                            <!-- 返回按钮 -->
                            <div class="absolute top-4 left-4 z-20">
                                <Button variant="ghost" size="icon-md" rounded="full" @click="goBack">
                                    <span class="icon-[mdi--arrow-left] h-6 w-6"></span>
                                </Button>
                            </div>

                            <div class="group relative mx-auto w-56 shrink-0 lg:mx-0 lg:ml-12 lg:w-64">
                                <div class="ring-glass aspect-square overflow-hidden rounded-3xl shadow-2xl ring-1">
                                    <LazyImage
                                        :src="bookInfo.coverImgUrl"
                                        alt="cover"
                                        imgClass="h-full w-full object-cover"
                                        wrapperClass="h-full w-full"
                                    />
                                </div>
                            </div>

                            <div class="flex min-w-0 flex-1 flex-col justify-center text-center lg:text-left pt-8 lg:pt-0">
                                <h1 class="text-primary mb-4 line-clamp-2 text-xl leading-tight font-bold lg:text-4xl">
                                    {{ bookInfo.name }}
                                </h1>

                                <div class="mb-5 flex items-center justify-center gap-3 lg:justify-start">
                                    <span class="text-primary font-medium">{{ bookInfo.creator }}</span>
                                </div>

                                <p class="text-primary/70 mb-6 line-clamp-2 text-sm leading-relaxed lg:text-base">
                                    {{ bookInfo.description }}
                                </p>

                                <div class="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
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
            <section class="flex-1 overflow-hidden mt-2 relative min-h-[300px]">
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
