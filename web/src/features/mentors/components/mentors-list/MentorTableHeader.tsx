import { Show } from 'solid-js';

import { TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLanguage } from '@/lib/LanguageProvider';

import type { SortField } from '../../types';
import type { MentorTableHeaderProps } from './types';

import SortIcon from './SortIcon';

const MentorTableHeader = (props: MentorTableHeaderProps) => {
  const { t } = useLanguage();
  const ariaSort = (field: SortField) => {
    if (props.sortField !== field) return 'none';
    return props.sortDirection === 'asc' ? 'ascending' : 'descending';
  };
  return (
    // Sticky, so the sort controls stay in reach in long lists. The bottom
    // line is a shadow because collapsed table borders don't stick.
    <TableHeader class="sticky top-0 z-10 bg-card shadow-[inset_0_-1px_0_var(--color-border)] [&_tr]:border-b-0">
      <TableRow class="hover:bg-transparent">
        <Show when={props.showRank}>
          <TableHead
            class="w-12.5 text-center"
            scope="col"
          >
            #
          </TableHead>
        </Show>
        <TableHead
          aria-sort={ariaSort('mentor')}
          scope="col"
        >
          <button
            class="flex cursor-pointer items-center rounded-sm font-medium ring-offset-background transition-colors hover:text-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={() => {
              props.onSort('mentor');
            }}
            type="button"
          >
            {t().mentor}
            <SortIcon
              currentDirection={props.sortDirection}
              currentField={props.sortField}
              field="mentor"
            />
          </button>
        </TableHead>
        <TableHead
          aria-sort={ariaSort('inProgress')}
          class="w-32 text-right"
          scope="col"
        >
          <button
            class="ml-auto flex cursor-pointer items-center rounded-sm font-medium ring-offset-background transition-colors hover:text-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={() => {
              props.onSort('inProgress');
            }}
            type="button"
          >
            {t().statusInProgress}
            <SortIcon
              currentDirection={props.sortDirection}
              currentField={props.sortField}
              field="inProgress"
            />
          </button>
        </TableHead>
        <TableHead
          aria-sort={ariaSort('totalDiplomas')}
          class="text-right"
          scope="col"
        >
          <button
            class="ml-auto flex cursor-pointer items-center rounded-sm font-medium ring-offset-background transition-colors hover:text-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={() => {
              props.onSort('totalDiplomas');
            }}
            type="button"
          >
            {props.countHeaderLabel}
            <SortIcon
              currentDirection={props.sortDirection}
              currentField={props.sortField}
              field="totalDiplomas"
            />
          </button>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default MentorTableHeader;
