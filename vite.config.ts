import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
  server: {
    // In development the browser talks to the Vite origin and Vite forwards /api to the backend,
    // so the session cookie is same-origin and no CORS configuration is needed.
    proxy: { "/api": "http://localhost:8080" },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    // Node's fetch needs absolute URLs; production builds use VITE_API_BASE_URL (or same origin).
    env: { VITE_API_BASE_URL: "http://localhost" },
  },
});
