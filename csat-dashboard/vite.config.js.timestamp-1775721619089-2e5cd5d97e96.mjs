// vite.config.js
import { defineConfig } from "file:///D:/TWM%20KERJAAN/csat-dashboard-fullstack/csat-dashboard/node_modules/vite/dist/node/index.js";
import react from "file:///D:/TWM%20KERJAAN/csat-dashboard-fullstack/csat-dashboard/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
import sitemap from "file:///D:/TWM%20KERJAAN/csat-dashboard-fullstack/csat-dashboard/node_modules/vite-plugin-sitemap/dist/index.js";
import { readFileSync } from "fs";
var __vite_injected_original_dirname = "D:\\TWM KERJAAN\\csat-dashboard-fullstack\\csat-dashboard";
var pkg = JSON.parse(readFileSync("./package.json", "utf-8"));
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxUV00gS0VSSkFBTlxcXFxjc2F0LWRhc2hib2FyZC1mdWxsc3RhY2tcXFxcY3NhdC1kYXNoYm9hcmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXFRXTSBLRVJKQUFOXFxcXGNzYXQtZGFzaGJvYXJkLWZ1bGxzdGFja1xcXFxjc2F0LWRhc2hib2FyZFxcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovVFdNJTIwS0VSSkFBTi9jc2F0LWRhc2hib2FyZC1mdWxsc3RhY2svY3NhdC1kYXNoYm9hcmQvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBzaXRlbWFwIGZyb20gJ3ZpdGUtcGx1Z2luLXNpdGVtYXAnXG5pbXBvcnQgeyByZWFkRmlsZVN5bmMgfSBmcm9tICdmcydcbmNvbnN0IHBrZyA9IEpTT04ucGFyc2UocmVhZEZpbGVTeW5jKCcuL3BhY2thZ2UuanNvbicsICd1dGYtOCcpKVxuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gICAgc2l0ZW1hcCh7XG4gICAgICBob3N0bmFtZTogJ2h0dHBzOi8vY3NhdC1kYXNoYm9hcmQta2hha2kudmVyY2VsLmFwcCcsXG4gICAgICBkeW5hbWljUm91dGVzOiBbXG4gICAgICAgICcvJyxcbiAgICAgICAgJy9yYW5raW5nJyxcbiAgICAgICAgJy9hbmFsaXNpcy1tYWhhc2lzd2EnLFxuICAgICAgICAnL2RpYWdub3N0aWsnLFxuICAgICAgICAnL2FuYWxpc2lzLWZha3RvcicsXG4gICAgICAgICcvc2VudGltZW4nLFxuICAgICAgICAnL2Fub21hbGknLFxuICAgICAgICAnL21hdHJpa3Mta29yZWxhc2knLFxuICAgICAgICAnL2FuYWxpc2lzLXN0cmF0ZWdpcycsXG4gICAgICAgICcvYW5hbGlzaXMtbWluZ2d1YW4nLFxuICAgICAgICAnL2FuYWxpc2lzLXBlcnRlbXVhbicsXG4gICAgICAgICcvdXBsb2FkJ1xuICAgICAgXSxcbiAgICB9KVxuICBdLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjJyksXG4gICAgfSxcbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDIwMDAsXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIC8vIE9wdGltaXplZCBEeW5hbWljIFNwbGl0dGluZyAoWmVybyBNYW51YWwgQ2h1bmtzKVxuICAgICAgfVxuICAgIH1cbiAgfVxufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBOFYsU0FBUyxvQkFBb0I7QUFDM1gsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixPQUFPLGFBQWE7QUFDcEIsU0FBUyxvQkFBb0I7QUFKN0IsSUFBTSxtQ0FBbUM7QUFLekMsSUFBTSxNQUFNLEtBQUssTUFBTSxhQUFhLGtCQUFrQixPQUFPLENBQUM7QUFHOUQsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sUUFBUTtBQUFBLE1BQ04sVUFBVTtBQUFBLE1BQ1YsZUFBZTtBQUFBLFFBQ2I7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCx1QkFBdUI7QUFBQSxJQUN2QixlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUE7QUFBQSxNQUVSO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
