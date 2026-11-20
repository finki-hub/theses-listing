import { describe, expect, it } from 'vitest';

import type { Diploma } from '@/types';

import { buildFilteredSummaries } from './selectors';
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
