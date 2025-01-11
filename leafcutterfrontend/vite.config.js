import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true,
    rollupOptions: {
      input: {
        main: "./src/main.jsx", // Entry point for edit pages
      },
      output: {
        entryFileNames: "renderer.js",
        assetFileNames: "renderer.[ext]",
      },
    },
    outDir: "../leafcutter/src/",
    emptyOutDir: false,
  },
  css: {
    modules: {
      scopeBehaviour: "local", // Use 'global' if you need global classes
      generateScopedName: "[name]_[local]_[hash:base64:2]", // Customize class names
    },
  },
  test: {
    globals: true, // This will enable you to use global functions like `describe`, `it`, `expect` etc.
    environment: "jsdom", // Specify the environment (use 'node' for Node.js testing)
    coverage: {
      provider: "c8", // You can use 'c8' for code coverage
      reporter: ["text", "html"],
    },
    // vitest.config.js
  },
});
