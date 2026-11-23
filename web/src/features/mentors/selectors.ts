import type { Diploma, MentorSummary } from '@/types';

import { type Language, languageLocales } from '@/lib/i18n';
import { matchesStatusSearch } from '@/lib/statuses';

import type { SectionId, StatusTone } from './section';
import type { FilteredMentorSummary, SortDirection, SortField } from './types';

import {
  displayName,
  getSubmissionDay,
  getSubmissionYear,
  getTodayDay,
  matchesNormalizedSearch,
  normalizeSearchText,
} from './utils';

const collator = new Intl.Collator();

// The status filter holds either an exact status or a whole state such as
// "tone:progress", so state filters share the URL param, "clear filters" and
// analytics with the detailed status filter.
export const TONE_FILTER_PREFIX = 'tone:';

export const FILTERABLE_TONES = ['progress', 'complete'] as const;

export const toneFilterValue = (tone: StatusTone) =>
  `${TONE_FILTER_PREFIX}${tone}`;

export const parseToneFilter = (value: string): null | StatusTone => {
  if (!value.startsWith(TONE_FILTER_PREFIX)) return null;
  const tone = value.slice(TONE_FILTER_PREFIX.length);
  return (FILTERABLE_TONES as readonly string[]).includes(tone)
    ? (tone as StatusTone)
    : null;
};

// The year filter's special value: theses from the last RECENT_DAYS days.
export const RECENT_FILTER = 'recent';
export const RECENT_DAYS = 30;

type FilterOptions = {
  getStatusTone: (status: string) => StatusTone;
  query: string;
  section: SectionId;
  selectedStatus: string;
  selectedTone: null | StatusTone;
  selectedYear: string;
  today: number;
};

const matchesYearFilter = (diploma: Diploma, options: FilterOptions) => {
  if (options.selectedYear.length === 0) return true;
  if (options.selectedYear !== RECENT_FILTER)
    return getSubmissionYear(diploma.dateOfSubmission) === options.selectedYear;

  const day = getSubmissionDay(diploma.dateOfSubmission);
  // Future-dated entries (scheduled defenses) count as recent too.
  return day !== null && day > options.today - RECENT_DAYS;
};

const matchesStatusFilter = (diploma: Diploma, options: FilterOptions) =>
  options.selectedTone === null
    ? options.selectedStatus.length === 0 ||
      diploma.status === options.selectedStatus
    : options.getStatusTone(diploma.status) === options.selectedTone;

const matchesDiploma = (
  diploma: Diploma,
  options: FilterOptions,
  mentorMatches: boolean,
): boolean => {
  const matchesStatus = matchesStatusFilter(diploma, options);
  const matchesYear = matchesYearFilter(diploma, options);
  const matchesSearch =
    options.query.length === 0 ||
    mentorMatches ||
    matchesNormalizedSearch(diploma.title, options.query) ||
    matchesNormalizedSearch(diploma.student, options.query) ||
    matchesNormalizedSearch(diploma.member1, options.query) ||
    matchesNormalizedSearch(diploma.member2, options.query) ||
    matchesStatusSearch(diploma.status, options.section, options.query);

  return matchesStatus && matchesYear && matchesSearch;
};

type CompareOptions = {
  // With any filter, count sorts rank by the matching theses, so a year
  // filter ranks mentors by that year's theses.
  hasFilters: boolean;
  language: Language;
  sortDirection: SortDirection;
  sortField: SortField;
};

const compareSummaries = (
  a: FilteredMentorSummary,
  b: FilteredMentorSummary,
  options: CompareOptions,
): number => {
  let comparison: number;

  if (options.sortField === 'mentor') {
    comparison = displayName(a.mentor, options.language).localeCompare(
      displayName(b.mentor, options.language),
      languageLocales[options.language],
    );
  } else {
    const countOf = (summary: FilteredMentorSummary) =>
      options.hasFilters
        ? summary.filteredDiplomas.length
        : summary.totalDiplomas;
    comparison =
      options.sortField === 'inProgress'
        ? a.inProgressCount - b.inProgressCount ||
          // Equal workloads: the more experienced mentor first.
          countOf(a) - countOf(b)
        : countOf(a) - countOf(b);
  }

  return options.sortDirection === 'asc' ? comparison : -comparison;
};

