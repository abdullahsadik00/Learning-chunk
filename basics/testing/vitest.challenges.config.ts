import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Dedicated config for the self-checking CHALLENGES.
// Kept separate from vite.config.ts so `npm test` (the teaching suite) never
// picks up the intentionally-RED challenge specs, and so the challenges use a
// network-free setup (no MSW) instead of src/mocks/setup.ts.
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': resolve(__dirname, 'src') } },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./challenges/setup.ts'],
    include: ['challenges/**/*.test.{ts,tsx}'],
  },
});
