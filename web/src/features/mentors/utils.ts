import type { Language } from '@/lib/i18n';
import type { Diploma, MentorSummary } from '@/types';

const SUBMISSION_YEAR_REGEX = /^\d{4}$/u;
const WHITESPACE_REGEX = /\s+/u;

export const aggregateByMentor = (diplomas: Diploma[]): MentorSummary[] => {
  const mentorMap = new Map<string, Diploma[]>();

  for (const diploma of diplomas) {
    const mentor = diploma.mentor.trim();
    if (!mentor) continue;

    const existing = mentorMap.get(mentor);
    if (existing) {
      existing.push(diploma);
    } else {
      mentorMap.set(mentor, [diploma]);
    }
  }

  return Array.from(mentorMap, ([mentor, mentorDiplomas]) => ({
    diplomas: mentorDiplomas,
    mentor,
    totalDiplomas: mentorDiplomas.length,
  })).sort((a, b) => b.totalDiplomas - a.totalDiplomas);
};

// How many theses each person sat on the committee for (either seat).
export const countCommitteeSeats = (
  diplomas: readonly Diploma[],
): ReadonlyMap<string, number> => {
  const counts = new Map<string, number>();
  for (const diploma of diplomas) {
    for (const member of [diploma.member1, diploma.member2]) {
      const name = member.trim();
      if (name.length > 0) counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }

  return counts;
};

// Days since 1970-01-01 for a civil date (Howard Hinnant's algorithm), so
// dates compare as plain numbers without Date objects or time zones.
const toDayNumber = (year: number, month: number, day: number) => {
  const shifted = month <= 2 ? year - 1 : year;
  const era = Math.floor(shifted / 400);
  const yearOfEra = shifted - era * 400;
  const dayOfYear =
    Math.floor((153 * (month + (month > 2 ? -3 : 9)) + 2) / 5) + day - 1;
  const dayOfEra =
    yearOfEra * 365 +
    Math.floor(yearOfEra / 4) -
    Math.floor(yearOfEra / 100) +
    dayOfYear;
  return era * 146_097 + dayOfEra - 719_468;
};

// "DD.MM.YYYY" (optionally followed by a time) as a day number.
export const getSubmissionDay = (value: string): null | number => {
  const datePart = value.trim().split(WHITESPACE_REGEX, 1)[0] ?? '';
  const [day, month, year] = datePart.split('.').map(Number);
  return day === undefined ||
    month === undefined ||
    year === undefined ||
    !Number.isSafeInteger(day) ||
    !Number.isSafeInteger(month) ||
    !Number.isSafeInteger(year) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
    ? null
    : toDayNumber(year, month, day);
};

// Today in the reader's time zone, as a day number.
export const getTodayDay = (): number => {
  const parts = new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  }).formatToParts();
  const part = (type: string) =>
    Number(parts.find((entry) => entry.type === type)?.value);
  return toDayNumber(part('year'), part('month'), part('day'));
};

export const getSubmissionYear = (value: string): null | string => {
  // Masters dates carry a time suffix ("03.07.2026 11:00"); the year lives in
  // the leading date token.
  const datePart = value.trim().split(WHITESPACE_REGEX, 1)[0] ?? '';
  const parts = datePart.split('.').filter(Boolean);
  if (parts.length !== 3) return null;

  const year = parts[2]?.trim();
  return year && SUBMISSION_YEAR_REGEX.test(year) ? year : null;
};

export const createFileUrlGetter =
  (baseUrl: string) =>
  (fileId: null | string): null | string =>
    fileId === null ? null : `${baseUrl}${fileId}`;

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  ѓ: 'gj',
  д: 'd',
  е: 'e',
  ж: 'zh',
  з: 'z',
  ѕ: 'dz',
  и: 'i',
  ј: 'j',
  к: 'k',
  ќ: 'kj',
  л: 'l',
  љ: 'lj',
  м: 'm',
  н: 'n',
  њ: 'nj',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'c',
  ч: 'ch',
  џ: 'dzh',
  ш: 'sh',
};

const LATIN_EQUIVALENTS: Array<[string, string]> = [
  ['ı', 'i'],
  ['dž', 'dzh'],
  ['dj', 'gj'],
  ['đ', 'gj'],
  ['ǵ', 'gj'],
  ['kj', 'kj'],
  ['ḱ', 'kj'],
  ['lj', 'lj'],
  ['nj', 'nj'],
  ['zh', 'zh'],
  ['ž', 'zh'],
  ['ch', 'ch'],
  ['č', 'ch'],
  ['sh', 'sh'],
  ['š', 'sh'],
  ['dz', 'dz'],
  ['c', 'c'],
];

export const transliterateToLatin = (value: string): string =>
  value.replaceAll(/\p{Letter}+/gu, (word) => {
    const allUppercase = word === word.toUpperCase();
    return Array.from(word, (character) => {
      const lower = character.toLowerCase();
      const latin = CYRILLIC_TO_LATIN[lower];
      if (!latin) return character;
      if (character === lower) return latin;
      return allUppercase
        ? latin.toUpperCase()
        : latin.charAt(0).toUpperCase() + latin.slice(1);
    }).join('');
  });

export const displayName = (value: string, language: Language): string =>
  language === 'mk' ? value : transliterateToLatin(value);

const normalizeLatinVariants = (value: string) => {
  let normalized = value;

  for (const [from, to] of LATIN_EQUIVALENTS) {
    normalized = normalized.replaceAll(from, () => to);
  }

  return normalized;
};

export const normalizeSearchText = (value: string) =>
  normalizeLatinVariants(transliterateToLatin(value.toLowerCase()))
    .normalize('NFKD')
    .replaceAll(/\p{Mark}+/gu, '')
    .replaceAll(/[^\p{Letter}\p{Number}]+/gu, ' ')
    .trim()
    .replaceAll(/\s+/gu, ' ');

export const matchesNormalizedSearch = (
  value: string,
  normalizedSearch: string,
) => !normalizedSearch || normalizeSearchText(value).includes(normalizedSearch);
