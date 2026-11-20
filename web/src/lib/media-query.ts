import { type Accessor, createSignal, onCleanup } from 'solid-js';

// Tailwind v4 breakpoints, so JS-driven layout switches line up with CSS.
export const BREAKPOINTS = {
  md: '(min-width: 48rem)',
  sm: '(min-width: 40rem)',
} as const;

// Reactive matchMedia. Lets components render only the layout that is
// visible instead of rendering both and hiding one with CSS.
export const createMediaQuery = (query: string): Accessor<boolean> => {
  const list = typeof matchMedia === 'function' ? matchMedia(query) : null;
  const [matches, setMatches] = createSignal(list?.matches ?? true);

  if (list) {
    const onChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    list.addEventListener('change', onChange);
    onCleanup(() => {
      list.removeEventListener('change', onChange);
    });
  }

  return matches;
};
