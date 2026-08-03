import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Backend tests never touch CSS, but Vite still resolves a CSS/PostCSS
  // pipeline on startup and searches parent directories for a postcss
  // config. Since the frontend now lives at the repo root (sibling to this
  // workspace), that search picks up the frontend's postcss.config.mjs
  // (Tailwind v4 plugin syntax), which isn't valid for Vite's own loader.
  // An inline empty config short-circuits that filesystem search.
  css: {
    postcss: {},
  },
  test: {
    setupFiles: ['./vitest.setup.ts'],
  },
});
