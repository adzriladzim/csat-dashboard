import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import sitemap from 'vite-plugin-sitemap'
import { readFileSync } from 'fs'
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    sitemap({
      hostname: 'https://csat-dashboard-khaki.vercel.app',
      dynamicRoutes: [
        '/',
        '/ranking',
        '/analisis-mahasiswa',
        '/diagnostik',
        '/analisis-faktor',
        '/sentimen',
        '/anomali',
        '/matriks-korelasi',
        '/analisis-strategis',
        '/analisis-mingguan',
        '/analisis-pertemuan',
        '/upload'
      ],
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        // Optimized Dynamic Splitting (Zero Manual Chunks)
      }
    }
  }
})
