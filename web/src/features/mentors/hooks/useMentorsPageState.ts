/* eslint-disable camelcase -- PostHog wire contract. */
import {
  type Accessor,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  type Setter,
  untrack,
} from 'solid-js';

import type { Language } from '@/lib/i18n';
import type { Diploma, MentorSummary } from '@/types';

import { captureAnalytics } from '@/lib/analytics';
import { createSearchAnalytics } from '@/lib/search-analytics';

import type { CatalogResult } from '../api';

import {
  getInitialMentorsPageState,
  syncMentorsSearchParams,
} from '../query-state';
import {
  createStatusToneResolver,
  getStatusInfo as getSectionStatusInfo,
  type SectionConfig,
  type StatusTone,
} from '../section';
import {
  buildFilteredSummaries,
  buildStatusOptions,
  buildYearOptions,
  calculateMedianDiplomas,
  calculateTopMentorsDiplomaCount,
  countByTone,
} from '../selectors';
import { isCountSort, type SortField } from '../types';
import { aggregateByMentor, countCommitteeSeats } from '../utils';
import { countByYear } from '../year-stats';
import {
  countAutoExpandable,
  createMentorExpansion,
} from './createMentorExpansion';

type ThesesResourceOptions = {
  readonly config: SectionConfig;
  readonly setIsStale: Setter<boolean>;
  readonly setLastUpdatedAt: Setter<null | string>;
  readonly setLoadError: Setter<Error | null>;
};

const getLastUpdatedAt = (result: CatalogResult): null | string =>
  result.updatedAt !== null || result.stale
    ? result.updatedAt
    : new Date().toISOString(); // eslint-disable-line unicorn/prefer-temporal -- Temporal is not yet available in the target browsers and the project ships no polyfill.

const createThesesResource = (options: ThesesResourceOptions) => {
  let generation = 0;
  let requestNumber = 0;
  let disposed = false;
  const [items, setItems] = createSignal<Diploma[] | undefined>();
  const [loading, setLoading] = createSignal(true);
  const [hasLoadedOnce, setHasLoadedOnce] = createSignal(false);
  onCleanup(() => {
    disposed = true;
    generation += 1;
  });

  // Settlement retains existing fallback/error behavior and reports only terminal states.

  const load = async (isRetry: boolean) => {
    generation += 1;
    const currentGeneration = generation;
    requestNumber += 1;
    const requestNumberAtStart = requestNumber;
    const trigger =
      requestNumberAtStart === 1 || !isRetry ? 'initial' : 'retry';
    const retained = untrack(items);
    options.setLoadError(null);
    setLoading(true);

    try {
      const result = await options.config.fetchTheses();
      if (!disposed && currentGeneration === generation) {
        captureAnalytics('catalog_load_result', {
          outcome: result.stale ? 'stale' : 'fresh',
          section: options.config.id,
          trigger,
        });
        options.setIsStale(result.stale);
        options.setLastUpdatedAt(getLastUpdatedAt(result));
        setItems(result.items);
        setHasLoadedOnce(true);
      }
    } catch (error) {
      if (!disposed && currentGeneration === generation) {
        captureAnalytics('catalog_load_result', {
          outcome: 'error',
          retained_data: retained !== undefined,
          section: options.config.id,
          trigger,
        });
        options.setLoadError(
          error instanceof Error
            ? error
            : new Error('Catalog request failed', { cause: error }),
        );
        setItems(retained ?? []);
      }
    } finally {
      if (!disposed && currentGeneration === generation) setLoading(false);
    }
  };

  // The initial fetch starts from an effect's apply phase: writing signals in
  // the component body is an owned-scope write in Solid 2.
  createEffect(
    () => options.config.id,
    () => {
      void load(false);
    },
  );

  const resource = Object.assign(() => items(), { loading });
  const refetch = () => load(true);
  return [resource, { hasLoadedOnce, refetch }] as const;
};

// Whole-section statistics; like the stats cards, they ignore the filters.
const createSectionStats = (options: {
  diplomas: Accessor<Diploma[] | undefined>;
  getStatusTone: (status: string) => StatusTone;
  mentorSummaries: Accessor<MentorSummary[]>;
  totalDiplomasCount: Accessor<number>;
}) => {
  const topTenDiplomasCount = createMemo(() =>
    calculateTopMentorsDiplomaCount(options.mentorSummaries(), 10),
  );
  return {
    committeeCounts: createMemo(() =>
      countCommitteeSeats(options.diplomas() ?? []),
    ),
    medianDiplomas: createMemo(() =>
      calculateMedianDiplomas(options.mentorSummaries()),
    ),
    topTenDiplomasCount,
    topTenMentorsShare: createMemo(() => {
      const total = options.totalDiplomasCount();
      return total === 0 ? 0 : (topTenDiplomasCount() / total) * 100;
    }),
    yearStats: createMemo(() =>
      countByYear(options.diplomas() ?? [], options.getStatusTone),
    ),
  };
};

