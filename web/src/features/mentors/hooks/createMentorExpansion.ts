import {
  type Accessor,
  createEffect,
  createMemo,
  createSignal,
} from 'solid-js';

import type { FilteredMentorSummary } from '../types';

// When a search matches theses rather than mentor names, the first few
// matching mentors open automatically so the matching theses are visible.
const AUTO_EXPAND_LIMIT = 5;
const AUTO_EXPAND_DELAY_MS = 300;

const getAutoExpandable = (summaries: readonly FilteredMentorSummary[]) =>
  summaries
    .filter((summary) => !summary.matchedByMentor)
    .slice(0, AUTO_EXPAND_LIMIT)
    .map((summary) => summary.mentor);

// For analytics: how many mentors a settled search opens on its own.
export const countAutoExpandable = (
  summaries: readonly FilteredMentorSummary[],
) => getAutoExpandable(summaries).length;

type MentorExpansionOptions = {
  readonly filteredSummaries: Accessor<FilteredMentorSummary[]>;
  // True after the first successful catalog load; until then, URL-provided
  // mentors must survive the initial fetch.
  readonly hasLoadedOnce: Accessor<boolean>;
  readonly initialExpanded: readonly string[];
  readonly initialSearch: string;
  readonly onOpen: (mentor: string) => void;
  readonly search: Accessor<string>;
};

export const createMentorExpansion = (options: MentorExpansionOptions) => {
  // Mentors the user opened explicitly; the URL keeps the visible subset.
  const [requestedExpanded, setRequestedExpanded] = createSignal<
    readonly string[]
  >(options.initialExpanded);
  // Mentors the user closed while they were auto-expanded for the current
  // search; reset whenever the settled search changes.
  const [dismissedAuto, setDismissedAuto] = createSignal<readonly string[]>([]);
  const [settledSearch, setSettledSearch] = createSignal(options.initialSearch);

  createEffect(
    () => options.search(),
    (query) => {
      const timer = setTimeout(() => {
        // Only a changed query clears dismissals; the initial run must not undo
        // a collapse made right after loading a shared ?q= link.
        if (query === settledSearch()) return;

        setSettledSearch(query);
        setDismissedAuto([]);
      }, AUTO_EXPAND_DELAY_MS);
      return () => {
        clearTimeout(timer);
      };
    },
  );

  const autoExpanded = createMemo<readonly string[]>(() => {
    const query = options.search();
    // Wait until typing settles so rows don't flicker open and closed.
    return query.trim().length === 0 || query !== settledSearch()
      ? []
      : getAutoExpandable(options.filteredSummaries());
  });

  const visibleMentors = createMemo(
    () => new Set(options.filteredSummaries().map((summary) => summary.mentor)),
  );

  // Manual expansions are explicit user intent: a mentor hidden by a filter is
  // omitted from the URL and the view, then restored when the filter stops
  // hiding it. Pruning it permanently would require an effect that writes the
  // source it reads, which Solid 2 rejects (`EFFECT_WRITES_OWN_SOURCE`).
  const manualExpanded = createMemo<readonly string[]>(() => {
    const requested = requestedExpanded();
    // Until the first successful load, keep URL-provided mentors so they
    // survive it. Afterwards always filter, including during a refetch or an
    // error, so a hidden mentor is not written back into the URL.
    if (!options.hasLoadedOnce()) return requested;

    const visible = visibleMentors();
    return requested.filter((mentor) => visible.has(mentor));
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

  const toggleExpanded = (mentor: string) => {
    if (isExpanded(mentor)) {
      setRequestedExpanded((previous) =>
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
    setRequestedExpanded((previous) => [...previous, mentor]);
  };

  return { expandedMentors, isExpanded, manualExpanded, toggleExpanded };
};
