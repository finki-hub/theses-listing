import { For } from 'solid-js';

import { cn } from '@/lib/cn';
import { formatNumber } from '@/lib/format';
import { useLanguage } from '@/lib/LanguageProvider';

import type { StatusTone } from '../section';

import {
  FILTERABLE_TONES,
  parseToneFilter,
  toneFilterValue,
} from '../selectors';

type StatusToneFilterProps = {
  counts: Record<StatusTone, number>;
  onChange: (value: string) => void;
  value: string;
};

export const toneDotClasses: Record<StatusTone, string> = {
  cancelled: 'bg-red-600 dark:bg-red-400',
  complete: 'bg-green-600 dark:bg-green-400',
  progress: 'bg-blue-600 dark:bg-blue-400',
  unknown: 'bg-muted-foreground',
};

// Phones: a 2-column segmented control with the count under the label, so
// all states fit on one row in every language. sm and up: inline pills.
const chipClass =
  'flex min-w-0 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg border px-1.5 py-1.5 text-xs leading-tight ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:h-8 sm:flex-row sm:gap-1.5 sm:rounded-full sm:px-3 sm:py-0 sm:text-sm';

// Quick filter by overall state; detailed statuses stay in the dropdown.
const StatusToneFilter = (props: StatusToneFilterProps) => {
  const { language, t } = useLanguage();
  const selectedTone = () => parseToneFilter(props.value);
  const labels = (): Record<StatusTone, string> => ({
    cancelled: t().statusCancelled,
    complete: t().statusComplete,
    progress: t().statusInProgress,
    unknown: '',
  });

  return (
    <fieldset class="m-0 grid min-w-0 grid-cols-2 gap-1.5 border-0 p-0 sm:flex sm:flex-wrap sm:gap-2">
      <legend class="sr-only">{t().statusState}</legend>
      <For each={FILTERABLE_TONES}>
        {(tone) => {
          const active = () => selectedTone() === tone;
          return (
            <button
              aria-pressed={active() ? 'true' : 'false'}
              class={cn(
                chipClass,
                active()
                  ? 'border-primary/50 bg-primary/10 text-foreground'
                  : 'border-border bg-background text-muted-foreground hover:text-foreground',
                // Dim the frame, not the text, so the label keeps its contrast.
                !active() && props.counts[tone] === 0 && 'border-dashed',
              )}
              onClick={() => {
                props.onChange(active() ? '' : toneFilterValue(tone));
              }}
              type="button"
            >
              <span class="flex max-w-full items-center justify-center gap-1.5">
                <span
                  aria-hidden="true"
                  class={cn(
                    'size-2 shrink-0 rounded-full',
                    toneDotClasses[tone],
                    props.counts[tone] === 0 && 'opacity-40',
                  )}
                />
                <span class="min-w-0 text-center">{labels()[tone]}</span>
              </span>
              <span class="text-[0.6875rem] tabular-nums text-muted-foreground sm:text-xs">
                {formatNumber(props.counts[tone], language())}
              </span>
            </button>
          );
        }}
      </For>
    </fieldset>
  );
};

export default StatusToneFilter;
