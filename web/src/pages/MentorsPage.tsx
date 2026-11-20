import { useLocation } from '@solidjs/router';
import { RefreshCw, TriangleAlert } from 'lucide-solid';
import { createEffect, Show } from 'solid-js';

import BackToTop from '@/components/BackToTop';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SearchQueryProvider } from '@/features/mentors/components/HighlightedText';
import ListSkeleton from '@/features/mentors/components/ListSkeleton';
import MentorsList from '@/features/mentors/components/MentorsList';
import MentorsPageHeader from '@/features/mentors/components/MentorsPageHeader';
import MentorsStatsCards from '@/features/mentors/components/MentorsStatsCards';
import MentorsToolbar from '@/features/mentors/components/MentorsToolbar';
import SectionSwitch from '@/features/mentors/components/SectionSwitch';
import { useMentorsPageState } from '@/features/mentors/hooks/useMentorsPageState';
import { type SectionConfig } from '@/features/mentors/section';
import { useLanguage } from '@/lib/LanguageProvider';
import { updatePageMetadata } from '@/lib/page-metadata';

type MentorsPageProps = {
  readonly config: SectionConfig;
};

export default function MentorsPage(props: MentorsPageProps) {
  const { language, t } = useLanguage();
  const location = useLocation();
  const strings = () => t().sections[props.config.id];
  // eslint-disable-next-line solid/reactivity -- Each section reads its config and initial URL state once per mount.
  const state = useMentorsPageState(props.config, language, location.search);

  createEffect(() => {
    updatePageMetadata(language(), props.config.id, document);
  });

  return (
    <div class="min-h-screen bg-background">
      <MentorsPageHeader />

      {/* Extra bottom room so the back-to-top button never covers the last row. */}
      <main class="container mx-auto pt-6 pb-20 sm:pt-8 sm:pb-24">
        <div class="mb-6">
          <SectionSwitch
            active={props.config.id}
            search={state.search()}
          />
        </div>

        <MentorsStatsCards
          // Keep showing the previous numbers while a retry refetches.
          loading={state.diplomas.loading && state.totalDiplomasCount() === 0}
          median={state.medianDiplomas()}
          section={props.config.id}
          topTenDiplomasCount={state.topTenDiplomasCount()}
          topTenMentorsShare={state.topTenMentorsShare()}
          totalDiplomas={state.totalDiplomasCount()}
          totalMentors={state.totalMentorsCount()}
        />
        <Show when={state.hasActiveFilters()}>
          <p class="-mt-4 mb-6 text-xs text-muted-foreground">
            {t().statsUnfiltered}
          </p>
        </Show>

        {/* clip, not hidden: hidden makes a scroll container, which would
            stop the table header from sticking to the viewport. */}
        <Card class="overflow-clip">
          <CardHeader class="px-4 sm:px-6">
            <CardTitle>{strings().cardTitle}</CardTitle>
            <CardDescription>{strings().cardDescription}</CardDescription>
          </CardHeader>
          <CardContent class="px-4 pb-6 sm:px-6">
            <MentorsToolbar
              filteredDiplomasCount={state.filteredDiplomasCount()}
              filteredMentorsCount={state.filteredSummaries().length}
              hasActiveFilters={state.hasActiveFilters()}
              lastUpdatedAt={state.lastUpdatedAt()}
              onClearFilters={state.clearFilters}
              search={state.search()}
              section={props.config.id}
              setSearch={state.setSearch}
              setStatusFilter={state.setStatusFilter}
              setYearFilter={state.setYearFilter}
              statusFilter={state.statusFilter()}
              statusOptions={state.statusOptions()}
              toneCounts={state.toneCounts()}
              totalDiplomasCount={state.totalDiplomasCount()}
              totalMentorsCount={state.totalMentorsCount()}
              yearFilter={state.yearFilter()}
              yearOptions={state.yearOptions()}
            />

            <Show
              when={state.diplomas.loading && state.totalDiplomasCount() === 0}
            >
              <ListSkeleton />
            </Show>

            <Show when={state.isStale() && state.loadError() === null}>
              <div class="mb-4 flex flex-col items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-900 sm:flex-row sm:items-center dark:text-amber-200">
                <TriangleAlert
                  aria-hidden="true"
                  class="hidden size-4 shrink-0 sm:block"
                />
                <output class="flex-1">{t().staleWarning}</output>
                <Button
                  class="h-8 border-amber-500/40 bg-transparent text-current hover:bg-amber-500/15"
                  disabled={state.diplomas.loading}
                  onClick={() => state.refetchDiplomas()}
                  size="sm"
                  variant="outline"
                >
                  <RefreshCw
                    aria-hidden="true"
                    class={`size-4 ${state.diplomas.loading ? 'animate-spin' : ''}`}
                  />
                  {t().retry}
                </Button>
              </div>
            </Show>

            <Show when={state.loadError() !== null}>
              <div
                class="mb-4 flex flex-col items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between"
                role="alert"
              >
                <span>{t().loadError}</span>
                <Button
                  class="border-destructive/30 text-foreground"
                  disabled={state.diplomas.loading}
                  onClick={() => state.refetchDiplomas()}
                  size="sm"
                  variant="outline"
                >
                  <RefreshCw
                    aria-hidden="true"
                    class="h-4 w-4"
                  />
                  {t().retry}
                </Button>
              </div>
            </Show>

            <Show
              when={
                state.loadError() === null &&
                (!state.diplomas.loading || state.totalDiplomasCount() > 0)
              }
            >
              <SearchQueryProvider query={state.search()}>
                <MentorsList
                  filteredSummaries={state.filteredSummaries()}
                  getCountShare={state.getCountShare}
                  getFileUrl={props.config.getFileUrl}
                  getSearchAttemptId={state.getSearchAttemptId}
                  getStatusInfo={state.getStatusInfo}
                  hasActiveFilters={state.hasActiveFilters()}
                  isExpanded={state.isExpanded}
                  onClearFilters={state.clearFilters}
                  onSort={state.handleSort}
                  onToggle={state.toggleExpanded}
                  section={props.config.id}
                  sortDirection={state.sortDirection()}
                  sortField={state.sortField()}
                  tableCountHeader={strings().tableCountHeader}
                />
              </SearchQueryProvider>
            </Show>
          </CardContent>
        </Card>
      </main>

      <BackToTop />
    </div>
  );
}
