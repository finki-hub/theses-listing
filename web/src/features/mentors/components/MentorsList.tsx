import { dynamic, type JSX } from '@solidjs/web';
import { For, Show } from 'solid-js';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { useLanguage } from '@/lib/LanguageProvider';
import { BREAKPOINTS, createMediaQuery } from '@/lib/media-query';

import type {
  MentorListItemProps,
  MentorsListProps,
} from './mentors-list/types';

import { type FilteredMentorSummary, isCountSort } from '../types';
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

// Filtering creates new summary objects, so key by mentor to keep their rows.
const mentorKey = (summary: FilteredMentorSummary) => summary.mentor;

const MentorItems = (
  props: MentorsListProps & {
    item: (itemProps: MentorListItemProps) => JSX.Element;
  },
) => {
  const Item = dynamic(() => props.item);
  return (
    <For
      each={props.filteredSummaries}
      keyed={mentorKey}
    >
      {(summary, index) => (
        <Item
          expanded={props.isExpanded(summary().mentor)}
          getCountShare={props.getCountShare}
          getFileUrl={props.getFileUrl}
          getSearchAttemptId={props.getSearchAttemptId}
          getStatusInfo={props.getStatusInfo}
          hasActiveFilters={props.hasActiveFilters}
          index={index()}
          onToggle={() => {
            props.onToggle(summary().mentor);
          }}
          section={props.section}
          showRank={isCountSort(props.sortField)}
          summary={summary()}
        />
      )}
    </For>
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
              <MentorItems
                {...props}
                item={MentorMobileCard}
              />
            </Show>
          </div>
        </>
      }
      when={isWide()}
    >
      {/* The table has two or three columns and wraps, so it never needs to
          scroll sideways; that lets its header stick while scrolling. */}
      <div class="rounded-md border">
        <Table unscrolled>
          <MentorTableHeader
            countHeaderLabel={props.tableCountHeader}
            onSort={props.onSort}
            showRank={isCountSort(props.sortField)}
            sortDirection={props.sortDirection}
            sortField={props.sortField}
          />
          <TableBody>
            <Show
              fallback={
                <TableRow class="hover:bg-transparent">
                  <TableCell
                    class="whitespace-normal"
                    colspan={isCountSort(props.sortField) ? 4 : 3}
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
              <MentorItems
                {...props}
                item={MentorRow}
              />
            </Show>
          </TableBody>
        </Table>
      </div>
    </Show>
  );
};

export default MentorsList;
