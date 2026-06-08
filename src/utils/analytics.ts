/**
 * PostHog 数据采集统一封装
 */
import posthog from 'posthog-js';
import type { RouteLocationNormalized } from 'vue-router';
import type { Song, PlayMode } from '@/stores/interface';
import {
    AnalyticsEvents,
    PlaybackSource,
    PROGRESS_MILESTONES,
    type PlaybackSourceType,
} from './analyticsEvents';

let initialized = false;

const LAST_BOOK_PLAY_KEY = 'ph_last_book_play';
const MILESTONE_DEBOUNCE_MS = 2000;

/** 当前章节已上报的进度里程碑 */
let milestoneReported = new Set<number>();
/** 上次上报 play_start 的 chapter_id */
let lastReportedChapterId: string | null = null;
/** 当前章节是否已上报 complete（单曲循环防重复） */
let chapterCompleteReported = false;
/** seek 防抖 */
let lastSeekReportAt = 0;
let lastSeekFromSeconds = 0;

/** 会话级收听统计 */
const sessionStats = {
    booksPlayed: new Set<string>(),
    chaptersStarted: 0,
    chaptersCompleted: 0,
    totalListenedSeconds: 0,
    lastTickAt: 0,
    lastTickSeconds: 0,
};

/** 路由 name → 业务内容类型 */
const ROUTE_CONTENT_TYPE: Record<string, string> = {
    home: 'home',
    book: 'audiobook',
    playlist: 'playlist',
    artist: 'narrator',
    artists: 'narrator_list',
    album: 'album',
    song: 'chapter',
    search: 'search',
    charts: 'charts',
    'my-music': 'library',
    recent: 'recent',
    likes: 'likes',
    settings: 'settings',
    'local-music': 'local_music',
    'new-albums': 'new_albums',
};

/** 是否应在当前环境上报（仅 production 构建） */
export const isAnalyticsEnabled = (): boolean =>
    import.meta.env.PROD && Boolean(import.meta.env.VITE_POSTHOG_KEY);

const isDebugMode = (): boolean => import.meta.env.VITE_ANALYTICS_DEBUG === 'true';

const capture = (event: string, properties?: Record<string, unknown>): void => {
    if (!initialized) return;
    if (isDebugMode()) {
        console.debug('[analytics]', event, properties);
    }
    posthog.capture(event, {
        environment: import.meta.env.MODE,
        ...properties,
    });
};

/** 初始化 PostHog（dev 环境跳过） */
export const initAnalytics = (): void => {
    if (!isAnalyticsEnabled() || initialized) return;

    const apiKey = import.meta.env.VITE_POSTHOG_KEY!;
    const apiHost = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

    posthog.init(apiKey, {
        api_host: apiHost,
        capture_pageview: false,
        capture_pageleave: true,
        persistence: 'localStorage',
        autocapture: true,
        disable_session_recording: false,
        defaults: '2026-01-30',
    });

    posthog.startSessionRecording();
    initialized = true;
    bindSessionLifecycle();
};

const bindSessionLifecycle = (): void => {
    if (typeof document === 'undefined') return;
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            flushSessionSummary();
        }
    });
    window.addEventListener('pagehide', () => {
        flushSessionSummary();
    });
};

const buildPageProperties = (
    to: RouteLocationNormalized,
    from?: RouteLocationNormalized
): Record<string, unknown> => {
    const routeName = to.name != null ? String(to.name) : '';
    const contentId = to.params.id != null ? String(to.params.id) : undefined;

    return {
        $current_url: window.location.href,
        route_name: routeName,
        path: to.path,
        full_path: to.fullPath,
        content_type: ROUTE_CONTENT_TYPE[routeName] ?? (routeName || 'unknown'),
        content_id: contentId,
        book_id: routeName === 'book' ? contentId : undefined,
        referrer_route: from?.name != null ? String(from.name) : undefined,
        referrer_path: from?.path,
        is_mobile: window.innerWidth <= 768,
        viewport_width: window.innerWidth,
    };
};

export const trackPageView = (
    to: RouteLocationNormalized,
    from?: RouteLocationNormalized
): void => {
    capture(AnalyticsEvents.PAGE_VIEW, buildPageProperties(to, from));
};

