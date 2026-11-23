import { Show } from 'solid-js';

import { cn } from '@/lib/cn';
import { formatNumber } from '@/lib/format';
import { interpolate } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';

import { toneDotClasses } from '../StatusToneFilter';

// A mentor's theses still in progress. `withLabel` spells it out where there
// is no column header to explain the number.
const InProgressCount = (props: { count: number; withLabel?: boolean }) => {
  const { language, t } = useLanguage();
  const value = () => formatNumber(props.count, language());

  return (
    <span
      class={cn(
        'inline-flex items-center gap-1.5 tabular-nums',
        props.count === 0 ? 'text-muted-foreground' : 'text-foreground',
      )}
    >
      <span
        aria-hidden="true"
        class={cn(
          'size-2 shrink-0 rounded-full',
          toneDotClasses.progress,
          props.count === 0 && 'opacity-40',
        )}
        data-testid="in-progress-dot"
      />
      <Show
        fallback={
          // Fixed two-digit track, left-start: every count begins right after
          // the dot + gap, so digits share a left edge and the dot stays on
          // one vertical line. A rare 3-digit count overflows visibly into
          // the cell padding without moving the dot or the digits' start.
          <span
            class="w-[2ch] text-left"
            data-testid="in-progress-value"
          >
            {value()}
          </span>
        }
        when={props.withLabel}
      >
        {interpolate(t().inProgressCount, { count: value() })}
      </Show>
    </span>
  );
};

export default InProgressCount;
