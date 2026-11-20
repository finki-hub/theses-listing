import { describe, expect, it } from 'vitest';

import type { Diploma } from '@/types';

import type { StatusTone } from './section';

import {
  activeYearRange,
  countByYear,
  findPeakYear,
  niceAxisMax,
} from './year-stats';

const thesis = (dateOfSubmission: string, status = 'done'): Diploma => ({
  dateOfSubmission,
  description: '',
  fileId: null,
  member1: '',
  member2: '',
  mentor: 'Mentor',
  status,
  student: 'Student',
  title: 'Title',
});

const toneOf = (status: string): StatusTone =>
  status === 'done' ? 'complete' : 'progress';

describe('countByYear', () => {
  it('counts per year and state, fills gaps and counts undated theses', () => {
    const stats = countByYear(
      [
        thesis('01.02.2020'),
        thesis('03.04.2020', 'open'),
        thesis('05.06.2022 11:00'),
        thesis(''),
      ],
      toneOf,
    );

    expect(stats.undated).toBe(1);
    expect(stats.years.map(({ total, year }) => [year, total])).toEqual([
      ['2020', 2],
      ['2021', 0],
      ['2022', 1],
    ]);
    expect(stats.years[0]?.byTone).toMatchObject({ complete: 1, progress: 1 });
  });

  it('spans a given range, so mentors share one time axis', () => {
    const stats = countByYear([thesis('01.02.2021')], toneOf, ['2019', '2022']);

    expect(stats.years.map(({ total }) => total)).toEqual([0, 0, 1, 0]);
  });

  it('returns no years without dated theses', () => {
    expect(countByYear([thesis('')], toneOf).years).toEqual([]);
  });
});

describe('summaries', () => {
  const { years } = countByYear(
    [
      thesis('01.01.2019'),
      thesis('01.01.2021'),
      thesis('01.01.2021'),
      thesis('01.01.2022'),
      thesis('01.01.2022'),
    ],
    toneOf,
    ['2018', '2023'],
  );

  it('finds the earliest busiest year', () => {
    expect(findPeakYear(years)).toMatchObject({ total: 2, year: '2021' });
  });

  it('describes the active range, ignoring empty edge years', () => {
    expect(activeYearRange(years)).toBe('2019–2022');
    expect(activeYearRange(years.slice(1, 2))).toBe('2019');
    expect(activeYearRange([])).toBeNull();
  });
});

describe('niceAxisMax', () => {
  it.each([
    [0, 1],
    [3, 3],
    [7, 8],
    [18, 20],
    [22, 25],
    [677, 800],
    [450, 500],
  ])('rounds %d up to %d', (value, expected) => {
    expect(niceAxisMax(value)).toBe(expected);
  });
});