export const trackEvent = (name: string, properties?: Record<string, unknown>): void => {
    capture(name, properties);
};

export const trackBookDetailView = (props: {
    book_id: string;
    book_title: string;
    chapter_count: number;
    has_played_before: boolean;
}): void => {
    capture(AnalyticsEvents.BOOK_DETAIL_VIEW, {
        ...props,
        is_mobile: window.innerWidth <= 768,
    });
};

export const trackContentCardClick = (props: {
    content_type: string;
    content_id: string | number;
    section: string;
    position?: number;
}): void => {
    capture(AnalyticsEvents.CONTENT_CARD_CLICK, {
        content_type: props.content_type,
        content_id: String(props.content_id),
        section: props.section,
        position: props.position,
        is_mobile: window.innerWidth <= 768,
    });
};

export const trackPlayAll = (props: {
    book_id?: string;
    chapter_count: number;
    source: PlaybackSourceType;
}): void => {
    capture(AnalyticsEvents.AUDIOBOOK_PLAY_ALL, {
        ...props,
        is_mobile: window.innerWidth <= 768,
    });
};

/** 从 Song + 播放上下文构建统一属性 */
export const buildSongProperties = (
    song: Song,
    extra: {
        chapter_index?: number;
        duration_seconds?: number;
        played_seconds?: number;
        progress_percent?: number;
        source?: PlaybackSourceType;
        play_mode?: PlayMode;
        book_id?: string;
    } = {}
): Record<string, unknown> => {
    const bookId =
        extra.book_id ??
        (song.albumId != null ? String(song.albumId) : undefined);

    return {
        book_id: bookId,
        book_title: song.album,
        chapter_id: String(song.id),
        chapter_name: song.name,
        chapter_index: extra.chapter_index,
        narrator: song.artist,
        duration_seconds: extra.duration_seconds,
        played_seconds: extra.played_seconds,
        progress_percent: extra.progress_percent,
        source: extra.source ?? PlaybackSource.UNKNOWN,
        play_mode: extra.play_mode,
        is_local: Boolean(song.isLocal),
        is_mobile: window.innerWidth <= 768,
    };
};

const resetChapterTracking = (): void => {
    milestoneReported = new Set();
    chapterCompleteReported = false;
};

const calcProgressPercent = (played: number, duration: number): number => {
    if (duration <= 0) return 0;
    return Math.min(100, Math.round((played / duration) * 100));
};

const tickListeningTime = (playedSeconds: number): void => {
    if (sessionStats.lastTickAt > 0 && playedSeconds >= sessionStats.lastTickSeconds) {
        sessionStats.totalListenedSeconds += playedSeconds - sessionStats.lastTickSeconds;
    }
    sessionStats.lastTickAt = Date.now();
    sessionStats.lastTickSeconds = playedSeconds;
};

export const onAudioPlaying = (
    song: Song,
    ctx: {
        chapter_index: number;
        duration_seconds: number;
        source: PlaybackSourceType;
        play_mode: PlayMode;
        book_id?: string;
    }
): void => {
    const chapterId = String(song.id);
    if (lastReportedChapterId === chapterId) return;

    lastReportedChapterId = chapterId;
    resetChapterTracking();

    const props = buildSongProperties(song, {
        chapter_index: ctx.chapter_index,
        duration_seconds: ctx.duration_seconds,
        played_seconds: 0,
        progress_percent: 0,
        source: ctx.source,
        play_mode: ctx.play_mode,
        book_id: ctx.book_id,
    });

    capture(AnalyticsEvents.AUDIOBOOK_PLAY_START, props);
    sessionStats.chaptersStarted += 1;
    if (props.book_id) {
        sessionStats.booksPlayed.add(String(props.book_id));
        checkReturnToBook(String(props.book_id));
        updateListeningPersonProps({
            last_book_id: String(props.book_id),
            last_chapter_id: chapterId,
        });
    }
};

