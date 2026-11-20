import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  formatNumber,
  formatPercentage,
  formatThesisDate,
  formatUpdatedAt,
  resetLocaleSupportCache,
} from './format';

const THESIS_DATE = '03.07.2026';
const UNSUPPORTED = new Set(['mk-MK', 'sq-AL']);

// Simulates browsers (e.g. Chrome) that ship no ICU data for mk and sq.
const withoutMacedonianAndAlbanian = (locales: Intl.LocalesArgument) =>
  [locales ?? []]
    .flat()
    .map(String)
    .filter((locale) => !UNSUPPORTED.has(locale));

describe('locale formatting fallback', () => {
  beforeEach(() => {
    vi.spyOn(Intl.DateTimeFormat, 'supportedLocalesOf').mockImplementation(
      withoutMacedonianAndAlbanian,
    );
    vi.spyOn(Intl.NumberFormat, 'supportedLocalesOf').mockImplementation(
      withoutMacedonianAndAlbanian,
    );
    resetLocaleSupportCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetLocaleSupportCache();
  });

  it('uses Macedonian and Albanian separators instead of en-US', () => {
    expect(formatNumber(4_263.5, 'mk')).toBe('4.263,5');
    expect(formatNumber(4_263.5, 'sq')).toBe('4\u{A0}263,5');
    expect(formatPercentage(54.6, 'mk')).toBe('54,6%');
  });

  it('formats dates day-first', () => {
    expect(formatThesisDate(THESIS_DATE, 'mk')).toBe(THESIS_DATE);
    expect(formatThesisDate(THESIS_DATE, 'sq')).toBe(THESIS_DATE);
    expect(formatUpdatedAt('2026-11-20T09:05:00', 'mk')).toBe(
      '20.11.2026 09:05',
    );
  });

  it('keeps using Intl for supported locales', () => {
    expect(formatNumber(1_234.5, 'tr')).toBe('1.234,5');
    expect(formatThesisDate(THESIS_DATE, 'en')).toBe('03/07/2026');
  });
});
