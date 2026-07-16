/** Clerk JWT 获取器注册（供 axios 等非 setup 上下文使用） */
let tokenGetter: (() => Promise<string | null>) | null = null;

export function setClerkTokenGetter(getter: () => Promise<string | null>): void {
    tokenGetter = getter;
}

export async function getClerkAuthToken(): Promise<string | null> {
    if (!tokenGetter) return null;
    try {
        return await tokenGetter();
    } catch {
        return null;
    }
}