export const onAudioPause = (
    song: Song,
    ctx: {
        chapter_index: number;
        duration_seconds: number;
        played_seconds: number;
        source: PlaybackSourceType;
        play_mode: PlayMode;
        book_id?: string;
    }
): void => {
    tickListeningTime(ctx.played_seconds);
    capture(
        AnalyticsEvents.AUDIOBOOK_PLAY_PAUSE,
        buildSongProperties(song, {
            ...ctx,
            progress_percent: calcProgressPercent(ctx.played_seconds, ctx.duration_seconds),
        })
    );
};

export const onChapterComplete = (
    song: Song,
    ctx: {
        chapter_index: number;
        duration_seconds: number;
        played_seconds: number;
        source: PlaybackSourceType;
        play_mode: PlayMode;
        book_id?: string;
    }
): void => {
    if (chapterCompleteReported) return;
    chapterCompleteReported = true;

    tickListeningTime(ctx.played_seconds);
    sessionStats.chaptersCompleted += 1;

    capture(AnalyticsEvents.AUDIOBOOK_CHAPTER_COMPLETE, {
        ...buildSongProperties(song, {
            ...ctx,
            progress_percent: calcProgressPercent(ctx.played_seconds, ctx.duration_seconds),
        }),
        is_natural_end: true,
    });

    if (ctx.book_id) {
        const stored = getPersonChapterCount();
        updateListeningPersonProps({
            last_book_id: ctx.book_id,
            last_chapter_id: String(song.id),
            total_chapters_completed: stored + 1,
        });
        persistLastBookPlay(ctx.book_id);
    }
};

export const onChapterSkip = (
    song: Song,
    ctx: {
        chapter_index: number;
        duration_seconds: number;
        played_seconds: number;
        source: PlaybackSourceType;
        play_mode: PlayMode;
        book_id?: string;
        direction: 'next' | 'previous';
    }
): void => {
    tickListeningTime(ctx.played_seconds);
    capture(AnalyticsEvents.AUDIOBOOK_CHAPTER_SKIP, {
        ...buildSongProperties(song, {
            chapter_index: ctx.chapter_index,
            duration_seconds: ctx.duration_seconds,
            played_seconds: ctx.played_seconds,
            progress_percent: calcProgressPercent(ctx.played_seconds, ctx.duration_seconds),
            source: ctx.source,
            play_mode: ctx.play_mode,
            book_id: ctx.book_id,
        }),
        direction: ctx.direction,
    });
    resetChapterTracking();
    lastReportedChapterId = null;
};

export const onProgressMilestone = (
    song: Song,
    milestone: number,
    ctx: {
        chapter_index: number;
        duration_seconds: number;
        played_seconds: number;
        source: PlaybackSourceType;
        play_mode: PlayMode;
        book_id?: string;
    }
): void => {
    if (milestoneReported.has(milestone)) return;
    milestoneReported.add(milestone);

    capture(AnalyticsEvents.AUDIOBOOK_PROGRESS_MILESTONE, {
        ...buildSongProperties(song, {
            ...ctx,
            progress_percent: calcProgressPercent(ctx.played_seconds, ctx.duration_seconds),
        }),
        milestone,
    });
};

export const checkProgressMilestones = (
    song: Song,
    playedSeconds: number,
    durationSeconds: number,
    ctx: {
        chapter_index: number;
        source: PlaybackSourceType;
        play_mode: PlayMode;
        book_id?: string;
    }
): void => {
    if (durationSeconds <= 0) return;
    const percent = calcProgressPercent(playedSeconds, durationSeconds);

    for (const milestone of PROGRESS_MILESTONES) {
        if (percent >= milestone && !milestoneReported.has(milestone)) {
            onProgressMilestone(song, milestone, {
                chapter_index: ctx.chapter_index,
                duration_seconds: durationSeconds,
                played_seconds: playedSeconds,
                source: ctx.source,
                play_mode: ctx.play_mode,
                book_id: ctx.book_id,
            });
        }
    }
};

export const onAudioSeek = (
    song: Song,
    fromSeconds: number,
    toSeconds: number,
    ctx: {
        chapter_index: number;
        duration_seconds: number;
        source: PlaybackSourceType;
        play_mode: PlayMode;
        book_id?: string;
    }
): void => {
    const now = Date.now();
    if (now - lastSeekReportAt < MILESTONE_DEBOUNCE_MS) return;
    lastSeekReportAt = now;
    lastSeekFromSeconds = fromSeconds;

    capture(AnalyticsEvents.AUDIOBOOK_SEEK, {
        ...buildSongProperties(song, {
            chapter_index: ctx.chapter_index,
            duration_seconds: ctx.duration_seconds,
            source: ctx.source,
            play_mode: ctx.play_mode,
            book_id: ctx.book_id,
        }),
        from_seconds: fromSeconds,
        to_seconds: toSeconds,
    });
};

