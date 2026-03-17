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
    
    // 是否为本地开发环境
    const isLocalMode = import.meta.env.VITE_RESOURCE_LOCAL_MODE === 'true';
    const baseUrl = import.meta.env.VITE_RESOURCE_BASE_URL;

    if (isLocalMode) {
        // 本地环境：/r2/authors/qing_xue.png
        return `${baseUrl}${path}`;
    } else {
        // 线上环境，根据 type 决定具体路由
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
}
