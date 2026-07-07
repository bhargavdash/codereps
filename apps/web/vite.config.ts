import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  worker: {
    // the ts-check worker lazily import()s the TypeScript compiler, which
    // code-splits the worker bundle — that requires ES-format workers
    format: "es",
  },
});
