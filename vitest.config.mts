import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    alias: {
      'server-only': fileURLToPath(
        new URL('./test/stubs/server-only.ts', import.meta.url)
      ),
    },
  },
  test: {
    environment: 'jsdom',
    // Testing Library only registers its DOM cleanup when `afterEach` is global.
    globals: true,
    setupFiles: ['./vitest-setup.ts'],
    include: ['{app,components,config,lib,hooks}/**/*.test.{ts,tsx}'],
  },
});
