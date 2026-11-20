import {
  type Accessor,
  createContext,
  createMemo,
  For,
  type JSX,
  Show,
  useContext,
} from 'solid-js';

import { findHighlightRanges } from '../highlight';

const SearchQueryContext = createContext<Accessor<string>>(() => '');

export const SearchQueryProvider = (props: {
  children: JSX.Element;
  query: string;
}) => {
  const query = createMemo(() => props.query);
  return (
    <SearchQueryContext.Provider value={query}>
      {props.children}
    </SearchQueryContext.Provider>
  );
};

const HighlightedText = (props: { text: string }) => {
  type Segment = { highlighted: boolean; text: string };
  const query = useContext(SearchQueryContext);
  const segments = createMemo<Segment[]>(() => {
    const ranges = findHighlightRanges(props.text, query());
    const result: Segment[] = [];
    let cursor = 0;

    for (const [start, end] of ranges) {
      if (start > cursor) {
        result.push({
          highlighted: false,
          text: props.text.slice(cursor, start),
        });
      }

      result.push({ highlighted: true, text: props.text.slice(start, end) });
      cursor = end;
    }

    if (cursor < props.text.length) {
      result.push({ highlighted: false, text: props.text.slice(cursor) });
    }

    return result;
  });

  return (
    <For each={segments()}>
      {(segment) => (
        <Show
          fallback={segment.text}
          when={segment.highlighted}
        >
          <mark class="rounded-sm bg-amber-200 px-px text-inherit dark:bg-amber-400/30">
            {segment.text}
          </mark>
        </Show>
      )}
    </For>
  );
};

export default HighlightedText;
