<script setup lang="ts">
// ==========================================
// 导入外部依赖和模块
// ==========================================
// 导入 API 接口请求方法：书单详情、书单所有章节、新版评论、搜索
import { usePlayActions } from '@/composables/usePlayActions';
// 导入项目通用的类型定义
import { PlaylistInfo, PlaylistSong, CommentItem } from '@/typings';
// 导入 UI 组件：图片懒加载、按钮、标签组
import LazyImage from '@/components/Ui/LazyImage.vue';
import Button from '@/components/Ui/Button.vue';
import TabGroup from '@/components/Ui/TabGroup.vue';
// 导入格式化工具函数（将数字转换为带单位的字符串，如万、亿）
import { formatCount } from '@/utils/time';
import { getValidCover } from '@/utils';
// 导入国际化插件 hooks
import { useI18n } from 'vue-i18n';
import { getAudiobookDetail, getAudiobookEpisodes } from '@/api';

// ==========================================
// 路由与参数获取
// ==========================================
// 获取当前路由实例，用于读取 URL 中的参数
const route = useRoute();
// 获取当前页面 URL 参数中的书单/歌单 ID
const playlistId = route.params.id;

// ==========================================
// 接口与状态定义
// ==========================================
// 相似书单/歌单的数据类型接口
interface SimilarPlaylist {
    id: number | string; // 书单 ID
    name: string; // 书单名称
    coverImgUrl: string; // 封面图片地址
    trackCount?: number; // 包含的章节(歌曲)数
    playCount?: number; // 播放量
    creator?: { nickname: string }; // 创建者信息
}

// 页面整体状态管理的类型接口
interface PlaylistState {
    activeTab: 'songs' | 'comments' | 'similar'; // 当前选中的 Tab：章节列表 / 评论 / 相似推荐
    playlistInfo: PlaylistInfo; // 书单详细信息（封面、标题、作者等）
    isCollected: boolean; // 是否已收藏（用于前端状态模拟切换）
    songs: SongData[]; // 章节(歌曲)列表数据
    newComment: string; // 用户输入的待发表新评论内容
    comments: CommentItem[]; // 评论列表数据
    isPageLoading: boolean; // 页面是否正在加载中（控制骨架屏的显示和隐藏）
    similarPlaylists: SimilarPlaylist[]; // 相似书单推荐列表
}

// ==========================================
// 状态初始化与解构
// ==========================================
// 使用 reactive 定义页面响应式状态，集中管理页面数据
const state = reactive<PlaylistState>({
    activeTab: 'songs', // 默认显示章节列表
    playlistInfo: {} as PlaylistInfo,
    isCollected: false,
    songs: [],
    newComment: '',
    comments: [],
    isPageLoading: true, // 初始进入时设为 true，展示骨架屏
    similarPlaylists: [],
});
// 将状态解构为 ref 形式，以便在 Vue 模板中直接使用对应的变量（如 activeTab、songs 等）
const { activeTab, playlistInfo, songs, newComment, comments, isPageLoading, similarPlaylists } =
    toRefs(state);

// 获取播放相关的全局操作方法：播放全部，随机播放
const { playAll: playAllAction, shufflePlay: shufflePlayAction } = usePlayActions();
// 获取国际化翻译函数
const { t } = useI18n();

// ==========================================
// 辅助变量与方法
// ==========================================
// 预定义渐变色背景数组，用于在没有图片（如用户头像）时作为占位背景色
const gradients: string[] = ['from-purple-500 to-pink-500'];
// 预定义符号/emoji 数组，用于装饰性展示
const emojis: string[] = ['🎵', '🎶', '♪', '♫', '🎼'];

// 随机从预定义渐变色中选取一个颜色类的函数
const pickGradient = (): string => gradients[Math.floor(Math.random() * gradients.length)];

// ==========================================
// 数据加载方法
// ==========================================

/**
 * 加载书单/歌单的详情信息以及包含的所有章节(歌曲)列表
 * @param {number} id 书单 ID
 */
