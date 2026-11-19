import { ChevronRight } from 'lucide-solid';
import { createUniqueId, Show } from 'solid-js';

import { TableCell, TableRow } from '@/components/ui/table';
import { formatNumber } from '@/lib/format';
import { useLanguage } from '@/lib/LanguageProvider';

import type { MentorListItemProps } from './types';

import { displayName } from '../../utils';
import DiplomaCountBadge from './DiplomaCountBadge';
import DiplomaDetailsTable from './DiplomaDetailsTable';

const MentorRow = (props: MentorListItemProps) => {
  const { language } = useLanguage();
  const detailsId = createUniqueId();
  return (
    <>
      {/* The whole row is a mouse target. Keyboard and assistive technology
          use the disclosure button, whose click bubbles up to this handler. */}
      <TableRow
        class="cursor-pointer"
        onClick={props.onToggle}
      >
        <TableCell class="text-center text-muted-foreground">
          {formatNumber(props.index + 1, language())}
        </TableCell>
        <TableCell class="font-medium">
          <button
            aria-controls={props.expanded ? detailsId : undefined}
            aria-expanded={props.expanded}
            class="flex max-w-full cursor-pointer items-center gap-2 rounded-sm text-left ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            type="button"
          >
            <ChevronRight
              aria-hidden="true"
              class={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                props.expanded ? 'rotate-90' : ''
              }`}
            />
            <span class="truncate">
              {displayName(props.summary.mentor, language())}
            </span>
          </button>
        </TableCell>
        <TableCell class="text-right">
          <DiplomaCountBadge
            filteredCount={props.summary.filteredDiplomas.length}
            hasActiveFilters={props.hasActiveFilters}
            opacity={props.getBadgeOpacity(props.summary.totalDiplomas)}
            totalCount={props.summary.totalDiplomas}
          />
        </TableCell>
      </TableRow>
      <Show when={props.expanded}>
        <TableRow class="hover:bg-transparent">
          <TableCell
            class="p-0 whitespace-normal"
            colSpan={3}
            id={detailsId}
          >
            <DiplomaDetailsTable
              diplomas={props.summary.filteredDiplomas}
              getFileUrl={props.getFileUrl}
              getSearchAttemptId={props.getSearchAttemptId}
              getStatusOpacity={props.getStatusOpacity}
              section={props.section}
            />
          </TableCell>
        </TableRow>
      </Show>
    </>
  );
};

export default MentorRow;
