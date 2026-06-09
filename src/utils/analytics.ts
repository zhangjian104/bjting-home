import posthog from 'posthog-js';
import type { RouteLocationNormalized } from 'vue-router';
import type { Song } from '@/stores/interface';

const LISTENED_BOOKS_KEY = 'ph_listened_books';
let initialized = false;

const isEnabled = (): boolean =>
    import.meta.env.PROD &&
    Boolean(import.meta.env.VITE_POSTHOG_KEY) &&
    Boolean(import.meta.env.VITE_POSTHOG_HOST);

const capture = (event: string, properties: Record<string, unknown> = {}) => {
    if (!initialized) return;
    posthog.capture(event, properties);
};

export const initAnalytics = (): void => {
    if (!isEnabled() || initialized) return;
    posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
        api_host: import.meta.env.VITE_POSTHOG_HOST,
        capture_pageview: false,
        capture_pageleave: true,
        autocapture: true,
        persistence: 'localStorage',
    });
    initialized = true;
};

export const trackPageView = (
    to: RouteLocationNormalized,
    from?: RouteLocationNormalized
): void => {
    if (!initialized) return;
    const routeName = typeof to.name === 'string' ? to.name : String(to.name || 'unknown');
    const contentId =
        to.params?.id != null ? String(to.params.id) : to.path.replace(/^\//, '') || 'home';

    capture('$pageview', {
        route_name: routeName,
        path: to.path,
        full_path: to.fullPath,
        content_id: contentId,
        referrer_route: from?.name ? String(from.name) : 'direct',
        is_mobile: window.innerWidth <= 768,
    });
};

const parseListenedBooks = (): Array<{ id: string; title: string }> => {
    try {
        const raw = localStorage.getItem(LISTENED_BOOKS_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const inferBookIdByRoute = (): string | undefined => {
    const match = window.location.pathname.match(/^\/book\/([^/?#]+)/);
    return match?.[1] ? decodeURIComponent(match[1]) : undefined;
};

const updateUserListenedBooks = (bookId: string, bookTitle?: string) => {
    const existed = parseListenedBooks();
    const next = [
        { id: bookId, title: bookTitle || bookId },
        ...existed.filter(item => item.id !== bookId),
    ].slice(0, 100);

    try {
        localStorage.setItem(LISTENED_BOOKS_KEY, JSON.stringify(next));
    } catch {
        // ignore write failures
    }

    if (!initialized) return;
    posthog.register({
        last_book_id: bookId,
        listened_book_ids: next.map(item => item.id),
        listened_book_titles: next.map(item => item.title),
        listened_book_count: next.length,
    });
};

export const trackAudiobookPlayStart = (song: Song, chapterIndex: number) => {
    const bookId =
        song.albumId != null && song.albumId !== '' ? String(song.albumId) : inferBookIdByRoute();
    const bookTitle = song.album || undefined;

    capture('audiobook_play_start', {
        book_id: bookId,
        book_title: bookTitle,
        chapter_id: String(song.id),
        chapter_name: song.name,
        chapter_index: chapterIndex,
        narrator: song.artist,
        is_mobile: window.innerWidth <= 768,
    });

    if (bookId) {
        updateUserListenedBooks(bookId, bookTitle);
    }
};
