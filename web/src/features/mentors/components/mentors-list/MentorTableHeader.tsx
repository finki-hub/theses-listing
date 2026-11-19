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
    <TableHeader>
      <TableRow>
        <TableHead
          class="w-12.5 text-center"
          scope="col"
        >
          #
        </TableHead>
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
