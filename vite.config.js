import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          "chart-utils": [
            "d3-array",
            "d3-color",
            "d3-ease",
            "d3-format",
            "d3-interpolate",
            "d3-path",
            "d3-scale",
            "d3-shape",
            "d3-time",
            "d3-time-format",
            "d3-timer",
          ],
          charts: ["recharts"],
          icons: ["lucide-react"],
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon-192.png", "icons/icon-512.png", "manifest.json"],
      manifest: false,
    }),
  ],
});
