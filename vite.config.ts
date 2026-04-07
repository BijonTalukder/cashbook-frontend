// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
// import tailwindcss from "@tailwindcss/vite";
// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react(), tailwindcss()],
// });
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "icons/icon-192.png",
        "icons/icon-512.png",
        "icons/apple-touch-icon.png",
      ],

      manifest: {
        name: "HisabBoi",
        short_name: "HisabBoi",
        description: "Business HisabBoi, mess accounting & invoice generator",
        theme_color: "#0a0f1e",
        background_color: "#0a0f1e",
        display: "standalone",
        orientation: "portrait",
        start_url: "/dashboard",
        scope: "/",
        lang: "bn",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },

      workbox: {
        // Cache all static assets
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],

        // ✅ index.html কে fallback হিসেবে ব্যবহার করো (SPA standard approach)
        // offline.html আলাদা precache করতে হতো তাই এটা সহজ সমাধান
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],

        runtimeCaching: [
          {
            // API: try network first, fall back to cache
            urlPattern: /\/api\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Google Fonts
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
        ],
      },
    }),
  ],
});
