import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    alias: {
      // `server-only` throws unless resolved through the react-server
      // condition, which Vitest does not set. Stubbing it keeps server modules
      // importable from tests without weakening the guard in the real build.
      'server-only': fileURLToPath(
        new URL('./test/stubs/server-only.ts', import.meta.url)
      ),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest-setup.ts'],
    include: ['{app,components,lib,hooks}/**/*.test.{ts,tsx}'],
  },
});
