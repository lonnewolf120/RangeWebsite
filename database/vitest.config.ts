import { defineConfig } from 'vitest/config';

export default defineConfig({
  // See backend/vitest.config.ts for why this is needed: the frontend now
  // lives at the repo root, and Vite's CSS pipeline otherwise picks up its
  // postcss.config.mjs (Tailwind v4 syntax), which isn't valid for Vite's
  // own loader and isn't needed by these tests anyway.
  css: {
    postcss: {},
  },
});
