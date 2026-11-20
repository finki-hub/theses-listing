import { describe, expect, it } from 'vitest';

import { getInitialMentorsPageState } from './query-state';

describe('sort from the URL', () => {
  it.each([
    ['', 'totalDiplomas', 'desc'],
    ['?sort=inProgress', 'inProgress', 'desc'],
    ['?sort=inProgress&dir=asc', 'inProgress', 'asc'],
    ['?sort=mentor', 'mentor', 'asc'],
    ['?sort=bogus', 'totalDiplomas', 'desc'],
  ])('%s sorts by %s, %s', (search, field, direction) => {
    const state = getInitialMentorsPageState(search);

    expect(state.sortField).toBe(field);
    expect(state.sortDirection).toBe(direction);
  });
});
