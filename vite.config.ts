import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { llmMiddleware, loadDotEnv } from './server/llmProxy'
import { extractMiddleware } from './server/extract'
import { searchMiddleware } from './server/searchProxy'
import { imageMiddleware } from './server/imageProxy'

// Nạp `.env` cho proxy. Không dùng `loadEnv` của Vite vì nó để process.env
// thắng file — một biến LLM_API_KEY cũ trong shell sẽ đè key người dùng vừa
// điền. `loadDotEnv` ưu tiên giá trị không rỗng trong file.
loadDotEnv()

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'llm-proxy',
      configureServer(server) {
        server.middlewares.use('/api/llm', llmMiddleware)
        server.middlewares.use('/api/extract', extractMiddleware)
        server.middlewares.use('/api/search', searchMiddleware)
        server.middlewares.use('/api/image', imageMiddleware)
      },
    },
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  // Chỉ quét dep của app; mặc định Vite quét mọi *.html trong repo, gồm cả
  // `_ref/genoffice` (clone tham chiếu) → dev khởi động chậm.
  optimizeDeps: {
    entries: ['index.html'],
  },
  server: {
    watch: {
      ignored: ['**/.mimosa/**', '**/.llmlog/**', '**/_ref/**', '**/dist/**'],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'zustand'],
          math: ['katex'],
        },
      },
    },
  },
})
