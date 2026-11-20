import type { Diploma, MentorSummary } from '@/types';

export type FilteredMentorSummary = MentorSummary & {
  filteredDiplomas: Diploma[];
  // Theses still in progress among the filtered ones: the mentor's current
  // workload when no filters are active.
  inProgressCount: number;
  // True when an active search matched the mentor's name rather than only
  // the theses' titles, students or statuses.
  matchedByMentor: boolean;
};

export type InitialMentorsPageState = {
  expandedMentors: string[];
  search: string;
  sortDirection: SortDirection;
  sortField: SortField;
  statusFilter: string;
  yearFilter: string;
};

export type SortDirection = 'asc' | 'desc';

export type SortField = 'inProgress' | 'mentor' | 'totalDiplomas';

// Count sorts start with the largest first and show rank numbers.
export const isCountSort = (field: SortField) => field !== 'mentor';
