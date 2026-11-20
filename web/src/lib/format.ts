import { type Language, languageLocales } from './i18n';

// Chrome (and other browsers with a reduced ICU build) ships no data for
// Macedonian and Albanian, so Intl silently falls back to en-US: "11/20/2026"
// and "4,263.5". For those cases we format with en-US and rewrite the
// separators to the language's own conventions (CLDR).
type Separators = {
  date: string;
  decimal: string;
  group: string;
};

const FALLBACK_SEPARATORS: Partial<Record<Language, Separators>> = {
  mk: { date: '.', decimal: ',', group: '.' },
  sq: { date: '.', decimal: ',', group: '\u{A0}' },
};

const supportCache = new Map<string, boolean>();

const isLocaleSupported = (locale: string): boolean => {
  let supported = supportCache.get(locale);
  if (supported === undefined) {
    supported =
      Intl.DateTimeFormat.supportedLocalesOf(locale).length > 0 &&
      Intl.NumberFormat.supportedLocalesOf(locale).length > 0;
    supportCache.set(locale, supported);
  }

  return supported;
};

const getFallback = (language: Language): Separators | undefined =>
  isLocaleSupported(languageLocales[language])
    ? undefined
    : FALLBACK_SEPARATORS[language];

const pad = (value: number) => String(value).padStart(2, '0');

const formatWithFallback = (
  value: number,
  options: Intl.NumberFormatOptions | undefined,
  separators: Separators,
): string =>
  new Intl.NumberFormat('en-US', options)
    .formatToParts(value)
    .map((part) => {
      if (part.type === 'group') return separators.group;
      if (part.type === 'decimal') return separators.decimal;
      return part.value;
    })
    .join('');

export const formatNumber = (
  value: number,
  language: Language,
  options?: Intl.NumberFormatOptions,
): string => {
  const fallback = getFallback(language);
  return fallback
    ? formatWithFallback(value, options, fallback)
    : new Intl.NumberFormat(languageLocales[language], options).format(value);
};

export const formatPercentage = (value: number, language: Language): string =>
  formatNumber(value / 100, language, {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
    style: 'percent',
  });

const formatDateParts = (
  date: Date,
  language: Language,
  options: { timeZone?: string; withTime: boolean },
): string => {
  const fallback = getFallback(language);

  if (fallback) {
    const utc = options.timeZone === 'UTC';
    const day = utc ? date.getUTCDate() : date.getDate();
    const month = (utc ? date.getUTCMonth() : date.getMonth()) + 1;
    const year = utc ? date.getUTCFullYear() : date.getFullYear();
    const text = [pad(day), pad(month), year].join(fallback.date);
    if (!options.withTime) return text;

    const hours = utc ? date.getUTCHours() : date.getHours();
    const minutes = utc ? date.getUTCMinutes() : date.getMinutes();
    return `${text} ${pad(hours)}:${pad(minutes)}`;
  }

  return new Intl.DateTimeFormat(languageLocales[language], {
    day: '2-digit',
    month: '2-digit',
    timeZone: options.timeZone,
    year: 'numeric',
    ...(options.withTime && {
      hour: '2-digit',
      hour12: false,
      minute: '2-digit',
    }),
  }).format(date);
};

const THESIS_DATE_REGEX =
  /^(?<day>\d{1,2})\.(?<month>\d{1,2})\.(?<year>\d{4})\.?$/u;

export const formatThesisDate = (value: string, language: Language): string => {
  if (!value) return '\u{2014}';
  const parts = THESIS_DATE_REGEX.exec(value.trim())?.groups;
  if (!parts) return value;

  const day = Number(parts['day']);
  const month = Number(parts['month']);
  const year = Number(parts['year']);
  // Date-only source values must not move to another day in the browser's zone.
  // eslint-disable-next-line unicorn/prefer-temporal -- Target browsers have no Temporal polyfill.
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
    ? formatDateParts(date, language, { timeZone: 'UTC', withTime: false })
    : value;
};

export const formatUpdatedAt = (value: string, language: Language): string => {
  // eslint-disable-next-line unicorn/prefer-temporal -- Target browsers have no Temporal polyfill.
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : formatDateParts(date, language, { withTime: true });
};

export const resetLocaleSupportCache = () => {
  supportCache.clear();
};
