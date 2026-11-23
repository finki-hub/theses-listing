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
      />
      <Show
        fallback={
          // Fixed two-digit track keeps the dot on one vertical line across
          // rows while the digits stay right-aligned under the header.
          <span class="min-w-[2ch] text-right">{value()}</span>
        }
        when={props.withLabel}
      >
        {interpolate(t().inProgressCount, { count: value() })}
      </Show>
    </span>
  );
};

export default InProgressCount;
