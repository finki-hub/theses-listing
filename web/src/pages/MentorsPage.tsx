import { useLocation } from '@solidjs/router';
import { RefreshCw } from 'lucide-solid';
import { createEffect, Show } from 'solid-js';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SearchQueryProvider } from '@/features/mentors/components/HighlightedText';
import LoadingSpinner from '@/features/mentors/components/LoadingSpinner';
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

      <main class="container mx-auto py-6 sm:py-8">
        <div class="mb-6">
          <SectionSwitch
            active={props.config.id}
            search={state.search()}
          />
        </div>

        <MentorsStatsCards
          loading={state.diplomas.loading}
          median={state.medianDiplomas()}
          section={props.config.id}
          topTenDiplomasCount={state.topTenDiplomasCount()}
          topTenMentorsShare={state.topTenMentorsShare()}
          totalDiplomas={state.totalDiplomasCount()}
          totalMentors={state.totalMentorsCount()}
        />

        <Card class="overflow-hidden">
          <CardHeader class="px-4 sm:px-6">
            <CardTitle>{strings().cardTitle}</CardTitle>
            <CardDescription>{strings().cardDescription}</CardDescription>
          </CardHeader>
          <CardContent class="px-4 pb-6 sm:px-6">
            <MentorsToolbar
              filteredDiplomasCount={state.filteredDiplomasCount()}
              filteredMentorsCount={state.filteredSummaries().length}
              hasActiveFilters={state.hasActiveFilters()}
              isStale={state.isStale()}
              lastUpdatedAt={state.lastUpdatedAt()}
              onClearFilters={state.clearFilters}
              search={state.search()}
              section={props.config.id}
              setSearch={state.setSearch}
              setStatusFilter={state.setStatusFilter}
              setYearFilter={state.setYearFilter}
              statusFilter={state.statusFilter()}
              statusOptions={state.statusOptions()}
              totalDiplomasCount={state.totalDiplomasCount()}
              totalMentorsCount={state.totalMentorsCount()}
              yearFilter={state.yearFilter()}
              yearOptions={state.yearOptions()}
            />

            <Show
              when={state.diplomas.loading && state.totalDiplomasCount() === 0}
            >
              <LoadingSpinner />
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
    </div>
  );
}
