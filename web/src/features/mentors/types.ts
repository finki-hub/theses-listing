import type { Diploma, MentorSummary } from '@/types';

export type FilteredMentorSummary = MentorSummary & {
  filteredDiplomas: Diploma[];
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

export type SortField = 'mentor' | 'totalDiplomas';
