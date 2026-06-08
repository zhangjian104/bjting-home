import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlayMode } from '@/stores/interface';
import type { Song } from '@/stores/interface';
import { AnalyticsEvents, PlaybackSource } from '@/utils/analyticsEvents';

const captureMock = vi.fn();

vi.mock('posthog-js', () => ({
    default: {
        init: vi.fn(),
        capture: (...args: unknown[]) => captureMock(...args),
        register: vi.fn(),
        startSessionRecording: vi.fn(),
        identify: vi.fn(),
        reset: vi.fn(),
    },
}));

import {
    __initAnalyticsForTest,
    __resetAnalyticsPlaybackStateForTest,
    onAudioPlaying,
    onAudioPause,
    onChapterComplete,
    checkProgressMilestones,
} from '@/utils/analytics';

const mockSong: Song = {
    id: 'ch-1',
    name: '第一章',
    artist: '演播者',
    album: '测试书',
    albumId: 'book-1',
    duration: 100000,
};

const baseCtx = {
    chapter_index: 0,
    duration_seconds: 100,
    source: PlaybackSource.BOOK_DETAIL_PLAY_ALL,
    play_mode: PlayMode.LIST,
    book_id: 'book-1',
};

beforeEach(() => {
    captureMock.mockClear();
    __resetAnalyticsPlaybackStateForTest();
    __initAnalyticsForTest();
});

describe('onAudioPlaying', () => {
    it('新章节首次 playing 上报 play_start', () => {
        onAudioPlaying(mockSong, baseCtx);
        expect(captureMock).toHaveBeenCalledTimes(1);
        expect(captureMock.mock.calls[0][0]).toBe(AnalyticsEvents.AUDIOBOOK_PLAY_START);
    });

    it('同章重复 playing 不重复上报', () => {
        onAudioPlaying(mockSong, baseCtx);
        onAudioPlaying(mockSong, baseCtx);
        expect(captureMock).toHaveBeenCalledTimes(1);
    });
});

describe('onChapterComplete', () => {
    it('ended 上报 complete 且含 chapter_id', () => {
        onChapterComplete(mockSong, { ...baseCtx, played_seconds: 100 });
        expect(captureMock).toHaveBeenCalledWith(
            AnalyticsEvents.AUDIOBOOK_CHAPTER_COMPLETE,
            expect.objectContaining({
                chapter_id: 'ch-1',
                is_natural_end: true,
            })
        );
    });

    it('单曲循环只计一次 complete', () => {
        onChapterComplete(mockSong, { ...baseCtx, played_seconds: 100 });
        onChapterComplete(mockSong, { ...baseCtx, played_seconds: 100 });
        const completeCalls = captureMock.mock.calls.filter(
            c => c[0] === AnalyticsEvents.AUDIOBOOK_CHAPTER_COMPLETE
        );
        expect(completeCalls).toHaveLength(1);
    });
});

describe('checkProgressMilestones', () => {
    it('进度 30% 只报 25 里程碑', () => {
        onAudioPlaying(mockSong, baseCtx);
        captureMock.mockClear();
        checkProgressMilestones(mockSong, 30, 100, baseCtx);
        const milestoneCalls = captureMock.mock.calls.filter(
            c => c[0] === AnalyticsEvents.AUDIOBOOK_PROGRESS_MILESTONE
        );
        expect(milestoneCalls).toHaveLength(1);
        expect(milestoneCalls[0][1]).toMatchObject({ milestone: 25 });
    });

    it('同章不重复报 25', () => {
        onAudioPlaying(mockSong, baseCtx);
        captureMock.mockClear();
        checkProgressMilestones(mockSong, 30, 100, baseCtx);
        checkProgressMilestones(mockSong, 30, 100, baseCtx);
        const milestoneCalls = captureMock.mock.calls.filter(
            c => c[0] === AnalyticsEvents.AUDIOBOOK_PROGRESS_MILESTONE
        );
        expect(milestoneCalls).toHaveLength(1);
    });
});

describe('onAudioPause', () => {
    it('pause 上报含 progress_percent', () => {
        onAudioPlaying(mockSong, baseCtx);
        captureMock.mockClear();
        onAudioPause(mockSong, { ...baseCtx, played_seconds: 50 });
        expect(captureMock).toHaveBeenCalledWith(
            AnalyticsEvents.AUDIOBOOK_PLAY_PAUSE,
            expect.objectContaining({ progress_percent: 50 })
        );
    });
});