export const onPlayError = (
    song: Song,
    errorType: string,
    ctx: {
        chapter_index: number;
        source: PlaybackSourceType;
        play_mode: PlayMode;
        book_id?: string;
    }
): void => {
    capture(AnalyticsEvents.AUDIOBOOK_PLAY_ERROR, {
        ...buildSongProperties(song, ctx),
        error_type: errorType,
    });
};

const getPersonChapterCount = (): number => {
    try {
        const raw = localStorage.getItem('ph_total_chapters_completed');
        return raw ? Number(raw) : 0;
    } catch {
        return 0;
    }
};

export const updateListeningPersonProps = (props: {
    last_book_id?: string;
    last_chapter_id?: string;
    total_chapters_completed?: number;
}): void => {
    if (!initialized) return;
    if (props.total_chapters_completed != null) {
        try {
            localStorage.setItem(
                'ph_total_chapters_completed',
                String(props.total_chapters_completed)
            );
        } catch {
            /* ignore */
        }
    }
    posthog.register({
        last_book_id: props.last_book_id,
        last_chapter_id: props.last_chapter_id,
        total_chapters_completed: props.total_chapters_completed,
    });
};

const persistLastBookPlay = (bookId: string): void => {
    try {
        localStorage.setItem(
            LAST_BOOK_PLAY_KEY,
            JSON.stringify({ book_id: bookId, at: Date.now() })
        );
    } catch {
        /* ignore */
    }
};

export const checkReturnToBook = (bookId: string): void => {
    try {
        const raw = localStorage.getItem(LAST_BOOK_PLAY_KEY);
        if (!raw) return;
        const prev = JSON.parse(raw) as { book_id: string; at: number };
        if (prev.book_id !== bookId) return;
        const days = (Date.now() - prev.at) / (1000 * 60 * 60 * 24);
        if (days < 1) return;

        capture(AnalyticsEvents.AUDIOBOOK_RETURN_TO_BOOK, {
            book_id: bookId,
            days_since_last: Math.round(days * 10) / 10,
            is_mobile: window.innerWidth <= 768,
        });
    } catch {
        /* ignore */
    }
};

export const flushSessionSummary = (): void => {
    if (!initialized) return;
    if (sessionStats.chaptersStarted === 0 && sessionStats.chaptersCompleted === 0) return;

    capture(AnalyticsEvents.AUDIOBOOK_SESSION_SUMMARY, {
        books_played: Array.from(sessionStats.booksPlayed),
        chapters_started: sessionStats.chaptersStarted,
        chapters_completed: sessionStats.chaptersCompleted,
        total_listened_seconds: Math.round(sessionStats.totalListenedSeconds),
        is_mobile: window.innerWidth <= 768,
    });
};

/** Clerk 登录后调用：绑定用户身份 */
export const identifyUser = (userId: string, traits?: Record<string, unknown>): void => {
    if (!initialized) return;
    posthog.identify(userId, traits);
};

/** 登出时重置 distinct_id */
export const resetAnalyticsUser = (): void => {
    if (!initialized) return;
    posthog.reset();
};

/** 单测专用：标记 analytics 已初始化 */
export const __initAnalyticsForTest = (): void => {
    initialized = true;
};

/** 供单测与 store 使用的内部重置 */
export const __resetAnalyticsPlaybackStateForTest = (): void => {
    milestoneReported = new Set();
    lastReportedChapterId = null;
    chapterCompleteReported = false;
    lastSeekReportAt = 0;
    sessionStats.booksPlayed = new Set();
    sessionStats.chaptersStarted = 0;
    sessionStats.chaptersCompleted = 0;
    sessionStats.totalListenedSeconds = 0;
    sessionStats.lastTickAt = 0;
    sessionStats.lastTickSeconds = 0;
};
