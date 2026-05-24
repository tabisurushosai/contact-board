import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";

const requiredExtensionFiles = [
  "manifest.json",
  "icons/icon16.png",
  "icons/icon48.png",
  "icons/icon128.png"
] as const;

function verifyExtensionBuildOutput(): Plugin {
  let outDir = "";

  return {
    name: "verify-extension-build-output",
    apply: "build",
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const missingFiles = requiredExtensionFiles.filter(
        (filePath) => !existsSync(resolve(outDir, filePath))
      );

      if (missingFiles.length > 0) {
        throw new Error(
          `Chrome extension build is missing required file(s): ${missingFiles.join(", ")}`
        );
      }
    }
  };
}

export default defineConfig({
  publicDir: "public",
  plugins: [verifyExtensionBuildOutput()],
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
