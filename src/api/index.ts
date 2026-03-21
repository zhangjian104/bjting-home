/**
 * API 接口集合
 * 有声小说平台的所有自定义接口方法
 */
import { httpGet } from '@/utils/http';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/sapi';

/**
 * 获取热门主播列表
 */
export const getPopularAuthors = () => fetch(`${API_BASE}/authors/popular`).then(r => r.json());

/**
 * 获取有声书库列表
 * @param type 'hot' | 'normal' | string
 */
export const getAudiobooks = (type: 'hot' | 'normal' | string = 'normal') => fetch(`${API_BASE}/audiobooks?type=${type}`).then(r => r.json());

/**
 * 获取有声书详情及章节列表
 * @param bookId 书籍ID
 */
export const getAudiobookDetail = (bookId: string) =>
    fetch(`${API_BASE}/audiobooks/detail?bookId=${encodeURIComponent(bookId)}`).then(r => r.json());

/**
 * 获取单本书基本信息（SEO及页面渲染用途）
 * @param bookId 书籍ID
 */
export const getAudiobookInfo = (bookId: string) =>
    fetch(`${API_BASE}/audiobooks/info?bookId=${encodeURIComponent(bookId)}`).then(r => r.json());

/**
 * 获取单本书章节列表
 * @param bookId 书籍ID
 */
export const getAudiobookEpisodes = (bookId: string) =>
    fetch(`${API_BASE}/audiobooks/episodes?bookId=${encodeURIComponent(bookId)}`).then(r => r.json());

// ═══════ 歌曲播放 ═══════

/**
 * 获取音频媒体流
 * @param key 音频文件的相对路径
 */
export const getAudioMediaUrl = (key: string) => {
    return `${API_BASE}/audiobooks/media?key=${encodeURIComponent(key)}`;
};

