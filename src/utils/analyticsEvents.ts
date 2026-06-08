/** PostHog 业务事件名常量 */
export const AnalyticsEvents = {
    PAGE_VIEW: '$pageview',
    BOOK_DETAIL_VIEW: 'book_detail_view',
    CONTENT_CARD_CLICK: 'content_card_click',
    AUDIOBOOK_PLAY_START: 'audiobook_play_start',
    AUDIOBOOK_PLAY_ALL: 'audiobook_play_all',
    AUDIOBOOK_PLAY_PAUSE: 'audiobook_play_pause',
    AUDIOBOOK_CHAPTER_COMPLETE: 'audiobook_chapter_complete',
    AUDIOBOOK_PROGRESS_MILESTONE: 'audiobook_progress_milestone',
    AUDIOBOOK_CHAPTER_SKIP: 'audiobook_chapter_skip',
    AUDIOBOOK_SEEK: 'audiobook_seek',
    AUDIOBOOK_PLAY_ERROR: 'audiobook_play_error',
    AUDIOBOOK_RETURN_TO_BOOK: 'audiobook_return_to_book',
    AUDIOBOOK_SESSION_SUMMARY: 'audiobook_session_summary',
} as const;

/** 播放来源枚举 */
export const PlaybackSource = {
    BOOK_DETAIL_PLAY_ALL: 'book_detail_play_all',
    BOOK_DETAIL_CHAPTER_LIST: 'book_detail_chapter_list',
    HOME_CARD: 'home_card',
    PLAYLIST_PAGE: 'playlist_page',
    ARTIST_PAGE: 'artist_page',
    RECENT_HISTORY: 'recent_history',
    FOOTER_PLAYER: 'footer_player',
    UNKNOWN: 'unknown',
} as const;

export type PlaybackSourceType = (typeof PlaybackSource)[keyof typeof PlaybackSource];

export const PROGRESS_MILESTONES = [25, 50, 75, 90] as const;
