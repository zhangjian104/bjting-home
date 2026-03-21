import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import { wrapperEnv } from './build/getEnv';
import { createProxy } from './build/proxy';
import { createVitePlugins } from './build/plugins';

export default defineConfig(({ mode }) => {
    const root = process.cwd();
    const env = loadEnv(mode, root);
    const viteEnv = wrapperEnv(env);

    return {
        plugins: createVitePlugins(viteEnv),
        server: {
            port: 5089,
            host: true,
            // 代理配置
            proxy: {
                '/sapi': {
                    // 若需要连接正式接口，请在根目录创建 .env.local 文件并设置 VITE_SAPI_TARGET (例如：VITE_SAPI_TARGET=https://api.domain.com)
                    // 代码库中不包含任何本地或正式环境的地址差异，保持仓库干净。
                    target: viteEnv.VITE_SAPI_TARGET || 'http://127.0.0.1:8788',
                    changeOrigin: true,
                    rewrite: path => path.replace(/^\/sapi/, '/api'),
                },
                '/api': {
                    target: 'https://neteasecloudmusicapi-2.onrender.com', // 因为 lulufm.app 本地 443 不通，退回到原始接口
                    changeOrigin: true,
                    // 将开头的 /api 删掉
                    rewrite: path => path.replace(/^\/api/, ''),
                    secure: false, // 不验证 SSL 证书
                },
                ...createProxy(viteEnv.VITE_PROXY),
            },
        },

        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url)),
            },
        },
        base: viteEnv.VITE_PUBLIC_PATH,
        build: {
            rollupOptions: {
                // 静态资源分类打包
                output: {
                    entryFileNames: 'static/js/[name]-[hash].js',
                    chunkFileNames: 'static/js/[name]-[hash].js',
                    assetFileNames: 'static/[ext]/[name]-[hash].[ext]',
                    // 静态资源分拆打包
                    manualChunks(id) {
                        if (id.includes('node_modules')) {
                            if (id.toString().indexOf('.pnpm/') !== -1) {
                                return id.toString().split('.pnpm/')[1].split('/')[0].toString();
                            } else if (id.toString().indexOf('node_modules/') !== -1) {
                                return id
                                    .toString()
                                    .split('node_modules/')[1]
                                    .split('/')[0]
                                    .toString();
                            }
                        }
                    },
                },
            },
        },
    };
});
