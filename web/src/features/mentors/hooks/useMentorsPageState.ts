/* eslint-disable camelcase -- PostHog wire contract. */
import {
  type Accessor,
  createEffect,
  createMemo,
  createResource,
  createSignal,
  onCleanup,
  type Setter,
} from 'solid-js';

import type { Language } from '@/lib/i18n';
import type { Diploma } from '@/types';

import { captureAnalytics } from '@/lib/analytics';
import { createSearchAnalytics } from '@/lib/search-analytics';

import type { CatalogResult } from '../api';
import type { SortField } from '../types';

import {
  getInitialMentorsPageState,
  syncMentorsSearchParams,
} from '../query-state';
import {
  createStatusToneResolver,
  getStatusInfo as getSectionStatusInfo,
  type SectionConfig,
} from '../section';
import {
  buildFilteredSummaries,
  buildStatusOptions,
  buildYearOptions,
  calculateMedianDiplomas,
  calculateTopMentorsDiplomaCount,
  countByTone,
} from '../selectors';
import { aggregateByMentor } from '../utils';
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
  let nextIsRetry = false;
  let disposed = false;
  onCleanup(() => {
    disposed = true;
    generation += 1;
  });
  const [resource, actions] = createResource<Diploma[]>(
    // Resource settlement retains existing fallback/error behavior and reports only terminal states.
    // eslint-disable-next-line sonarjs/cognitive-complexity -- The fetcher must preserve its business error path.
    async (_source, info) => {
      generation += 1;
      const currentGeneration = generation;
      requestNumber += 1;
      const requestNumberAtStart = requestNumber;
      const trigger = nextIsRetry ? 'retry' : 'initial';
      nextIsRetry = false;
      options.setLoadError(null);

      try {
        const result = await options.config.fetchTheses();
        if (!disposed && currentGeneration === generation) {
          captureAnalytics('catalog_load_result', {
            outcome: result.stale ? 'stale' : 'fresh',
            section: options.config.id,
            trigger: requestNumberAtStart === 1 ? 'initial' : trigger,
          });
        }
        options.setIsStale(result.stale);
        options.setLastUpdatedAt(getLastUpdatedAt(result));
        return result.items;
      } catch (error) {
        if (!disposed && currentGeneration === generation) {
          captureAnalytics('catalog_load_result', {
            outcome: 'error',
            retained_data: info.value !== undefined,
            section: options.config.id,
            trigger: requestNumberAtStart === 1 ? 'initial' : trigger,
          });
        }
        options.setLoadError(
          error instanceof Error
            ? error
            : new Error('Catalog request failed', { cause: error }),
        );

        return info.value ?? [];
      }
    },
  );
  const refetch = (...args: Parameters<typeof actions.refetch>) => {
    nextIsRetry = true;
    return actions.refetch(...args);
  };
  return [resource, { ...actions, refetch }] as const;
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
  const [diplomas, { refetch: refetchDiplomas }] = createThesesResource({
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
  const medianDiplomas = createMemo(() =>
    calculateMedianDiplomas(mentorSummaries()),
  );
  const topTenDiplomasCount = createMemo(() =>
    calculateTopMentorsDiplomaCount(mentorSummaries(), 10),
  );
  const topTenMentorsShare = createMemo(() => {
    const totalDiplomas = totalDiplomasCount();
    return totalDiplomas === 0
      ? 0
      : (topTenDiplomasCount() / totalDiplomas) * 100;
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
    ready: () => !diplomas.loading && loadError() === null,
    section: config.id,
  });

  const { expandedMentors, isExpanded, manualExpanded, toggleExpanded } =
    createMentorExpansion({
      filteredSummaries,
      initialExpanded: initialState.expandedMentors,
      initialSearch: initialState.search,
      isReady: () => !diplomas.loading && loadError() === null,
      onOpen: (mentor) => {
        searchAnalytics.captureResultClick(
          filteredSummaries().findIndex((summary) => summary.mentor === mentor),
        );
      },
      search,
    });

  createEffect(() => {
    syncMentorsSearchParams({
      expandedMentors: manualExpanded(),
      search: search(),
      sortDirection: sortDirection(),
      sortField: sortField(),
      statusFilter: statusFilter(),
      yearFilter: yearFilter(),
    });
  });

  const getCountShare = (count: number) => count / maxDiplomas();

  const getStatusInfo = (status: string) =>
    getSectionStatusInfo(config, status);

  const handleSort = (field: SortField) => {
    if (sortField() === field) {
      setSortDirection((previous) => (previous === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortField(field);
    setSortDirection(field === 'totalDiplomas' ? 'desc' : 'asc');
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setYearFilter('');
  };

  return {
    clearFilters,
    diplomas,
    expandedMentors,
    filteredDiplomasCount,
    filteredSummaries,
    getCountShare,
    getSearchAttemptId: searchAnalytics.getSearchAttemptId,
    getStatusInfo,
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
  };
};
