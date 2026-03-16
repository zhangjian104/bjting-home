<script setup lang="ts">
import { gsap } from 'gsap';
import LazyImage from '@/components/Ui/LazyImage.vue';
import { formatDuration } from '@/utils/time';

interface Props {
    song: {
        id: number | string;
        name: string;
        artist: string;
        cover: string;
        duration: number;
        album?: string;
    };
    index: number;
    to?: string;
}

const props = defineProps<Props>();
const router = useRouter();
const cardRef = ref<HTMLElement | null>(null);
const coverRef = ref<HTMLElement | null>(null);

const handleClick = async (_event: MouseEvent) => {
    const targetRoute = props.to || `/book/${encodeURIComponent(String(props.song.id))}`;
    router.push(targetRoute);
};

// 悬停效果
const handleMouseEnter = () => {
    if (cardRef.value) {
        gsap.to(cardRef.value, {
            x: 4,
            duration: 0.2,
            ease: 'power2.out',
        });
    }
    if (coverRef.value) {
        gsap.to(coverRef.value, {
            scale: 1.1,
            duration: 0.3,
            ease: 'power2.out',
        });
    }
};

const handleMouseLeave = () => {
    if (cardRef.value) {
        gsap.to(cardRef.value, {
            x: 0,
            duration: 0.2,
            ease: 'power2.out',
        });
    }
    if (coverRef.value) {
        gsap.to(coverRef.value, {
            scale: 1,
            duration: 0.3,
            ease: 'power2.out',
        });
    }
};
</script>

<template>
    <div
        ref="cardRef"
        class="song-card group flex cursor-pointer items-center gap-4 rounded-xl p-4 transition-colors hover:bg-white/5"
        @click="handleClick"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
    >
        <!-- 排名 -->
        <span
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
            :class="
                index < 3
                    ? 'bg-linear-to-t from-rose-500 to-pink-600 text-white'
                    : 'bg-primary/5 text-primary/40'
            "
        >
            {{ index + 1 }}
        </span>

        <!-- 封面 -->
        <div
            ref="coverRef"
            class="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl shadow-md"
        >
            <LazyImage
                :src="song.cover + '?param=100y100'"
                alt="cover"
                img-class="h-full w-full object-cover"
            />
            <div
                class="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100"
            >
                <span class="icon-[mdi--play] h-5 w-5 text-white" />
            </div>
        </div>

        <!-- 信息 -->
        <div class="min-w-0 flex-1">
            <p
                class="text-primary truncate text-sm font-medium transition-colors group-hover:text-pink-500"
            >
                {{ song.name }}
            </p>
            <p class="text-primary/50 mt-0.5 truncate text-xs">{{ song.artist }}</p>
        </div>

        <!-- 时长 -->
        <span class="text-primary/30 shrink-0 text-xs">
            {{ formatDuration(song.duration) }}
        </span>
    </div>
</template>

<style scoped>
.song-card {
    will-change: transform;
}
</style>
