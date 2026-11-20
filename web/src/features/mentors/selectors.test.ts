import { describe, expect, it } from 'vitest';

import type { Diploma } from '@/types';

import { createStatusToneResolver, DIPLOMAS_SECTION } from './section';
import {
  buildFilteredSummaries,
  countByTone,
  parseToneFilter,
  toneFilterValue,
} from './selectors';
import { aggregateByMentor, countCommitteeSeats } from './utils';

const thesis: Diploma = {
  dateOfSubmission: '03.07.2026',
  description: 'Апстракт за машинско учење',
  fileId: null,
  member1: 'Ана Анева',
  member2: 'Борис Борисов',
  mentor: 'Ментор Менторски',
  status: 'Пријава',
  student: '123456 - Студент Студентски',
  title: 'Наслов',
};

const search = (query: string) =>
  buildFilteredSummaries({
    query,
    selectedStatus: '',
    selectedYear: '',
    sortDirection: 'desc',
    sortField: 'totalDiplomas',
    summaries: aggregateByMentor([thesis]),
  });

describe('buildFilteredSummaries search', () => {
  it('matches committee members in either script', () => {
    expect(search('Борисов')).toHaveLength(1);
    expect(search('ana aneva')).toHaveLength(1);
    expect(search('Борисов')[0]?.matchedByMentor).toBe(false);
  });

  it('does not search abstracts', () => {
    expect(search('апстракт')).toHaveLength(0);
  });
});

describe('state filter', () => {
  const getStatusTone = createStatusToneResolver(DIPLOMAS_SECTION);
  const theses: Diploma[] = [
    thesis,
    { ...thesis, status: 'Одбрана', title: 'Одбранет' },
    { ...thesis, status: 'Откажано од менторот', title: 'Откажан' },
  ];
  const filter = (selectedStatus: string) =>
    buildFilteredSummaries({
      getStatusTone,
      query: '',
      section: 'diplomas',
      selectedStatus,
      selectedYear: '',
      sortDirection: 'desc',
      sortField: 'totalDiplomas',
      summaries: aggregateByMentor(theses),
    });

  const titles = (value: string) =>
    filter(value)
      .flatMap((summary) => summary.filteredDiplomas)
      .map((diploma) => diploma.title);

  it('filters by state and counts each state', () => {
    expect(titles(toneFilterValue('complete'))).toEqual(['Одбранет']);
    expect(titles(toneFilterValue('cancelled'))).toEqual(['Откажан']);
    expect(countByTone(filter(''), getStatusTone)).toEqual({
      cancelled: 1,
      complete: 1,
      progress: 1,
      unknown: 0,
    });
  });

  it('only accepts known states', () => {
    expect(parseToneFilter('tone:progress')).toBe('progress');
    expect(parseToneFilter('tone:unknown')).toBeNull();
    expect(parseToneFilter('Пријава')).toBeNull();
  });
});

describe('current workload', () => {
  const getStatusTone = createStatusToneResolver(DIPLOMAS_SECTION);
  // Busy: 1 of 3 in progress. Free: 0 of 1. Load: 2 of 2.
  const theses: Diploma[] = [
    { ...thesis, mentor: 'Busy', status: 'Одбрана' },
    { ...thesis, mentor: 'Busy', status: 'Одбрана' },
    { ...thesis, mentor: 'Busy', status: 'Пријава' },
    { ...thesis, mentor: 'Free', status: 'Одбрана' },
    { ...thesis, mentor: 'Load', status: 'Пријава' },
    { ...thesis, mentor: 'Load', status: 'Пријава' },
  ];
  const summaries = buildFilteredSummaries({
    getStatusTone,
    query: '',
    section: 'diplomas',
    selectedStatus: '',
    selectedYear: '',
    sortDirection: 'desc',
    sortField: 'inProgress',
    summaries: aggregateByMentor(theses),
  });

  it('counts theses in progress per mentor', () => {
    expect(
      Object.fromEntries(
        summaries.map((summary) => [summary.mentor, summary.inProgressCount]),
      ),
    ).toEqual({ Busy: 1, Free: 0, Load: 2 });
  });

  it('sorts by theses in progress', () => {
    expect(summaries.map((summary) => summary.mentor)).toEqual([
      'Load',
      'Busy',
      'Free',
    ]);
  });
});

describe('countCommitteeSeats', () => {
  it('counts both committee seats and skips empty ones', () => {
    const counts = countCommitteeSeats([
      thesis,
      { ...thesis, member1: 'Борис Борисов', member2: '' },
    ]);

    expect(counts.get('Борис Борисов')).toBe(2);
    expect(counts.get('Ана Анева')).toBe(1);
    expect(counts.has('')).toBe(false);
  });
});
