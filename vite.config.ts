import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    plugins: [vue()],
    test: {
        globals: true,
        environment: 'jsdom',
    },
    base: '', // 参照パスを相対パスに設定
    build: {
        outDir: 'docs', // ビルド出力先を "docs" に変更
    },
});
