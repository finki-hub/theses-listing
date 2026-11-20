import { For, Show } from 'solid-js';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { useLanguage } from '@/lib/LanguageProvider';
import { BREAKPOINTS, createMediaQuery } from '@/lib/media-query';

import type { MentorsListProps } from './mentors-list/types';

import MentorMobileCard from './mentors-list/MentorMobileCard';
import MentorRow from './mentors-list/MentorRow';
import MentorTableHeader from './mentors-list/MentorTableHeader';
import MobileSortControls from './mentors-list/MobileSortControls';

const EmptyState = (props: {
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}) => {
  const { t } = useLanguage();
  return (
    <div class="flex flex-col items-center gap-3 px-4 py-10 text-center">
      <p class="text-sm font-medium">{t().noResults}</p>
      <Show when={props.hasActiveFilters}>
        <p class="text-sm text-muted-foreground">{t().noResultsHint}</p>
        <Button
          onClick={() => {
            props.onClearFilters();
          }}
          size="sm"
          variant="outline"
        >
          {t().clearFilters}
        </Button>
      </Show>
    </div>
  );
};

const MentorsList = (props: MentorsListProps) => {
  // Render only the visible layout; both used to be rendered and one hidden
  // with CSS, doubling the DOM and the highlighting work.
  const isWide = createMediaQuery(BREAKPOINTS.sm);
  return (
    <Show
      fallback={
        <>
          <MobileSortControls
            onSort={props.onSort}
            sortDirection={props.sortDirection}
            sortField={props.sortField}
          />

          <div class="space-y-3">
            <Show
              fallback={
                <div class="rounded-md border border-dashed">
                  <EmptyState
                    hasActiveFilters={props.hasActiveFilters}
                    onClearFilters={props.onClearFilters}
                  />
                </div>
              }
              when={props.filteredSummaries.length > 0}
            >
              <For each={props.filteredSummaries}>
                {(summary, index) => (
                  <MentorMobileCard
                    expanded={props.isExpanded(summary.mentor)}
                    getCountShare={props.getCountShare}
                    getFileUrl={props.getFileUrl}
                    getSearchAttemptId={props.getSearchAttemptId}
                    getStatusInfo={props.getStatusInfo}
                    hasActiveFilters={props.hasActiveFilters}
                    index={index()}
                    onToggle={() => {
                      props.onToggle(summary.mentor);
                    }}
                    section={props.section}
                    showRank={props.sortField === 'totalDiplomas'}
                    summary={summary}
                  />
                )}
              </For>
            </Show>
          </div>
        </>
      }
      when={isWide()}
    >
      <div class="rounded-md border">
        <Table>
          <MentorTableHeader
            countHeaderLabel={props.tableCountHeader}
            onSort={props.onSort}
            showRank={props.sortField === 'totalDiplomas'}
            sortDirection={props.sortDirection}
            sortField={props.sortField}
          />
          <TableBody>
            <Show
              fallback={
                <TableRow class="hover:bg-transparent">
                  <TableCell
                    class="whitespace-normal"
                    colSpan={props.sortField === 'totalDiplomas' ? 3 : 2}
                  >
                    <EmptyState
                      hasActiveFilters={props.hasActiveFilters}
                      onClearFilters={props.onClearFilters}
                    />
                  </TableCell>
                </TableRow>
              }
              when={props.filteredSummaries.length > 0}
            >
              <For each={props.filteredSummaries}>
                {(summary, index) => (
                  <MentorRow
                    expanded={props.isExpanded(summary.mentor)}
                    getCountShare={props.getCountShare}
                    getFileUrl={props.getFileUrl}
                    getSearchAttemptId={props.getSearchAttemptId}
                    getStatusInfo={props.getStatusInfo}
                    hasActiveFilters={props.hasActiveFilters}
                    index={index()}
                    onToggle={() => {
                      props.onToggle(summary.mentor);
                    }}
                    section={props.section}
                    showRank={props.sortField === 'totalDiplomas'}
                    summary={summary}
                  />
                )}
              </For>
            </Show>
          </TableBody>
        </Table>
      </div>
    </Show>
  );
};

export default MentorsList;
