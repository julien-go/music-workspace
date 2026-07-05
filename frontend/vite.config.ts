/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    // globals is required for @testing-library/react's automatic DOM cleanup
    // between tests (it registers itself on the global afterEach).
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    // Keep Vitest inside src/ so it never picks up the Playwright specs in e2e/.
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
