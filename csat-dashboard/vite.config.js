import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom', 'react-helmet-async'],
          'vendor-charts': ['recharts'],
          'vendor-exporters': ['xlsx', 'jspdf', 'html2canvas', 'papaparse'],
          'vendor-utils': ['@supabase/supabase-js', 'lucide-react', 'clsx', 'zustand']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
