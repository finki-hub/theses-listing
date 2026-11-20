import type {
  InitialMentorsPageState,
  SortDirection,
  SortField,
} from './types';

const DEFAULT_SORT_FIELD: SortField = 'totalDiplomas';

export const getInitialMentorsPageState = (
  initialSearch = location.search,
): InitialMentorsPageState => {
  const params = new URLSearchParams(initialSearch);

  const sortField = params.get('sort');
  const sortDirection = params.get('dir');

  const nextSortField: SortField =
    sortField === 'mentor' || sortField === 'totalDiplomas'
      ? sortField
      : DEFAULT_SORT_FIELD;

  const defaultDirectionForField: SortDirection =
    nextSortField === 'totalDiplomas' ? 'desc' : 'asc';

  const nextSortDirection: SortDirection =
    sortDirection === 'asc' || sortDirection === 'desc'
      ? sortDirection
      : defaultDirectionForField;

  const expandedMentors = [
    ...new Set(
      params
        .getAll('mentor')
        .map((mentor) => mentor.trim())
        .filter((mentor) => mentor.length > 0),
    ),
  ];
  const search = params.get('q')?.trim();
  const statusFilter = params.get('status')?.trim();
  const yearFilter = params.get('year')?.trim();

  return {
    expandedMentors,
    search: search ?? '',
    sortDirection: nextSortDirection,
    sortField: nextSortField,
    statusFilter: statusFilter ?? '',
    yearFilter: yearFilter ?? '',
  };
};

export const syncMentorsSearchParams = (options: {
  expandedMentors: readonly string[];
  search: string;
  sortDirection: SortDirection;
  sortField: SortField;
  statusFilter: string;
  yearFilter: string;
}) => {
  const params = new URLSearchParams();
  const trimmedSearch = options.search.trim();
  const defaultSortDirection =
    options.sortField === 'totalDiplomas' ? 'desc' : 'asc';

  if (trimmedSearch.length > 0) {
    params.set('q', trimmedSearch);
  }

  if (options.statusFilter.length > 0) {
    params.set('status', options.statusFilter);
  }

  if (options.yearFilter.length > 0) {
    params.set('year', options.yearFilter);
  }

  if (options.sortField !== 'totalDiplomas') {
    params.set('sort', options.sortField);
  }

  if (options.sortDirection !== defaultSortDirection) {
    params.set('dir', options.sortDirection);
  }

  for (const mentor of options.expandedMentors) {
    params.append('mentor', mentor);
  }

  const nextSearch = params.toString();
  const queryString = nextSearch ? `?${nextSearch}` : '';
  const nextUrl = `${location.pathname}${queryString}`;

  history.replaceState({}, '', nextUrl);
};
