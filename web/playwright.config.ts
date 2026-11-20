import { defineConfig, devices } from '@playwright/test';
import process from 'node:process';

const PORT = 4_173;

export default defineConfig({
  forbidOnly: Boolean(process.env['CI']),
  fullyParallel: true,
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  reporter: process.env['CI'] ? [['github'], ['list']] : 'list',
  retries: process.env['CI'] ? 1 : 0,
  testDir: './e2e',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npx vite build && npx vite preview --port ${PORT} --strictPort`,
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
    url: `http://localhost:${PORT}`,
  },
});
