import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router';
import { defineComponent, h, defineAsyncComponent } from 'vue';
import { useMediaQuery } from '@vueuse/core';

// 从环境变量中获取路由模式配置，默认为 'hash' 模式
const mode = import.meta.env.VITE_ROUTER_MODE || 'hash';

// 路由模式映射表，用于根据配置创建对应的 history 对象
const routerMode: Record<string, () => ReturnType<typeof createWebHashHistory>> = {
    hash: () => createWebHashHistory(), // Hash 模式 (URL 中带有 #)
    history: () => createWebHistory(), // History 模式 (干净的 URL，需要服务端配置支持)
};

// 获取路由的 history 实例
const getHistory = () => {
    const createHistory = routerMode[mode];
    // 如果环境变量中配置了有效的模式，则使用该模式
    if (typeof createHistory === 'function') {
        return createHistory();
    }
    // 兜底策略：默认使用 hash 模式
    return createWebHashHistory();
};

/**
 * 响应式组件工厂函数：根据当前窗口宽度，在桌面端与移动端组件之间动态切换
 * 这是一个非常巧妙的设计，使得同一套路由可以完美适配两套不同的 UI 视图。
 *
 * @param desktopLoader 桌面端组件的动态导入函数 (如: () => import('...'))
 * @param mobileLoader 移动端组件的动态导入函数 (如: () => import('...'))
 */
const responsive = (desktopLoader: () => Promise<any>, mobileLoader: () => Promise<any>, compName?: string) =>
    defineComponent({
        name: compName || 'ResponsiveRouteComponent',
        setup() {
            // 使用 VueUse 的媒体查询钩子，实时监听窗口宽度是否小于等于 768px (即判断是否为移动端)
            const isMobile = useMediaQuery('(max-width: 768px)');

            // 使用 defineAsyncComponent 将传入的 import 函数转化为异步组件
            // 这样可以在路由命中且设备匹配时才去真正请求对应的组件代码，实现代码分割和按需加载
            const Desktop = defineAsyncComponent(desktopLoader);
            const Mobile = defineAsyncComponent(mobileLoader);

            // render 函数：根据 isMobile 的响应式状态，动态渲染对应的组件
            return () => h(isMobile.value ? Mobile : Desktop);
        },
    });

// 创建并配置 Vue Router 实例
const router = createRouter({
    history: getHistory(), // 使用前面获取到的 history 实例
    strict: false, // 关闭严格模式 (允许路由末尾带有斜杠)
    scrollBehavior: () => ({ left: 0, top: 0 }), // 每次路由切换后，页面滚动到顶部
    routes: [
        {
            path: '/',
            // 根布局组件：同样使用响应式加载，区分桌面端布局(侧边栏+顶部栏等)和移动端布局(底部导航等)
            component: responsive(
                () => import('@/layout/index.vue'),
                () => import('@/layout/mobile/index.vue')
            ),
            // 所有子路由都会被渲染在根布局的 <router-view> 中
            children: [
                {
                    path: '/',
                    name: 'home', // 首页：发现音乐
                    component: responsive(
                        () => import('@/pages/index.vue'),
                        () => import('@/pages/mobile/index.vue')
                    ),
                },
                {
                    path: '/playlist/:id',
                    name: 'playlist', // 歌单详情页，:id 为动态路由参数
                    component: responsive(
                        () => import('@/pages/playlist.vue'),
                        () => import('@/pages/mobile/playlist.vue')
                    ),
                },
                /* {
          path: '/mv-list',
          name: 'mv-list', // MV 列表页
          component: responsive(
            () => import('@/pages/mv-list.vue'),
            () => import('@/pages/mobile/mv-list.vue')
          ),
        },
        {
          path: '/mv-player/:id',
          name: 'mv-player', // MV 播放页面
          component: responsive(
            () => import('@/pages/mv-player.vue'),
            () => import('@/pages/mobile/mv-player.vue')
          ),
        }, */
                {
                    path: '/recent',
                    name: 'recent', // 最近播放页面
                    component: responsive(
                        () => import('@/pages/recent.vue'),
                        () => import('@/pages/mobile/recent.vue')
                    ),
                },
                {
                    path: '/my-music',
                    name: 'my-music', // 我的音乐库页面
                    component: responsive(
                        () => import('@/pages/my-music.vue'),
                        () => import('@/pages/mobile/recent.vue') // 移动端可能暂时复用了 recent 的组件
                    ),
                },
                {
                    path: '/likes',
                    name: 'likes', // 我喜欢的音乐页面
                    component: responsive(
                        () => import('@/pages/likes.vue'),
                        () => import('@/pages/mobile/likes.vue')
                    ),
                },
                {
                    path: '/search',
                    name: 'search', // 搜索页面
                    component: responsive(
                        () => import('@/pages/search.vue'),
                        () => import('@/pages/mobile/search.vue')
                    ),
                },
                {
                    path: '/charts',
                    name: 'charts', // 排行榜页面
                    component: responsive(
                        () => import('@/pages/charts.vue'),
                        () => import('@/pages/mobile/charts.vue')
                    ),
                },
                {
                    path: '/artists',
                    name: 'artists', // 歌手分类列表页面
                    component: responsive(
                        () => import('@/pages/artists.vue'),
                        () => import('@/pages/artists.vue') // 桌面端和移动端共用了同一个组件，内部可能自己做了适配
                    ),
                },
                {
                    path: '/new-albums',
                    name: 'new-albums', // 新碟上架页面
                    component: responsive(
                        () => import('@/pages/new-albums.vue'),
                        () => import('@/pages/new-albums.vue') // 同样共用了组件
                    ),
                },
                {
                    path: '/artist/:id',
                    name: 'artist', // 歌手详情页面
                    component: responsive(
                        () => import('@/pages/artist.vue'),
                        () => import('@/pages/mobile/artist.vue')
                    ),
                },
                {
                    path: '/song/:id',
                    name: 'song', // 单曲详情页面
                    component: responsive(
                        () => import('@/pages/song.vue'),
                        () => import('@/pages/mobile/song.vue')
                    ),
                },
                {
                    path: '/album/:id',
                    name: 'album', // 专辑详情页面
                    component: responsive(
                        () => import('@/pages/album.vue'),
                        () => import('@/pages/mobile/album.vue')
                    ),
                },
                {
                    path: '/audiobook/:id',
                    name: 'legacy-audiobook', // 废弃路由
                    redirect: to => {
                        console.log(`[Router] 拦截废弃路由，重定向至 /book/${to.params.id}`);
                        return {
                            path: `/book/${to.params.id}`,
                            query: to.query, // 保留原有的 URL 参数
                        };
                    },
                },
                {
                    path: '/book/:id',
                    name: 'book', // 书籍/有声书详情页面
                    component: responsive(
                        () => import('@/pages/book.vue'),
                        () => import('@/pages/mobile/book.vue'),
                        'BookPage'
                    ),
                    beforeEnter: (to, from) => {
                        console.log(`[Router] 进入了书籍详情页: ${to.params.id}`);
                    },
                },
                {
                    path: '/local-music',
                    name: 'local-music', // 本地音乐页面
                    component: responsive(
                        () => import('@/pages/local-music.vue'),
                        () => import('@/pages/mobile/local-music.vue')
                    ),
                },
                {
                    path: '/settings',
                    name: 'settings', // 设置页面
                    component: responsive(
                        () => import('@/pages/settings.vue'),
                        () => import('@/pages/mobile/settings.vue')
                    ),
                },
            ],
        },
    ],
});

export default router;
