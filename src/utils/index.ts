/**
 * @description 获取浏览器默认语言
 * @returns {String}
 */
export function getBrowserLang(): string {
    const browserLang = navigator.language;
    const l = browserLang.toLowerCase();
    if (['cn', 'zh', 'zh-cn', 'zh-hans'].includes(l)) return 'zh';
    if (['ja', 'ja-jp'].includes(l)) return 'ja';
    return 'en';
}

export * from './transformers';

export type ResourceType = 'avatar' | 'cover' | 'media';

export function getResourceUrl(path: string | undefined, type: ResourceType): string {
    if (!path) return '';
    
    // 使用统一的 API 基础路径
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/sapi';

    switch (type) {
        case 'avatar':
            return `${baseUrl}/authors/avatar?key=${path}`;
        case 'cover':
            return `${baseUrl}/audiobooks/cover?key=${path}`;
        case 'media':
            return `${baseUrl}/audiobooks/media?key=${path}`;
        default:
            return `${baseUrl}/media?key=${path}`; // fallback
    }
}
