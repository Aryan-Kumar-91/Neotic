/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendUrl = env.VITE_BACKEND_URL || env.BACKEND_URL || "http://localhost:8001";

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      port: 3000,
      proxy: {
        "/api": { target: backendUrl, changeOrigin: true },
        "/ws": { target: backendUrl, ws: true, changeOrigin: true },
      },
    },
    preview: { port: 3000 },
    build: {
      outDir: "dist",
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("react-syntax-highlighter")) {
                return "vendor-syntax-highlighter";
              }
              if (id.includes("@xyflow") || id.includes("reactflow")) {
                return "vendor-xyflow";
              }
              if (id.includes("firebase")) {
                return "vendor-firebase";
              }
              if (id.includes("@supabase")) {
                return "vendor-supabase";
              }
              if (id.includes("lucide-react")) {
                return "vendor-icons";
              }
              if (id.includes("react-router-dom") || id.includes("react-dom") || id.includes("/react/")) {
                return "vendor-react-core";
              }
            }
          },
        },
      },
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      include: ["src/**/*.{test,spec}.{ts,tsx}"],
    },
  };
});
