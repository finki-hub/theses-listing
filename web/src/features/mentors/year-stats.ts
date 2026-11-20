import type { Diploma } from '@/types';

import type { StatusTone } from './section';

import { getSubmissionYear } from './utils';

export type ToneCounts = Record<StatusTone, number>;

export type YearCount = {
  readonly byTone: ToneCounts;
  readonly total: number;
  readonly year: string;
};

export type YearStats = {
  // Theses whose date can't be parsed (some master's theses have none).
  readonly undated: number;
  // Every year from the first to the last, gaps included as zeros, so bars
  // sit on an honest time axis.
  readonly years: YearCount[];
};

const emptyToneCounts = (): ToneCounts => ({
  cancelled: 0,
  complete: 0,
  progress: 0,
  unknown: 0,
});

export const countByYear = (
  diplomas: readonly Diploma[],
  getStatusTone: (status: string) => StatusTone,
  range?: readonly string[],
): YearStats => {
  const byYear = new Map<number, ToneCounts>();
  let undated = 0;

  for (const diploma of diplomas) {
    const year = getSubmissionYear(diploma.dateOfSubmission);
    if (year === null) {
      undated += 1;
      continue;
    }

    const key = Number(year);
    const counts = byYear.getOrInsertComputed(key, () => emptyToneCounts());
    counts[getStatusTone(diploma.status)] += 1;
  }

  const keys = range?.map(Number) ?? byYear.keys().toArray();
  if (keys.length === 0) return { undated, years: [] };

  const first = Math.min(...keys);
  const last = Math.max(...keys);
  const years: YearCount[] = [];
  for (let year = first; year <= last; year += 1) {
    const byTone = byYear.get(year) ?? emptyToneCounts();
    years.push({
      byTone,
      total:
        byTone.cancelled + byTone.complete + byTone.progress + byTone.unknown,
      year: String(year),
    });
  }

  return { undated, years };
};

// The busiest year; the earliest wins a tie.
export const findPeakYear = (years: readonly YearCount[]) => {
  let peak: undefined | YearCount;
  for (const entry of years) {
    if (entry.total > (peak?.total ?? 0)) peak = entry;
  }

  return peak;
};

// Years that actually have theses, as "2014–2026" or a single "2024".
export const activeYearRange = (years: readonly YearCount[]) => {
  const active = years.filter((entry) => entry.total > 0);
  const first = active.at(0)?.year;
  const last = active.at(-1)?.year;
  if (first === undefined || last === undefined) return null;
  return first === last ? first : `${first}–${last}`;
};

// A round axis maximum at or above the largest value, tight enough that the
// tallest bar fills most of the plot.
export const niceAxisMax = (value: number) => {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  for (const step of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) {
    const candidate = step * magnitude;
    if (candidate >= value) return candidate;
  }

  return 10 * magnitude;
};
