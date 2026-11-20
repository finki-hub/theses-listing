import { describe, expect, it } from 'vitest';

import type { Diploma } from '@/types';

import { createStatusToneResolver, DIPLOMAS_SECTION } from './section';
import {
  buildFilteredSummaries,
  countByTone,
  parseToneFilter,
  toneFilterValue,
} from './selectors';
import { aggregateByMentor } from './utils';

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