export const useMentorsPageState = (
  config: SectionConfig,
  language: Accessor<Language> = () => 'mk',
  initialSearch?: string,
) => {
  const initialState = getInitialMentorsPageState(initialSearch);
  const [isStale, setIsStale] = createSignal(false);
  const [lastUpdatedAt, setLastUpdatedAt] = createSignal<null | string>(null);
  const [loadError, setLoadError] = createSignal<Error | null>(null);
  const [diplomas, { hasLoadedOnce, refetch: refetchDiplomas }] =
    createThesesResource({
      config,
      setIsStale,
      setLastUpdatedAt,
      setLoadError,
    });
  const [search, setSearch] = createSignal(initialState.search);
  const [statusFilter, setStatusFilter] = createSignal(
    initialState.statusFilter,
  );
  const [yearFilter, setYearFilter] = createSignal(initialState.yearFilter);
  const [sortField, setSortField] = createSignal(initialState.sortField);
  const [sortDirection, setSortDirection] = createSignal(
    initialState.sortDirection,
  );
  const mentorSummaries = createMemo(() => {
    const data = diplomas();
    return data ? aggregateByMentor(data) : [];
  });
  const getStatusTone = createStatusToneResolver(config);
  const filteredSummaries = createMemo(() =>
    buildFilteredSummaries({
      getStatusTone,
      language: sortField() === 'mentor' ? language() : 'mk',
      query: search(),
      section: config.id,
      selectedStatus: statusFilter(),
      selectedYear: yearFilter(),
      sortDirection: sortDirection(),
      sortField: sortField(),
      summaries: mentorSummaries(),
    }),
  );
  const totalDiplomasCount = createMemo(() => diplomas()?.length ?? 0);
  const totalMentorsCount = createMemo(() => mentorSummaries().length);
  const filteredDiplomasCount = createMemo(() =>
    filteredSummaries().reduce(
      (total, summary) => total + summary.filteredDiplomas.length,
      0,
    ),
  );
  // Theses per state under the current search and year, ignoring the status
  // filter itself, so the chips show what selecting them would yield.
  const toneCounts = createMemo(() =>
    countByTone(
      buildFilteredSummaries({
        getStatusTone,
        query: search(),
        section: config.id,
        selectedStatus: '',
        selectedYear: yearFilter(),
        sortDirection: 'desc',
        sortField: 'totalDiplomas',
        summaries: mentorSummaries(),
      }),
      getStatusTone,
    ),
  );
  const statusOptions = createMemo(() =>
    buildStatusOptions(diplomas(), config.getStatusStage),
  );
  const yearOptions = createMemo(() => buildYearOptions(diplomas()));
  const {
    committeeCounts,
    medianDiplomas,
    topTenDiplomasCount,
    topTenMentorsShare,
    yearStats,
  } = createSectionStats({
    diplomas,
    getStatusTone,
    mentorSummaries,
    totalDiplomasCount,
  });
  const hasActiveFilters = createMemo(
    () =>
      search().trim().length > 0 ||
      statusFilter().length > 0 ||
      yearFilter().length > 0,
  );
  const maxDiplomas = createMemo(() => {
    const summaries = mentorSummaries();
    return summaries.length === 0
      ? 1
      : Math.max(...summaries.map((summary) => summary.totalDiplomas));
  });

  // This local-only key invalidates linkage synchronously, even before effects run.
  const searchIntent = () => ({
    filters: JSON.stringify([statusFilter(), yearFilter()]),
    query: search(),
    sort: JSON.stringify([sortField(), sortDirection()]),
  });
  const searchAnalytics = createSearchAnalytics({
    active: () => search().trim().length > 0,
    autoExpandedCount: () => countAutoExpandable(filteredSummaries()),
    count: () => filteredSummaries().length,
    intent: searchIntent,
    ready: () => !diplomas.loading() && loadError() === null,
    section: config.id,
  });

  const { expandedMentors, isExpanded, manualExpanded, toggleExpanded } =
    createMentorExpansion({
      filteredSummaries,
      hasLoadedOnce,
      initialExpanded: initialState.expandedMentors,
      initialSearch: initialState.search,
      onOpen: (mentor) => {
        searchAnalytics.captureResultClick(
          filteredSummaries().findIndex((summary) => summary.mentor === mentor),
        );
      },
      search,
    });

  createEffect(
    () => ({
      expandedMentors: manualExpanded(),
      search: search(),
      sortDirection: sortDirection(),
      sortField: sortField(),
      statusFilter: statusFilter(),
      yearFilter: yearFilter(),
    }),
    (params) => {
      syncMentorsSearchParams(params);
    },
  );

  const getCountShare = (count: number) => count / maxDiplomas();

  const getStatusInfo = (status: string) =>
    getSectionStatusInfo(config, status);

  const handleSort = (field: SortField) => {
    if (sortField() === field) {
      setSortDirection((previous) => (previous === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortField(field);
    setSortDirection(isCountSort(field) ? 'desc' : 'asc');
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setYearFilter('');
  };

  return {
    clearFilters,
    committeeCounts,
    diplomas,
    expandedMentors,
    filteredDiplomasCount,
    filteredSummaries,
    getCountShare,
    getSearchAttemptId: searchAnalytics.getSearchAttemptId,
    getStatusInfo,
    getStatusTone,
    handleSort,
    hasActiveFilters,
    isExpanded,
    isStale,
    lastUpdatedAt,
    loadError,
    medianDiplomas,
    refetchDiplomas,
    search,
    setSearch,
    setStatusFilter,
    setYearFilter,
    sortDirection,
    sortField,
    statusFilter,
    statusOptions,
    toggleExpanded,
    toneCounts,
    topTenDiplomasCount,
    topTenMentorsShare,
    totalDiplomasCount,
    totalMentorsCount,
    yearFilter,
    yearOptions,
    yearStats,
  };
};
