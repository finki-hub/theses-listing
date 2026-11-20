import { resolve } from 'node:path';
import solid from 'vite-plugin-solid';
import { configDefaults } from 'vitest/config';

export default function createConfig() {
  return {
    plugins: [solid()],
    resolve: {
      alias: {
        '@': resolve(import.meta.dirname, './src'),
      },
      conditions: ['development', 'browser'],
    },
    test: {
      environment: 'node',
      // Browser smoke tests run with Playwright: npm run test:e2e.
      exclude: [...configDefaults.exclude, 'e2e/**'],
    },
  };
}
