import { afterEach, describe, expect, it, vi } from 'vitest';

import { resolveApiUrl } from './constants';

const DEFAULT_URL = 'https://api.finki-hub.com';

describe('resolveApiUrl', () => {
  it('falls back to the default when unset or blank', () => {
    expect(resolveApiUrl(undefined, DEFAULT_URL)).toBe(DEFAULT_URL);
    expect(resolveApiUrl(' '.repeat(3), DEFAULT_URL)).toBe(DEFAULT_URL);
  });

  it('uses the override and trims trailing slashes', () => {
    expect(resolveApiUrl(' https://staging.example.com/// ', DEFAULT_URL)).toBe(
      'https://staging.example.com',
    );
  });
});

describe('API URLs', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('reads the base overrides from the environment', async () => {
    vi.stubEnv('VITE_DIPLOMAS_API_URL', 'https://staging.example.com/');
    vi.stubEnv('VITE_MASTERS_API_URL', 'https://masters.example.com');
    vi.resetModules();

    const constants = await import('./constants');

    expect(constants.DIPLOMAS_LIST_URL).toBe(
      'https://staging.example.com/diplomas',
    );
    expect(constants.MASTERS_LIST_URL).toBe(
      'https://masters.example.com/masters',
    );
  });
});
