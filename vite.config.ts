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
    build: { outDir: "dist", sourcemap: true },
  };
});
