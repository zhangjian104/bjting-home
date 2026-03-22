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

export type CoverType = 'book' | 'author';

/**
 * 获取有效的封面或头像地址。如果为空，则返回默认图片。
 * @param url 原始图片地址
 * @param type 资源类型：'book' (默认) 或 'author'
 */
export function getValidCover(url: string | undefined | null, type: CoverType = 'book'): string {
    if (url) {
        return url;
    }
    // TODO: 可以根据实际情况替换为真实的兜底图 URL
    if (type === 'author') {
        return "https://cdn.bjting.com/anchor/bufeiyan/avatar.jpg";
    }
    return 'https://cdn.bjting.com/book/tian-di-zhi-jian/cover.jpg';
}
