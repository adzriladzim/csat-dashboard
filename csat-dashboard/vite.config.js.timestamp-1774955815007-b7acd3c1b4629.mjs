// vite.config.js
import { defineConfig } from "file:///D:/TWM%20KERJAAN/csat-dashboard-fullstack/csat-dashboard/node_modules/vite/dist/node/index.js";
import react from "file:///D:/TWM%20KERJAAN/csat-dashboard-fullstack/csat-dashboard/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
import sitemap from "file:///D:/TWM%20KERJAAN/csat-dashboard-fullstack/csat-dashboard/node_modules/vite-plugin-sitemap/dist/index.js";

// package.json
var package_default = {
  name: "csat-dashboard",
  private: true,
  version: "1.1.1",
  type: "module",
  scripts: {
    dev: "vite",
    build: "vite build",
    preview: "vite preview",
    fix: "node scripts/release.js fix",
    feat: "node scripts/release.js feat"
  },
  dependencies: {
    "@google/generative-ai": "^0.24.1",
    "@supabase/supabase-js": "^2.100.0",
    clsx: "^2.1.1",
    "d3-cloud": "^1.2.7",
    "date-fns": "^3.6.0",
    html2canvas: "^1.4.1",
    jspdf: "^2.5.1",
    "lucide-react": "^0.400.0",
    papaparse: "^5.4.1",
    react: "^18.3.1",
    "react-dom": "^18.3.1",
    "react-helmet-async": "^3.0.0",
    "react-markdown": "^10.1.0",
    "react-router-dom": "^6.26.0",
    "react-wordcloud": "^1.2.7",
    recharts: "^2.12.7",
    xlsx: "^0.18.5",
    zustand: "^4.5.4"
  },
  devDependencies: {
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    autoprefixer: "^10.4.19",
    postcss: "^8.4.40",
    tailwindcss: "^3.4.7",
    vite: "^5.4.0",
    "vite-plugin-sitemap": "^0.8.2"
  }
};

