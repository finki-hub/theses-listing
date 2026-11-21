const DEFAULT_DIPLOMAS_API_URL = 'https://bachelors-api.finki-hub.com';
const DEFAULT_MASTERS_API_URL = 'https://masters-api.finki-hub.com';

// Playwright imports these constants from Node, where Vite has not defined
// import.meta.env; the defaults apply in that context.
const env = import.meta.env as Record<string, string | undefined> | undefined;

const trimTrailingSlashes = (value: string): string => {
  let end = value.length;

  while (end > 0 && value[end - 1] === '/') {
    end -= 1;
  }

  return value.slice(0, end);
};

export const resolveApiUrl = (
  value: string | undefined,
  fallback: string,
): string => {
  const trimmed = value?.trim() ?? '';

  return trimTrailingSlashes(trimmed.length > 0 ? trimmed : fallback);
};

export const DIPLOMAS_API_URL = resolveApiUrl(
  env?.['VITE_DIPLOMAS_API_URL'],
  DEFAULT_DIPLOMAS_API_URL,
);
export const MASTERS_API_URL = resolveApiUrl(
  env?.['VITE_MASTERS_API_URL'],
  DEFAULT_MASTERS_API_URL,
);

export const DIPLOMAS_LIST_URL = `${DIPLOMAS_API_URL}/diplomas`;
export const DIPLOMAS_FILE_URL = `${DIPLOMAS_API_URL}/diplomas/download/`;
export const MASTERS_LIST_URL = `${MASTERS_API_URL}/masters`;
export const MASTERS_FILE_URL = `${MASTERS_API_URL}/masters/download/`;

export const STATUS_STAGES: Array<[string, number]> = [
  ['пријава', 1],
  ['прифаќање', 2],
  ['валидирање од службата', 3],
  ['одобрение од продекан', 4],
  ['одобрение за оценка', 5],
  ['забелешки', 6],
  ['валидирање на услови', 7],
  ['одбран', 8],
  ['архив', 9],
];
