import {
  type Accessor,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
} from 'solid-js';

import type { FilteredMentorSummary } from '../types';

// When a search matches theses rather than mentor names, the first few
// matching mentors open automatically so the matching theses are visible.
const AUTO_EXPAND_LIMIT = 5;
const AUTO_EXPAND_DELAY_MS = 300;

type MentorExpansionOptions = {
  readonly filteredSummaries: Accessor<FilteredMentorSummary[]>;
  readonly initialExpanded: readonly string[];
  readonly initialSearch: string;
  // False while data is loading or failed, so URL-provided mentors survive.
  readonly isReady: Accessor<boolean>;
  readonly onOpen: (mentor: string) => void;
  readonly search: Accessor<string>;
};

export const createMentorExpansion = (options: MentorExpansionOptions) => {
  // Mentors the user opened explicitly; these are kept in the URL.
  const [manualExpanded, setManualExpanded] = createSignal<readonly string[]>(
    options.initialExpanded,
  );
  // Mentors the user closed while they were auto-expanded for the current
  // search; reset whenever the settled search changes.
  const [dismissedAuto, setDismissedAuto] = createSignal<readonly string[]>([]);
  const [settledSearch, setSettledSearch] = createSignal(options.initialSearch);

  createEffect(() => {
    const query = options.search();
    const timer = setTimeout(() => {
      // Only a changed query clears dismissals; the initial run must not undo
      // a collapse made right after loading a shared ?q= link.
      if (query === settledSearch()) return;

      setSettledSearch(query);
      setDismissedAuto([]);
    }, AUTO_EXPAND_DELAY_MS);
    onCleanup(() => {
      clearTimeout(timer);
    });
  });

  const autoExpanded = createMemo<readonly string[]>(() => {
    const query = options.search();
    // Wait until typing settles so rows don't flicker open and closed.
    return query.trim().length === 0 || query !== settledSearch()
      ? []
      : options
          .filteredSummaries()
          .filter((summary) => !summary.matchedByMentor)
          .slice(0, AUTO_EXPAND_LIMIT)
          .map((summary) => summary.mentor);
  });

  const expandedMentors = createMemo(() => {
    const dismissed = new Set(dismissedAuto());
    return [
      ...new Set([
        ...manualExpanded(),
        ...autoExpanded().filter((mentor) => !dismissed.has(mentor)),
      ]),
    ];
  });

  const expandedSet = createMemo(() => new Set(expandedMentors()));
  const isExpanded = (mentor: string) => expandedSet().has(mentor);

  createEffect(() => {
    const manual = manualExpanded();
    if (manual.length === 0 || !options.isReady()) return;

    const visible = new Set(
      options.filteredSummaries().map((summary) => summary.mentor),
    );
    const stillVisible = manual.filter((mentor) => visible.has(mentor));

    if (stillVisible.length !== manual.length) {
      setManualExpanded(stillVisible);
    }
  });

  const toggleExpanded = (mentor: string) => {
    if (isExpanded(mentor)) {
      setManualExpanded((previous) =>
        previous.filter((current) => current !== mentor),
      );
      if (autoExpanded().includes(mentor)) {
        setDismissedAuto((previous) => [...previous, mentor]);
      }

      return;
    }

    options.onOpen(mentor);
    setDismissedAuto((previous) =>
      previous.filter((current) => current !== mentor),
    );
    setManualExpanded((previous) => [...previous, mentor]);
  };

  return { expandedMentors, isExpanded, manualExpanded, toggleExpanded };
};