const loadPlaylist = async (id: number) => {
    try {
        const [detailRes, tracksRes] = await Promise.all([
            getAudiobookDetail(String(id)),
            getAudiobookEpisodes(String(id)),
        ]);

        const detail = detailRes?.data;
        if (detail) {
            state.playlistInfo = {
                name: detail.title || detail.title_zh,
                description: detail.description,
                creator: (detail.authors && detail.authors[0]) || '佚名',
                creatorAvatar: '',
                createTime: detail.create_time ? new Date(detail.create_time).toLocaleDateString() : '',
                songCount: detail.episode_count,
                playCount: 0,
                likes: '0',
                category: detail.category,
                emoji: state.playlistInfo.emoji,
                gradient: pickGradient(),
                coverImgUrl: getValidCover(detail.cover_url, 'book'),
            };
        }

        const episodes = Array.isArray(tracksRes) ? tracksRes : tracksRes?.data || [];
        state.songs = episodes.map((ep: any, index: number) => ({
            id: String(id) + '_' + index,
            name: ep.title || `第${ep.episode_number}集`,
            artist: (detail?.authors && detail.authors[0]) || '佚名',
            album: detail?.title || detail?.title_zh || '',
            duration: 0,
            cover: getValidCover(detail?.cover_url, 'book'),
            url: ep.audio_url,
            fee: 0,
        }));
    } catch {
        // error handling
    } finally {
        state.isPageLoading = false;
    }
};

/**
 * 加载当前书单下的评论数据
 * @param {number} id 书单 ID
 */
const loadComments = async (id: number) => {
    try {
        // 发送新版评论接口请求：type=2 (代表歌单/书单类型), sortType=1 (按时间降序排序)
        // const res = await commentNew({ id, type: 2, sortType: 1, pageNo: 1, pageSize: 10 });
        //         // // 兼容不同的后端数据返回结构
        // const list = (res as any)?.data?.comments || (res as any)?.comments || [];
        // if (Array.isArray(list)) {
        //     // 将原始评论数据映射为前端 UI 所需的 CommentItem 结构
        //     state.comments = list.map((c: any, i: number) => ({
        //         username: c?.user?.nickname || t('comments.user'),
        //         avatarGradient: gradients[i % gradients.length], // 给没有头像的用户分配一个随机渐变背景色
        //         time: c?.time ? new Date(c.time).toLocaleString() : '', // 时间戳转本地易读字符串
        //         content: c?.content || '',
        //         likes: c?.likedCount || 0, // 点赞数
        //         avatarUrl: c?.user?.avatarUrl || '',
        //         // 嵌套解析并映射"回复(引用的评论)"信息
        //         replies: (c?.beReplied || []).map((r: any) => ({
        //             username: r?.user?.nickname || t('comments.user'),
        //             avatarUrl: r?.user?.avatarUrl || '',
        //             avatarGradient: gradients[(i + 1) % gradients.length],
        //             time: '', // 原始接口如果未返回回复的时间，则留空
        //             content: r?.content || '',
        //         })),
        //     }));
        // }
    } catch {}
};

/**
 * 加载相似的书单/歌单推荐（实现方式：通过搜索当前书单名称的方式模拟相似推荐）
 * @param {string} name 当前书单的名称
 */
const loadSimilarPlaylists = async (name: string) => {
    // try {
    //     // 调用搜索接口：type=1000 代表专门搜索歌单/书单
    //     const res = await search({ keywords: name, type: 1000 });
    //     // 从搜索结果中提取并转换数据，限制最多取 12 个
    //     const { playlists } = transformSearchPlaylists(res as Record<string, unknown>, 12);
    //     // 映射并保存到状态的相似推荐列表中
    //     state.similarPlaylists = playlists.map(pl => ({
    //         id: pl.id,
    //         name: pl.name,
    //         coverImgUrl: pl.coverImgUrl,
    //         trackCount: pl.trackCount,
    //         playCount: pl.playCount,
    //     }));
    // } catch {}
};

// ==========================================
// 生命周期与监听器
// ==========================================

// 组件初始化挂载时（首次进入页面），解析 URL 中的 ID 并加载对应数据
onMounted(() => {
    // 初始化加载播放列表
    const idNum = Number(playlistId.value);
    if (!Number.isNaN(idNum) && idNum > 0) {
        state.isPageLoading = true; // 显示骨架屏
        loadPlaylist(idNum);
        loadComments(idNum);
    }
});

// 监听当前书单名称的变化
// 场景说明：当书单详情加载完毕并获取到名称后，以此名称作为关键词去请求获取"相似推荐"数据。
watch(
    () => state.playlistInfo.name,
    name => {
        if (name) loadSimilarPlaylists(name);
    }
);

