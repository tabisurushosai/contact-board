import { defineConfig } from "vite";

export default defineConfig({
  publicDir: "public",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    copyPublicDir: true,
    target: "es2020",
    rollupOptions: {
      input: "index.html"
    }
  }
});
