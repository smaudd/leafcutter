import { defineConfig } from "vite";

export default defineConfig({
  build: {
    sourcemap: true,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: "./src/main.js", // Entry point for edit pages
      },
      output: {
        entryFileNames: "renderer.js",
      },
    },
    outDir: "../leafcutter/src/",
  },
});
