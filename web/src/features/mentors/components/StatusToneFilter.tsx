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

const dotClasses: Record<StatusTone, string> = {
  cancelled: 'bg-red-600 dark:bg-red-400',
  complete: 'bg-green-600 dark:bg-green-400',
  progress: 'bg-blue-600 dark:bg-blue-400',
  unknown: 'bg-muted-foreground',
};

const chipClass =
  'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

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
    <div
      aria-label={t().statusState}
      class="flex flex-wrap gap-2"
      role="group"
    >
      <For each={FILTERABLE_TONES}>
        {(tone) => {
          const active = () => selectedTone() === tone;
          return (
            <button
              aria-pressed={active()}
              class={cn(
                chipClass,
                active()
                  ? 'border-primary/50 bg-primary/10 text-foreground'
                  : 'border-border bg-background text-muted-foreground hover:text-foreground',
                !active() && props.counts[tone] === 0 && 'opacity-60',
              )}
              onClick={() => {
                props.onChange(active() ? '' : toneFilterValue(tone));
              }}
              type="button"
            >
              <span
                aria-hidden="true"
                class={cn('size-2 rounded-full', dotClasses[tone])}
              />
              {labels()[tone]}
              <span class="text-xs tabular-nums text-muted-foreground">
                {formatNumber(props.counts[tone], language())}
              </span>
            </button>
          );
        }}
      </For>
    </div>
  );
};

export default StatusToneFilter;
