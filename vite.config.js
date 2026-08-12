import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Phaser itself accounts for the overwhelming majority of bundle size and
    // rarely changes between deploys — splitting it into its own vendor chunk
    // means a redeploy that only touches app code (levels, scenes, tuning)
    // doesn't invalidate a returning visitor's cached copy of the engine.
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
        },
      },
    },
    // The Phaser vendor chunk is large by nature (a full game engine); the
    // default 500kB warning is expected noise for it, not an app-code smell.
    chunkSizeWarningLimit: 1600,
  },
  server: {
    open: true,
  },
});
