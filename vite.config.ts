import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [react()],
  server: {
    port: 5174, // 開発サーバーのポート設定（必要に応じて変更してください）
    open: true, // 開発サーバー起動時にブラウザを自動で開く
    // historyApiFallback オプションを削除
  },
  build: {
    outDir: 'dist', // ビルド出力ディレクトリ
    assetsDir: 'assets', // 静的アセットのディレクトリ
    sourcemap: true, // ソースマップを生成
  },
});