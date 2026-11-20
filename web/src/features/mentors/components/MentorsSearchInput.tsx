import { Search, X } from 'lucide-solid';
import { onCleanup, onMount, Show } from 'solid-js';

import { Input } from '@/components/ui/input';
import { useLanguage } from '@/lib/LanguageProvider';

type MentorsSearchInputProps = {
  id?: string;
  onInput: (value: string) => void;
  value: string;
};

const isEditableTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName));

const MentorsSearchInput = (props: MentorsSearchInputProps) => {
  const { t } = useLanguage();
  let inputRef: HTMLInputElement | undefined;

  // "/" focuses the search, as on many search-heavy sites.
  const onKeyDown = (event: KeyboardEvent) => {
    if (
      event.key !== '/' ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      isEditableTarget(event.target)
    ) {
      return;
    }

    event.preventDefault();
    inputRef?.focus();
    inputRef?.select();
  };

  onMount(() => {
    document.addEventListener('keydown', onKeyDown);
    onCleanup(() => {
      document.removeEventListener('keydown', onKeyDown);
    });
  });

  return (
    <div class="relative">
      <Search
        aria-hidden="true"
        class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        aria-keyshortcuts="/"
        autocomplete="off"
        class="px-9 [&::-webkit-search-cancel-button]:appearance-none"
        enterkeyhint="search"
        id={props.id}
        onInput={(event: InputEvent & { currentTarget: HTMLInputElement }) => {
          props.onInput(event.currentTarget.value);
        }}
        onKeyDown={(event) => {
          if (!(event.key === 'Escape' && props.value.length > 0)) {
            return;
          }

          event.preventDefault();
          props.onInput('');
        }}
        placeholder={t().searchPlaceholder}
        ref={(element) => {
          inputRef = element;
        }}
        spellcheck={false}
        type="search"
        value={props.value}
      />
      <Show
        fallback={
          <kbd
            aria-hidden="true"
            class="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded border bg-muted px-1.5 font-sans text-xs text-muted-foreground sm:inline-block"
          >
            /
          </kbd>
        }
        when={props.value.length > 0}
      >
        <button
          aria-label={t().clearSearch}
          class="absolute top-1/2 right-1.5 inline-flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted-foreground ring-offset-background transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          onClick={() => {
            props.onInput('');
            inputRef?.focus();
          }}
          title={t().clearSearch}
          type="button"
        >
          <X
            aria-hidden="true"
            class="size-4"
          />
        </button>
      </Show>
    </div>
  );
};

export default MentorsSearchInput;
