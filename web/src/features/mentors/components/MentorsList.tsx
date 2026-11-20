import { For, Show } from 'solid-js';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { useLanguage } from '@/lib/LanguageProvider';

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

const MentorsList = (props: MentorsListProps) => (
  <>
    <MobileSortControls
      onSort={props.onSort}
      sortDirection={props.sortDirection}
      sortField={props.sortField}
    />

    <div class="space-y-3 sm:hidden">
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
              summary={summary}
            />
          )}
        </For>
      </Show>
    </div>

    <div class="hidden rounded-md border sm:block">
      <Table>
        <MentorTableHeader
          countHeaderLabel={props.tableCountHeader}
          onSort={props.onSort}
          sortDirection={props.sortDirection}
          sortField={props.sortField}
        />
        <TableBody>
          <Show
            fallback={
              <TableRow>
                <TableCell
                  class="whitespace-normal hover:bg-transparent"
                  colSpan={3}
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
                  summary={summary}
                />
              )}
            </For>
          </Show>
        </TableBody>
      </Table>
    </div>
  </>
);

export default MentorsList;
