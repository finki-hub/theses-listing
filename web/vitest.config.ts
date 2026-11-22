import solid from '@solidjs/vite-plugin';
import { resolve } from 'node:path';
import { configDefaults } from 'vitest/config';

export default function createConfig() {
  return {
    plugins: [solid()],
    resolve: {
      alias: {
        '@': resolve(import.meta.dirname, './src'),
      },
      conditions: ['solid', 'development', 'browser'],
    },
    ssr: {
      resolve: {
        // Vitest's SSR pipeline otherwise resolves solid-js to its server
        // build, where writes are inert and effects never flush.
        conditions: ['solid', 'browser', 'development'],
      },
    },
    test: {
      environment: 'node',
      // Browser smoke tests run with Playwright: npm run test:e2e.
      exclude: [...configDefaults.exclude, 'e2e/**'],
    },
  };
}
