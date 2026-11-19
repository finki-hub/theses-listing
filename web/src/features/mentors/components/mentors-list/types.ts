import type { Diploma } from '@/types';

import type { StatusInfo } from '../../section';
import type {
  FilteredMentorSummary,
  SortDirection,
  SortField,
} from '../../types';

export type DiplomaCountBadgeProps = {
  filteredCount: number;
  hasActiveFilters: boolean;
  // Total count relative to the busiest mentor, from 0 to 1.
  share: number;
  totalCount: number;
};

export type DiplomaDetailsTableProps = {
  diplomas: Diploma[];
  getFileUrl: (fileId: null | string) => null | string;
  getSearchAttemptId: () => string | undefined;
  getStatusInfo: (status: string) => StatusInfo;
  section: 'diplomas' | 'masters';
};

export type MentorListItemProps = {
  expanded: boolean;
  getCountShare: (count: number) => number;
  getFileUrl: (fileId: null | string) => null | string;
  getSearchAttemptId: () => string | undefined;
  getStatusInfo: (status: string) => StatusInfo;
  hasActiveFilters: boolean;
  index: number;
  onToggle: () => void;
  section: 'diplomas' | 'masters';
  summary: FilteredMentorSummary;
};

export type MentorsListProps = {
  expandedMentor: null | string;
  filteredSummaries: FilteredMentorSummary[];
  getCountShare: (count: number) => number;
  getFileUrl: (fileId: null | string) => null | string;
  getSearchAttemptId: () => string | undefined;
  getStatusInfo: (status: string) => StatusInfo;
  hasActiveFilters: boolean;
  onSort: (field: SortField) => void;
  onToggle: (mentor: string) => void;
  section: 'diplomas' | 'masters';
  sortDirection: SortDirection;
  sortField: SortField;
  tableCountHeader: string;
};

export type MentorTableHeaderProps = SortControlsProps & {
  countHeaderLabel: string;
};

export type SortControlsProps = {
  onSort: (field: SortField) => void;
  sortDirection: SortDirection;
  sortField: SortField;
};

export type SortIconProps = {
  currentDirection: SortDirection;
  currentField: SortField;
  field: SortField;
};
