import { describe, expect, it } from 'vitest';

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