// vite.config.js
var __vite_injected_original_dirname = "D:\\TWM KERJAAN\\csat-dashboard-fullstack\\csat-dashboard";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    sitemap({
      hostname: "https://csat-dashboard-khaki.vercel.app",
      dynamicRoutes: [
        "/",
        "/ranking",
        "/analisis-mahasiswa",
        "/diagnostik",
        "/analisis-faktor",
        "/sentimen",
        "/anomali",
        "/matriks-korelasi",
        "/analisis-strategis",
        "/analisis-mingguan",
        "/analisis-pertemuan",
        "/upload"
      ]
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(package_default.version)
  },
  build: {
    chunkSizeWarningLimit: 2e3,
    rollupOptions: {
      output: {
        // Optimized Dynamic Splitting (Zero Manual Chunks)
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiLCAicGFja2FnZS5qc29uIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRDpcXFxcVFdNIEtFUkpBQU5cXFxcY3NhdC1kYXNoYm9hcmQtZnVsbHN0YWNrXFxcXGNzYXQtZGFzaGJvYXJkXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxUV00gS0VSSkFBTlxcXFxjc2F0LWRhc2hib2FyZC1mdWxsc3RhY2tcXFxcY3NhdC1kYXNoYm9hcmRcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L1RXTSUyMEtFUkpBQU4vY3NhdC1kYXNoYm9hcmQtZnVsbHN0YWNrL2NzYXQtZGFzaGJvYXJkL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCdcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgc2l0ZW1hcCBmcm9tICd2aXRlLXBsdWdpbi1zaXRlbWFwJ1xuaW1wb3J0IHBrZyBmcm9tICcuL3BhY2thZ2UuanNvbidcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIHNpdGVtYXAoe1xuICAgICAgaG9zdG5hbWU6ICdodHRwczovL2NzYXQtZGFzaGJvYXJkLWtoYWtpLnZlcmNlbC5hcHAnLFxuICAgICAgZHluYW1pY1JvdXRlczogW1xuICAgICAgICAnLycsXG4gICAgICAgICcvcmFua2luZycsXG4gICAgICAgICcvYW5hbGlzaXMtbWFoYXNpc3dhJyxcbiAgICAgICAgJy9kaWFnbm9zdGlrJyxcbiAgICAgICAgJy9hbmFsaXNpcy1mYWt0b3InLFxuICAgICAgICAnL3NlbnRpbWVuJyxcbiAgICAgICAgJy9hbm9tYWxpJyxcbiAgICAgICAgJy9tYXRyaWtzLWtvcmVsYXNpJyxcbiAgICAgICAgJy9hbmFsaXNpcy1zdHJhdGVnaXMnLFxuICAgICAgICAnL2FuYWxpc2lzLW1pbmdndWFuJyxcbiAgICAgICAgJy9hbmFsaXNpcy1wZXJ0ZW11YW4nLFxuICAgICAgICAnL3VwbG9hZCdcbiAgICAgIF0sXG4gICAgfSlcbiAgXSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxuICAgIH0sXG4gIH0sXG4gIGRlZmluZToge1xuICAgICdpbXBvcnQubWV0YS5lbnYuVklURV9BUFBfVkVSU0lPTic6IEpTT04uc3RyaW5naWZ5KHBrZy52ZXJzaW9uKSxcbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDIwMDAsXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIC8vIE9wdGltaXplZCBEeW5hbWljIFNwbGl0dGluZyAoWmVybyBNYW51YWwgQ2h1bmtzKVxuICAgICAgfVxuICAgIH1cbiAgfVxufSlcbiIsICJ7XG4gIFwibmFtZVwiOiBcImNzYXQtZGFzaGJvYXJkXCIsXG4gIFwicHJpdmF0ZVwiOiB0cnVlLFxuICBcInZlcnNpb25cIjogXCIxLjEuMVwiLFxuICBcInR5cGVcIjogXCJtb2R1bGVcIixcbiAgXCJzY3JpcHRzXCI6IHtcbiAgICBcImRldlwiOiBcInZpdGVcIixcbiAgICBcImJ1aWxkXCI6IFwidml0ZSBidWlsZFwiLFxuICAgIFwicHJldmlld1wiOiBcInZpdGUgcHJldmlld1wiLFxuICAgIFwiZml4XCI6IFwibm9kZSBzY3JpcHRzL3JlbGVhc2UuanMgZml4XCIsXG4gICAgXCJmZWF0XCI6IFwibm9kZSBzY3JpcHRzL3JlbGVhc2UuanMgZmVhdFwiXG4gIH0sXG4gIFwiZGVwZW5kZW5jaWVzXCI6IHtcbiAgICBcIkBnb29nbGUvZ2VuZXJhdGl2ZS1haVwiOiBcIl4wLjI0LjFcIixcbiAgICBcIkBzdXBhYmFzZS9zdXBhYmFzZS1qc1wiOiBcIl4yLjEwMC4wXCIsXG4gICAgXCJjbHN4XCI6IFwiXjIuMS4xXCIsXG4gICAgXCJkMy1jbG91ZFwiOiBcIl4xLjIuN1wiLFxuICAgIFwiZGF0ZS1mbnNcIjogXCJeMy42LjBcIixcbiAgICBcImh0bWwyY2FudmFzXCI6IFwiXjEuNC4xXCIsXG4gICAgXCJqc3BkZlwiOiBcIl4yLjUuMVwiLFxuICAgIFwibHVjaWRlLXJlYWN0XCI6IFwiXjAuNDAwLjBcIixcbiAgICBcInBhcGFwYXJzZVwiOiBcIl41LjQuMVwiLFxuICAgIFwicmVhY3RcIjogXCJeMTguMy4xXCIsXG4gICAgXCJyZWFjdC1kb21cIjogXCJeMTguMy4xXCIsXG4gICAgXCJyZWFjdC1oZWxtZXQtYXN5bmNcIjogXCJeMy4wLjBcIixcbiAgICBcInJlYWN0LW1hcmtkb3duXCI6IFwiXjEwLjEuMFwiLFxuICAgIFwicmVhY3Qtcm91dGVyLWRvbVwiOiBcIl42LjI2LjBcIixcbiAgICBcInJlYWN0LXdvcmRjbG91ZFwiOiBcIl4xLjIuN1wiLFxuICAgIFwicmVjaGFydHNcIjogXCJeMi4xMi43XCIsXG4gICAgXCJ4bHN4XCI6IFwiXjAuMTguNVwiLFxuICAgIFwienVzdGFuZFwiOiBcIl40LjUuNFwiXG4gIH0sXG4gIFwiZGV2RGVwZW5kZW5jaWVzXCI6IHtcbiAgICBcIkB0eXBlcy9yZWFjdFwiOiBcIl4xOC4zLjFcIixcbiAgICBcIkB0eXBlcy9yZWFjdC1kb21cIjogXCJeMTguMy4wXCIsXG4gICAgXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiOiBcIl40LjMuMVwiLFxuICAgIFwiYXV0b3ByZWZpeGVyXCI6IFwiXjEwLjQuMTlcIixcbiAgICBcInBvc3Rjc3NcIjogXCJeOC40LjQwXCIsXG4gICAgXCJ0YWlsd2luZGNzc1wiOiBcIl4zLjQuN1wiLFxuICAgIFwidml0ZVwiOiBcIl41LjQuMFwiLFxuICAgIFwidml0ZS1wbHVnaW4tc2l0ZW1hcFwiOiBcIl4wLjguMlwiXG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBOFYsU0FBUyxvQkFBb0I7QUFDM1gsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixPQUFPLGFBQWE7OztBQ0hwQjtBQUFBLEVBQ0UsTUFBUTtBQUFBLEVBQ1IsU0FBVztBQUFBLEVBQ1gsU0FBVztBQUFBLEVBQ1gsTUFBUTtBQUFBLEVBQ1IsU0FBVztBQUFBLElBQ1QsS0FBTztBQUFBLElBQ1AsT0FBUztBQUFBLElBQ1QsU0FBVztBQUFBLElBQ1gsS0FBTztBQUFBLElBQ1AsTUFBUTtBQUFBLEVBQ1Y7QUFBQSxFQUNBLGNBQWdCO0FBQUEsSUFDZCx5QkFBeUI7QUFBQSxJQUN6Qix5QkFBeUI7QUFBQSxJQUN6QixNQUFRO0FBQUEsSUFDUixZQUFZO0FBQUEsSUFDWixZQUFZO0FBQUEsSUFDWixhQUFlO0FBQUEsSUFDZixPQUFTO0FBQUEsSUFDVCxnQkFBZ0I7QUFBQSxJQUNoQixXQUFhO0FBQUEsSUFDYixPQUFTO0FBQUEsSUFDVCxhQUFhO0FBQUEsSUFDYixzQkFBc0I7QUFBQSxJQUN0QixrQkFBa0I7QUFBQSxJQUNsQixvQkFBb0I7QUFBQSxJQUNwQixtQkFBbUI7QUFBQSxJQUNuQixVQUFZO0FBQUEsSUFDWixNQUFRO0FBQUEsSUFDUixTQUFXO0FBQUEsRUFDYjtBQUFBLEVBQ0EsaUJBQW1CO0FBQUEsSUFDakIsZ0JBQWdCO0FBQUEsSUFDaEIsb0JBQW9CO0FBQUEsSUFDcEIsd0JBQXdCO0FBQUEsSUFDeEIsY0FBZ0I7QUFBQSxJQUNoQixTQUFXO0FBQUEsSUFDWCxhQUFlO0FBQUEsSUFDZixNQUFRO0FBQUEsSUFDUix1QkFBdUI7QUFBQSxFQUN6QjtBQUNGOzs7QUQxQ0EsSUFBTSxtQ0FBbUM7QUFPekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sUUFBUTtBQUFBLE1BQ04sVUFBVTtBQUFBLE1BQ1YsZUFBZTtBQUFBLFFBQ2I7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixvQ0FBb0MsS0FBSyxVQUFVLGdCQUFJLE9BQU87QUFBQSxFQUNoRTtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsdUJBQXVCO0FBQUEsSUFDdkIsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBO0FBQUEsTUFFUjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
