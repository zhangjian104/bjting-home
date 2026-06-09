/* Vite */
declare type Recordable<T = any> = Record<string, T>;

declare interface ViteEnv {
    VITE_USER_NODE_ENV: 'development' | 'production' | 'test';
    VITE_PUBLIC_PATH: string;
    VITE_ROUTER_MODE: 'hash' | 'history';
    VITE_PROXY: [string, string][];
    VITE_API_BASE_URL: string;
    VITE_POSTHOG_KEY?: string;
    VITE_POSTHOG_HOST?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

interface ImportMetaEnv extends ViteEnv {
    __: unknown;
}

type ObjToKeyValArray<T> = {
    [K in keyof T]: [K, T[K]];
}[keyof T];

declare interface Window {
    adsbygoogle: { [key: string]: unknown }[] | undefined;
}

declare let adsbygoogle: { [key: string]: unknown }[] | undefined;
declare module 'three';