export const buildFilteredSummaries = (options: {
  getStatusTone?: (status: string) => StatusTone;
  language?: Language;
  query: string;
  section?: SectionId;
  selectedStatus: string;
  selectedYear: string;
  sortDirection: SortDirection;
  sortField: SortField;
  summaries: MentorSummary[];
  today?: number;
}): FilteredMentorSummary[] => {
  const normalizedQuery = normalizeSearchText(options.query);

  const filterOptions: FilterOptions = {
    getStatusTone: options.getStatusTone ?? (() => 'unknown'),
    query: normalizedQuery,
    section: options.section ?? 'diplomas',
    selectedStatus: options.selectedStatus,
    selectedTone: parseToneFilter(options.selectedStatus),
    selectedYear: options.selectedYear,
    today: options.today ?? getTodayDay(),
  };

  const results = options.summaries
    .map((summary) => {
      const mentorMatches =
        normalizedQuery.length === 0 ||
        matchesNormalizedSearch(summary.mentor, normalizedQuery);

      const matchingDiplomas = summary.diplomas.filter((diploma) =>
        matchesDiploma(diploma, filterOptions, mentorMatches),
      );

      return matchingDiplomas.length === 0
        ? null
        : {
            ...summary,
            filteredDiplomas: matchingDiplomas,
            inProgressCount: matchingDiplomas.filter(
              (diploma) =>
                filterOptions.getStatusTone(diploma.status) === 'progress',
            ).length,
            matchedByMentor: normalizedQuery.length > 0 && mentorMatches,
          };
    })
    .filter(
      (summary): summary is NonNullable<typeof summary> => summary !== null,
    );

  return results.toSorted((a, b) =>
    compareSummaries(a, b, {
      hasFilters:
        options.query.length > 0 ||
        options.selectedStatus.length > 0 ||
        options.selectedYear.length > 0,
      language: options.language ?? 'mk',
      sortDirection: options.sortDirection,
      sortField: options.sortField,
    }),
  );
};

// Theses per state, used for the state filter chip counts.
export const countByTone = (
  summaries: FilteredMentorSummary[],
  getStatusTone: (status: string) => StatusTone,
): Record<StatusTone, number> => {
  const counts: Record<StatusTone, number> = {
    cancelled: 0,
    complete: 0,
    progress: 0,
    unknown: 0,
  };

  for (const summary of summaries) {
    for (const diploma of summary.filteredDiplomas) {
      counts[getStatusTone(diploma.status)] += 1;
    }
  }

  return counts;
};

export const buildStatusOptions = (
  diplomaData: Diploma[] | undefined,
  getStatusStage: (status: string) => null | number,
) =>
  [...new Set((diplomaData ?? []).map((diploma) => diploma.status))].sort(
    (a, b) => {
      const stageA = getStatusStage(a) ?? Number.MAX_SAFE_INTEGER;
      const stageB = getStatusStage(b) ?? Number.MAX_SAFE_INTEGER;

      return stageA === stageB ? collator.compare(a, b) : stageA - stageB;
    },
  );

export const buildYearOptions = (diplomaData: Diploma[] | undefined) =>
  [
    ...new Set(
      (diplomaData ?? [])
        .map((diploma) => getSubmissionYear(diploma.dateOfSubmission))
        .filter((year): year is string => year !== null),
    ),
  ].sort((a, b) => Number(b) - Number(a));

export const calculateMedianDiplomas = (summaries: MentorSummary[]) => {
  if (summaries.length === 0) return 0;

  const counts = summaries
    .map((summary) => summary.totalDiplomas)
    .sort((a, b) => a - b);
  const mid = Math.floor(counts.length / 2);

  return counts.length % 2 === 0
    ? ((counts[mid - 1] ?? 0) + (counts[mid] ?? 0)) / 2
    : (counts[mid] ?? 0);
};

export const calculateTopMentorsDiplomaCount = (
  summaries: MentorSummary[],
  limit: number,
) =>
  summaries
    .slice(0, limit)
    .reduce((total, summary) => total + summary.totalDiplomas, 0);
