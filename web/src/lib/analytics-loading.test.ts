import { afterEach, expect, it, vi } from 'vitest';

const posthog = vi.hoisted(() => ({
  capture: vi.fn<(event: string, properties?: object) => void>(),
  init: vi.fn(),
}));

vi.mock('posthog-js', () => ({ posthog }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  posthog.capture.mockReset();
  posthog.init.mockReset();
});

it('queues events captured before the lazily loaded SDK is ready', async () => {
  vi.stubEnv('VITE_POSTHOG_KEY', 'phc_fake_test_key');
  const { captureAnalytics, initAnalytics } = await import('./analytics');

  captureAnalytics('result_clicked', { position: 1, section: 'diplomas' });
  expect(posthog.capture).not.toHaveBeenCalled();

  await initAnalytics();

  expect(posthog.init).toHaveBeenCalledTimes(1);
  expect(posthog.capture.mock.calls.map(([event]) => event)).toEqual([
    'service_visit',
    'result_clicked',
  ]);

  captureAnalytics('result_clicked', { position: 2, section: 'diplomas' });
  expect(posthog.capture).toHaveBeenCalledTimes(3);
});

it('loads nothing and queues nothing without a key', async () => {
  vi.stubEnv('VITE_POSTHOG_KEY', '');
  const { captureAnalytics, initAnalytics } = await import('./analytics');

  captureAnalytics('result_clicked', { position: 1, section: 'diplomas' });
  await initAnalytics();

  expect(posthog.init).not.toHaveBeenCalled();
  expect(posthog.capture).not.toHaveBeenCalled();
});
