import { ChevronDown } from '@lucide/solid';
import { createSignal, createUniqueId, For, Show } from 'solid-js';

import type { Diploma } from '@/types';

import { cn } from '@/lib/cn';
import { useLanguage } from '@/lib/LanguageProvider';

import type { SectionId } from '../../section';

import { displayName } from '../../utils';
import HighlightedText from '../HighlightedText';

type ThesisExtrasProps = {
  diploma: Diploma;
  section: SectionId;
};

// Committee members and an expandable abstract, shown under a thesis title.
const ThesisExtras = (props: ThesisExtrasProps) => {
  const { language, t } = useLanguage();
  const [showAbstract, setShowAbstract] = createSignal(false);
  const abstractId = createUniqueId();

  // For master's theses member1 is the committee chair (see api.ts).
  const members = () =>
    [props.diploma.member1, props.diploma.member2]
      .map((member) => member.trim())
      .filter((member) => member.length > 0);

  const abstract = () => props.diploma.description.trim();

  return (
    <>
      <Show when={members().length > 0}>
        <div class="mt-1 text-xs leading-snug text-muted-foreground">
          <span class="font-medium">{t().committee}:</span>{' '}
          <For each={members()}>
            {(member, index) => (
              <>
                <Show when={index() > 0}>{', '}</Show>
                <HighlightedText text={displayName(member, language())} />
                <Show when={props.section === 'masters' && index() === 0}>
                  {` (${t().committeeChair})`}
                </Show>
              </>
            )}
          </For>
        </div>
      </Show>
      <Show when={abstract().length > 0}>
        <button
          aria-controls={showAbstract() ? abstractId : undefined}
          aria-expanded={showAbstract() ? 'true' : 'false'}
          class="mt-1 inline-flex cursor-pointer items-center gap-1 rounded-sm text-xs font-medium text-primary ring-offset-background hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          onClick={() => setShowAbstract((open) => !open)}
          type="button"
        >
          {showAbstract() ? t().hideAbstract : t().showAbstract}
          <ChevronDown
            aria-hidden="true"
            class={cn(
              'size-3.5 transition-transform',
              showAbstract() && 'rotate-180',
            )}
          />
        </button>
        <Show when={showAbstract()}>
          <p
            class="mt-1.5 max-w-prose text-xs leading-relaxed whitespace-pre-line text-foreground/80"
            id={abstractId}
          >
            {abstract()}
          </p>
        </Show>
      </Show>
    </>
  );
};

export default ThesisExtras;