// ==========================================
// 用户交互与操作方法
// ==========================================

/**
 * 提交新的评论
 * 注意：由于没有真实的用户登录状态，此处仅做前端的纯 UI 交互模拟，不会真实调用接口发送到服务器。
 */
const submitComment = () => {
    if (!state.newComment.trim()) return; // 拦截并忽略纯空格的空内容
    const comment = {
        username: t('common.me'), // 显示昵称为"我"
        avatar: t('common.me'),
        avatarGradient: 'from-pink-400 to-purple-500',
        time: t('common.justNow'), // 发表时间显示为"刚刚"
        content: state.newComment, // 用户输入的内容
        likes: 0,
        avatarUrl: '',
        replies: [],
    };
    // 将新构造的评论对象插入到评论列表的最前方
    state.comments.unshift(comment);
    state.newComment = ''; // 提交完成后清空输入框
};

/**
 * 播放全部：将当前列表的所有章节加入全局播放器，并从第一项开始播放
 */
const playAll = () => playAllAction(state.songs);

/**
 * 随机播放：将当前列表的所有章节加入全局播放器，并启用打乱的随机顺序进行播放
 */
const shufflePlay = () => shufflePlayAction(state.songs);

/**
 * 切换收藏状态（前端纯 UI 交互模拟，无真实接口调用）
 */
const toggleCollect = () => {
    state.isCollected = !state.isCollected;
};

/**
 * 分享操作：优先调用设备原生的分享面板（如果浏览器支持），否则降级将当前页面链接复制到系统剪贴板
 */
const sharePlaylist = async () => {
    const url = location.origin + location.pathname + `#/playlist/${playlistId}`;
    const title = String((state.playlistInfo as any)?.name || t('home.playlistFallback'));
    const text = String((state.playlistInfo as any)?.description || '');
    try {
        if (navigator.share) {
            // 如果设备/浏览器支持 Web Share API（如移动端设备常用）
            await navigator.share({ title, text, url });
        } else {
            // 否则降级使用剪贴板 API 复制链接
            await navigator.clipboard.writeText(url);
        }
    } catch {}
};

// ==========================================
// Tab 配置与计算属性
// ==========================================

// 定义页面主体内容区 Tab 选项卡的静态配置（包含唯一键名 key、用于多语言翻译的 labelKey、图标名）
const tabs = [
    { key: 'songs', labelKey: 'playlist.tabs.songs', icon: 'icon-[mdi--music-note]' },
    { key: 'comments', labelKey: 'playlist.tabs.comments', icon: 'icon-[mdi--comment-text]' },
    { key: 'similar', labelKey: 'playlist.tabs.similar', icon: 'icon-[mdi--playlist-music]' },
] as const;

// 动态计算属性：基于当前状态中各数组的数据长度，拼接出每个 Tab 标题上需要显示的数量徽标
// 例如："章节 (50)"、"评论 (12)"
const tabsWithCount = computed(() =>
    tabs.map(tab => ({
        ...tab,
        count:
            tab.key === 'songs'
                ? songs.value.length
                : tab.key === 'comments'
                  ? comments.value.length
                  : similarPlaylists.value.length,
    }))
);
</script>

