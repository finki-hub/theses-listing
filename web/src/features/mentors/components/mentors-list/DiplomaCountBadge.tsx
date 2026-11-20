import { Show } from 'solid-js';

import { formatNumber } from '@/lib/format';
import { useLanguage } from '@/lib/LanguageProvider';

import type { DiplomaCountBadgeProps } from './types';

const DiplomaCountBadge = (
  props: DiplomaCountBadgeProps & { compact?: boolean },
) => {
  const { language } = useLanguage();
  const isFiltered = () =>
    props.hasActiveFilters && props.filteredCount !== props.totalCount;

  return (
    <div class="flex items-center justify-end gap-3">
      <Show when={!props.compact}>
        <div
          aria-hidden="true"
          class="hidden h-1.5 w-24 overflow-hidden rounded-full bg-muted md:block lg:w-32"
        >
          <div
            class="h-full rounded-full bg-primary"
            style={{ width: `${Math.max(props.share * 100, 2)}%` }}
          />
        </div>
      </Show>
      <span class="min-w-10 text-right text-sm font-semibold tabular-nums">
        <Show
          fallback={formatNumber(props.totalCount, language())}
          when={isFiltered()}
        >
          {formatNumber(props.filteredCount, language())}
          <span class="font-normal text-muted-foreground">
            {' / '}
            {formatNumber(props.totalCount, language())}
          </span>
        </Show>
      </span>
    </div>
  );
};

export default DiplomaCountBadge;
