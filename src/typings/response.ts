export interface AudiobookDetailBook {
    id: string;
    title: string;
    title_zh: string | null;
    subtitle: string | null;
    cover_key: string | null;
    cover_path: string | null;
    episode_count: number;
    authors: string[];
    description: string;
    updated_at: string;
    cover_url: string;
}

export interface AudiobookDetailEpisode {
    key: string;
    name: string;
    duration_seconds: number;
    audio_url: string;
}

export interface AudiobookDetailResponse {
    book: AudiobookDetailBook;
    episodes: AudiobookDetailEpisode[];
}
