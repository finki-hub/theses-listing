import { type JSX, Show } from 'solid-js';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber, formatPercentage } from '@/lib/format';
import { interpolate } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';

import type { SectionId } from '../section';

type MentorsStatsCardsProps = {
  loading: boolean;
  median: number;
  section: SectionId;
  topTenDiplomasCount: number;
  topTenMentorsShare: number;
  totalDiplomas: number;
  totalMentors: number;
};

type StatProps = {
  class?: string;
  footer?: string;
  label: string;
  loading: boolean;
  value: JSX.Element;
};

const Stat = (props: StatProps) => (
  <div class={`flex flex-col gap-1 bg-card p-4 sm:px-5 ${props.class ?? ''}`}>
    <dt class="text-xs text-muted-foreground sm:text-sm">{props.label}</dt>
    <dd class="text-xl font-semibold tracking-tight tabular-nums sm:text-2xl">
      <Show
        fallback={<Skeleton class="my-1 h-6 w-16" />}
        when={!props.loading}
      >
        {props.value}
      </Show>
    </dd>
    <Show when={props.footer !== undefined}>
      <dd class="text-xs text-muted-foreground">
        <Show
          fallback={<Skeleton class="h-3 w-32" />}
          when={!props.loading}
        >
          {props.footer}
        </Show>
      </dd>
    </Show>
  </div>
);

// One compact card instead of five, so the list starts higher on the page,
// especially on phones where the stats used to stack vertically.
const MentorsStatsCards = (props: MentorsStatsCardsProps) => {
  const { language, t } = useLanguage();
  return (
    <Card class="mb-6 gap-0 overflow-hidden py-0">
      <dl class="grid grid-cols-2 gap-px bg-border sm:grid-cols-3 lg:grid-cols-5">
        <Stat
          label={t().totalMentors}
          loading={props.loading}
          value={formatNumber(props.totalMentors, language())}
        />
        <Stat
          label={t().sections[props.section].totalThesesLabel}
          loading={props.loading}
          value={formatNumber(props.totalDiplomas, language())}
        />
        <Stat
          label={t().average}
          loading={props.loading}
          value={formatNumber(
            props.totalMentors > 0
              ? props.totalDiplomas / props.totalMentors
              : 0,
            language(),
            { maximumFractionDigits: 1, minimumFractionDigits: 1 },
          )}
        />
        <Stat
          label={t().median}
          loading={props.loading}
          value={formatNumber(props.median, language())}
        />
        <Stat
          class="col-span-2 lg:col-span-1"
          footer={interpolate(t().sections[props.section].topTenCount, {
            shown: formatNumber(props.topTenDiplomasCount, language(), {
              useGrouping: false,
            }),
            total: formatNumber(props.totalDiplomas, language(), {
              useGrouping: false,
            }),
          })}
          label={t().topTenShare}
          loading={props.loading}
          value={formatPercentage(props.topTenMentorsShare, language())}
        />
      </dl>
    </Card>
  );
};

export default MentorsStatsCards;
