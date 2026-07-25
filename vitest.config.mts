import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    alias: {
      // `server-only` throws unless the react-server condition is set, which
      // Vitest does not; the stub keeps server modules importable in tests
      // without weakening the guard in the real build.
      'server-only': fileURLToPath(
        new URL('./test/stubs/server-only.ts', import.meta.url)
      ),
    },
  },
  test: {
    environment: 'jsdom',
    // Load-bearing: Testing Library registers its between-test DOM cleanup only
    // when `afterEach` exists as a global. Without this it silently stops.
    globals: true,
    setupFiles: ['./vitest-setup.ts'],
    include: ['{app,components,config,lib,hooks}/**/*.test.{ts,tsx}'],
  },
});