<template>
    <div class="w-full overflow-x-hidden p-4">
        <PageSkeleton v-if="isPageLoading" :sections="['hero', 'list']" :list-count="12" />
        <template v-else>
            <div class="flex flex-col gap-3">
                <!-- 头部区域 -->
                <div class="relative">
                    <!-- 背景模糊图片 -->
                    <div class="absolute inset-0 overflow-hidden rounded-3xl">
                        <img
                            :src="playlistInfo.coverImgUrl"
                            class="h-full w-full scale-150 object-cover opacity-30 blur-3xl"
                        />
                        <div
                            class="to-overlay absolute inset-0 bg-linear-to-b from-transparent via-transparent"
                        ></div>
                    </div>

                    <!-- 内容区域 -->
                    <div class="relative z-10 overflow-hidden rounded-3xl">
                        <div class="glass-container">
                            <div class="flex flex-col gap-6 p-6 lg:flex-row lg:gap-10">
                                <!-- 封面 -->
                                <div class="group relative mx-auto w-56 shrink-0 lg:mx-0 lg:w-72">
                                    <div
                                        class="ring-glass aspect-square overflow-hidden rounded-3xl shadow-2xl ring-1"
                                    >
                                        <LazyImage
                                            :src="playlistInfo.coverImgUrl"
                                            :alt="$t('components.songList.coverAlt')"
                                            imgClass="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            wrapperClass="h-full w-full"
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="none"
                                        class="absolute! inset-0 flex items-center justify-center rounded-3xl opacity-0 transition-all duration-300 group-hover:opacity-100"
                                        @click="playAll"
                                    >
                                        <div
                                            class="flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-r from-pink-500 to-purple-600 text-white shadow-2xl transition-transform hover:scale-110"
                                        >
                                            <span class="icon-[mdi--play] h-10 w-10"></span>
                                        </div>
                                    </Button>
                                </div>

                                <!-- 信息区域 -->
                                <div
                                    class="flex min-w-0 flex-1 flex-col justify-center text-center lg:text-left"
                                >
                                    <!-- 标题 -->
                                    <h1
                                        class="text-primary mb-4 line-clamp-2 text-xl leading-tight font-bold lg:text-4xl xl:text-5xl"
                                    >
                                        {{ playlistInfo.name }}
                                    </h1>

                                    <!-- 创建者信息 -->
                                    <div
                                        class="mb-5 flex items-center justify-center gap-3 lg:justify-start"
                                    >
                                        <img
                                            v-if="playlistInfo.creatorAvatar"
                                            :src="playlistInfo.creatorAvatar"
                                            class="ring-glass h-8 w-8 rounded-full ring-2"
                                        />
                                        <span class="text-primary font-medium">{{
                                            playlistInfo.creator
                                        }}</span>
                                        <span class="text-primary/40">•</span>
                                        <span class="text-primary/60 text-sm">{{
                                            playlistInfo.createTime
                                        }}</span>
                                        <span class="text-primary/40">•</span>
                                        <!-- 分类标签 -->
                                        <span
                                            class="glass-button accent-gradient px-4 py-1.5 text-xs font-medium text-white"
                                        >
                                            {{ playlistInfo.category }}
                                        </span>
                                    </div>

                                    <!-- 描述 -->
                                    <p
                                        v-if="playlistInfo.description"
                                        class="text-primary/70 mb-6 line-clamp-2 text-sm leading-relaxed lg:text-base"
                                        :title="playlistInfo.description"
                                    >
                                        {{ playlistInfo.description }}
                                    </p>

                                    <!-- 统计信息 -->
                                    <div
                                        class="mb-6 flex flex-wrap items-center justify-center gap-6 lg:justify-start"
                                    >
                                        <div class="flex items-center gap-2">
                                            <span
                                                class="icon-[mdi--music-note] text-primary/60 h-5 w-5"
                                            ></span>
                                            <span class="text-primary font-medium">
                                                {{
                                                    $t(
                                                        'commonUnits.songsShort',
                                                        playlistInfo.songCount
                                                    )
                                                }}
                                            </span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <span
                                                class="icon-[mdi--play-circle-outline] text-primary/60 h-5 w-5"
                                            ></span>
                                            <span class="text-primary font-medium">
                                                {{ formatCount(playlistInfo.playCount || 0) }}
                                                {{ $t('common.stats.plays') }}
                                            </span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <span
                                                class="icon-[mdi--heart] h-5 w-5 text-red-400"
                                            ></span>
                                            <span class="text-primary font-medium">
                                                {{ formatCount(Number(playlistInfo.likes) || 0) }}
                                                {{ $t('common.stats.favorites') }}
                                            </span>
                                        </div>
                                    </div>

                                    <!-- 操作按钮 -->
                                    <div
                                        class="flex flex-wrap items-center justify-center gap-3 lg:justify-start"
                                    >
                                        <Button
                                            variant="solid"
                                            size="md"
                                            rounded="full"
                                            class="px-8 py-3 shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/40"
                                            @click="playAll"
                                        >
                                            <span class="icon-[mdi--play] mr-2 h-5 w-5"></span>
                                            {{ $t('actions.playAll') }}
                                        </Button>
                                        <Button
                                            variant="soft"
                                            size="md"
                                            rounded="full"
                                            class="px-6 py-3"
                                            @click="shufflePlay"
                                        >
                                            <span class="icon-[mdi--shuffle] mr-2 h-5 w-5"></span>
                                            {{ $t('actions.shufflePlay') }}
                                        </Button>
                                        <div class="flex items-center gap-3">
                                            <Button
                                                variant="soft"
                                                size="icon-md"
                                                rounded="full"
                                                class="h-11 w-11"
                                                :class="{
                                                    'bg-red-500/20 text-red-400 hover:bg-red-500/30':
                                                        state.isCollected,
                                                }"
                                                @click="toggleCollect"
                                                :title="
                                                    state.isCollected
                                                        ? $t('common.uncollect')
                                                        : $t('common.collect')
                                                "
                                            >
                                                <span
                                                    :class="
                                                        state.isCollected
                                                            ? 'icon-[mdi--heart]'
                                                            : 'icon-[mdi--heart-outline]'
                                                    "
                                                    class="h-5 w-5"
                                                ></span>
                                            </Button>
                                            <Button
                                                variant="soft"
                                                size="icon-md"
                                                rounded="full"
                                                class="h-11 w-11"
                                                @click="sharePlaylist"
                                                :title="$t('common.share')"
                                            >
                                                <span
                                                    class="icon-[mdi--share-variant] h-5 w-5"
                                                ></span>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 主内容区域 -->
                <!-- Tabs 工具栏 -->
                <div class="flex items-center justify-between">
                    <TabGroup v-model="activeTab" :tabs="tabsWithCount" class="w-full" size="md" />
                </div>

                <!-- 歌曲列表 -->
                <section v-show="activeTab === 'songs'" class="h-full overflow-hidden">
                    <SongList :songs="songs" :show-header="true" />
                </section>

                <!-- 评论区 -->
                <section v-show="activeTab === 'comments'" class="animate-fade-in">
                    <div class="glass-card overflow-hidden">
                        <!-- 发表评论 -->
                        <div class="border-glass border-b p-6">
                            <div class="flex gap-4">
                                <div
                                    class="accent-gradient flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-semibold text-white shadow-md"
                                >
                                    {{ $t('common.me') }}
                                </div>
                                <div class="flex-1">
                                    <textarea
                                        v-model="newComment"
                                        :placeholder="$t('comments.placeholder')"
                                        class="text-primary glass-card placeholder-glass-50 border-glass w-full resize-none rounded-xl border p-4 text-sm transition-all focus:border-pink-400/50 focus:ring-2 focus:ring-pink-400/20 focus:outline-none"
                                        rows="3"
                                    ></textarea>
                                    <div class="mt-3 flex items-center justify-end">
                                        <Button
                                            variant="gradient"
                                            size="md"
                                            rounded="full"
                                            class="px-6 py-2.5 shadow-lg transition-all hover:shadow-xl"
                                            :disabled="!newComment.trim()"
                                            @click="submitComment"
                                        >
                                            {{ $t('comments.publish') }}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 评论列表 -->
                        <div v-if="comments.length" class="divide-glass divide-y">
                            <div
                                v-for="(comment, index) in comments"
                                :key="index"
                                class="hover:bg-hover-glass p-6 transition-colors"
                            >
                                <div class="flex gap-4">
                                    <img
                                        v-if="comment.avatarUrl"
                                        :src="comment.avatarUrl"
                                        class="ring-glass h-11 w-11 shrink-0 rounded-full ring-2"
                                    />
                                    <div
                                        v-else
                                        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-linear-to-br text-sm font-semibold text-white"
                                        :class="comment.avatarGradient"
                                    >
                                        {{ comment.username.charAt(0) }}
                                    </div>

                                    <div class="min-w-0 flex-1">
                                        <div class="mb-2 flex items-center gap-3">
                                            <span class="text-primary text-sm font-semibold">{{
                                                comment.username
                                            }}</span>
                                            <span class="text-primary/50 text-xs">{{
                                                comment.time
                                            }}</span>
                                        </div>

                                        <p class="text-primary/80 mb-4 text-sm leading-relaxed">
                                            {{ comment.content }}
                                        </p>

                                        <div class="flex items-center gap-5 text-xs">
                                            <Button
                                                variant="ghost"
                                                size="none"
                                                class="text-primary/60 hover:text-primary flex items-center gap-1.5 transition-colors"
                                                icon="icon-[mdi--thumb-up-outline]"
                                                icon-class="h-4 w-4"
                                            >
                                                <span class="font-medium">{{
                                                    comment.likes || ''
                                                }}</span>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="none"
                                                class="text-primary/60 hover:text-primary flex items-center gap-1.5 transition-colors"
                                                icon="icon-[mdi--reply]"
                                                icon-class="h-4 w-4"
                                            >
                                                <span class="font-medium">{{
                                                    $t('comments.reply')
                                                }}</span>
                                            </Button>
                                        </div>

                                        <!-- 回复列表 -->
                                        <div
                                            v-if="comment.replies?.length"
                                            class="glass-card mt-4 space-y-3 rounded-xl p-4"
                                        >
                                            <div
                                                v-for="(reply, ri) in comment.replies"
                                                :key="ri"
                                                class="flex gap-3"
                                            >
                                                <img
                                                    v-if="reply.avatarUrl"
                                                    :src="reply.avatarUrl"
                                                    class="ring-glass h-8 w-8 shrink-0 rounded-full ring-1"
                                                />
                                                <div class="min-w-0 flex-1">
                                                    <span
                                                        class="text-primary text-xs font-semibold"
                                                        >{{ reply.username }}</span
                                                    >
                                                    <p
                                                        class="text-primary/70 mt-1 text-xs leading-relaxed"
                                                    >
                                                        {{ reply.content }}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 空状态 -->
                        <div v-else class="flex flex-col items-center justify-center py-20">
                            <span
                                class="icon-[mdi--comment-off-outline] text-primary/20 mb-4 h-16 w-16"
                            ></span>
                            <p class="text-primary/50 text-sm font-medium">
                                {{ $t('comments.empty') }}
                            </p>
                        </div>

                        <!-- 加载更多 -->
                        <div
                            v-if="comments.length >= 10"
                            class="border-glass border-t p-5 text-center"
                        >
                            <Button
                                variant="ghost"
                                size="sm"
                                class="text-primary/60 hover:text-primary text-sm font-medium transition-colors"
                            >
                                {{ $t('comments.loadMore') }}
                            </Button>
                        </div>
                    </div>
                </section>

                <!-- 相似歌单 -->
                <section v-show="activeTab === 'similar'" class="animate-fade-in">
                    <div
                        v-if="similarPlaylists.length"
                        class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                    >
                        <router-link
                            v-for="pl in similarPlaylists"
                            :key="pl.id"
                            :to="`/playlist/${pl.id}`"
                            class="group"
                        >
                            <div
                                class="glass-card overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl"
                            >
                                <div class="relative aspect-square overflow-hidden">
                                    <LazyImage
                                        :src="pl.coverImgUrl"
                                        :alt="pl.name"
                                        imgClass="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        wrapperClass="h-full w-full"
                                    />
                                    <div
                                        class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100"
                                    >
                                        <div
                                            class="accent-gradient flex h-14 w-14 items-center justify-center rounded-full shadow-2xl"
                                        >
                                            <span
                                                class="icon-[mdi--play] h-7 w-7 text-white"
                                            ></span>
                                        </div>
                                    </div>
                                    <div
                                        v-if="pl.playCount"
                                        class="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md"
                                    >
                                        <span class="icon-[mdi--play] h-3.5 w-3.5"></span>
                                        {{ formatCount(pl.playCount) }}
                                    </div>
                                </div>
                                <div class="p-3">
                                    <p
                                        class="text-primary mb-1.5 line-clamp-2 text-sm leading-snug font-semibold transition-colors group-hover:text-pink-400"
                                    >
                                        {{ pl.name }}
                                    </p>
                                    <p class="text-primary/60 text-xs">
                                        {{ $t('commonUnits.songsShort', pl.trackCount || 0) }}
                                        <span v-if="pl.creator"> • {{ pl.creator.nickname }}</span>
                                    </p>
                                </div>
                            </div>
                        </router-link>
                    </div>
                    <div
                        v-else
                        class="glass-card flex flex-col items-center justify-center py-20 text-center"
                    >
                        <span
                            class="icon-[mdi--playlist-remove] text-primary/20 mb-5 h-20 w-20"
                        ></span>
                        <p class="text-primary/50 text-base font-medium">
                            {{ $t('playlist.similarEmpty') }}
                        </p>
                    </div>
                </section>
            </div>
        </template>
    </div>
</template>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(12px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
