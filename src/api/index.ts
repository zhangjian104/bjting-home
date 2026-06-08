/**
 * API 接口集合
 * 有声小说平台的所有自定义接口方法（全环境直连 api.bjting.com）
 */
const API_BASE =
    import.meta.env.VITE_API_BASE_URL || 'https://api.bjting.com/api';

const apiFetch = (path: string) =>
    fetch(`${API_BASE}${path}`).then(r => {
        if (!r.ok) throw new Error(`API ${r.status}: ${path}`);
        return r.json();
    });

/**
 * 获取热门主播列表
 */
export const getPopularAuthors = () => apiFetch('/authors/popular');

/**
 * 获取有声书库列表
 * @param type 'hot' | 'normal' | string
 */
export const getAudiobooks = (type: 'hot' | 'normal' | string = 'normal') =>
    apiFetch(`/audiobooks?type=${encodeURIComponent(type)}`);

/**
 * 获取有声书详情及章节列表
 * @param bookId 书籍ID
 */
export const getAudiobookDetail = (bookId: string) =>
    apiFetch(`/audiobooks/detail?bookId=${encodeURIComponent(bookId)}`);

/**
 * 获取单本书基本信息（SEO及页面渲染用途）
 * @param bookId 书籍ID
 */
export const getAudiobookInfo = (bookId: string) =>
    apiFetch(`/audiobooks/info?bookId=${encodeURIComponent(bookId)}`);

/**
 * 获取单本书章节列表
 * @param bookId 书籍ID
 */
export const getAudiobookEpisodes = (bookId: string) =>
    apiFetch(`/audiobooks/episodes?bookId=${encodeURIComponent(bookId)}`);

