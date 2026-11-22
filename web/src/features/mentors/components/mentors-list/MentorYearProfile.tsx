import type { JSX } from '@solidjs/web';

import {
  type Accessor,
  createContext,
  createMemo,
  For,
  Show,
  useContext,
} from 'solid-js';

import type { Diploma } from '@/types';

import { cn } from '@/lib/cn';
import { formatNumber } from '@/lib/format';
import { interpolate } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';

import type { StatusTone } from '../../section';

import { activeYearRange, countByYear, findPeakYear } from '../../year-stats';
import { toneDotClasses } from '../StatusToneFilter';

type YearProfileContextValue = {
  readonly committeeCounts: Accessor<ReadonlyMap<string, number>>;
  readonly getStatusTone: (status: string) => StatusTone;
  // The section's year span, so every mentor is drawn on the same axis.
  readonly years: Accessor<readonly string[]>;
};

const YearProfileContext = createContext<YearProfileContextValue>();

export const YearProfileProvider = (props: {
  children: JSX.Element;
  committeeCounts: ReadonlyMap<string, number>;
  getStatusTone: (status: string) => StatusTone;
  years: readonly string[];
}) => {
  const years = createMemo(() => props.years);
  const committeeCounts = createMemo(() => props.committeeCounts);
  // The resolver is a stable function for the page's lifetime.
  const getStatusTone = (status: string) => props.getStatusTone(status);
  return (
    <YearProfileContext value={{ committeeCounts, getStatusTone, years }}>
      {props.children}
    </YearProfileContext>
  );
};

const BAR_WIDTH = 6;
const BAR_GAP = 2;
const HEIGHT = 28;
const TONES: StatusTone[] = ['complete', 'progress', 'cancelled'];

// A mentor's whole record at a glance, independent of the active filters:
// theses per year on the section's shared axis, plus totals by state.
const MentorYearProfile = (props: {
  diplomas: readonly Diploma[];
  mentor: string;
}) => {
  const { language, t } = useLanguage();
  const context = useContext(YearProfileContext);

  const stats = createMemo(() =>
    countByYear(props.diplomas, context.getStatusTone, context.years()),
  );
  const byTone = createMemo(() => {
    const totals: Record<StatusTone, number> = {
      cancelled: 0,
      complete: 0,
      progress: 0,
      unknown: 0,
    };
    const years = stats().years;
    for (const entry of years) {
      for (const tone of TONES) totals[tone] += entry.byTone[tone];
    }

    return totals;
  });
  const labels = (): Record<StatusTone, string> => ({
    cancelled: t().statusCancelled,
    complete: t().statusComplete,
    progress: t().statusInProgress,
    unknown: '',
  });

  return (
    <Show when={stats()}>
      {(current) => {
        const years = () => current().years;
        const max = () => Math.max(1, ...years().map((entry) => entry.total));
        const peak = () => findPeakYear(years());
        const range = () => activeYearRange(years());
        const summary = () =>
          years()
            .filter((entry) => entry.total > 0)
            .map((entry) => `${entry.year}: ${entry.total}`)
            .join(', ');

        return (
          <div class="mb-3 flex flex-col gap-3 rounded-lg border bg-card px-3 py-2.5 text-xs sm:flex-row sm:items-center sm:justify-between">
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-muted-foreground">
              <span class="font-medium text-foreground">
                {interpolate(t().mentorThesesTotal, {
                  count: formatNumber(props.diplomas.length, language()),
                })}
              </span>
              <For each={TONES.filter((tone) => byTone()[tone] > 0)}>
                {(tone) => (
                  <span class="flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      class={cn('size-2 rounded-full', toneDotClasses[tone])}
                    />
                    {labels()[tone]}
                    <span class="text-foreground tabular-nums">
                      {formatNumber(byTone()[tone], language())}
                    </span>
                  </span>
                )}
              </For>
              <Show when={context.committeeCounts().get(props.mentor)}>
                {(count) => (
                  <span>
                    {interpolate(t().mentorCommittee, {
                      count: formatNumber(count(), language()),
                    })}
                  </span>
                )}
              </Show>
              <Show when={range()}>
                {(value) => (
                  <span>
                    {interpolate(t().mentorYears, { range: value() })}
                  </span>
                )}
              </Show>
              <Show when={peak()}>
                {(entry) => (
                  <span>
                    {interpolate(t().mentorPeakYear, {
                      count: formatNumber(entry().total, language()),
                      year: entry().year,
                    })}
                  </span>
                )}
              </Show>
            </div>

            <Show when={years().length > 1}>
              <div class="flex shrink-0 items-end gap-1.5 text-[0.625rem] text-muted-foreground tabular-nums">
                <span aria-hidden="true">{years().at(0)?.year}</span>
                <svg
                  aria-label={`${t().thesesPerYear}: ${summary()}`}
                  class="text-primary"
                  height={HEIGHT}
                  role="img"
                  viewBox={`0 0 ${years().length * (BAR_WIDTH + BAR_GAP) - BAR_GAP} ${HEIGHT}`}
                  width={years().length * (BAR_WIDTH + BAR_GAP) - BAR_GAP}
                >
                  <For each={years()}>
                    {(entry, index) => {
                      const height = () =>
                        entry.total === 0
                          ? 1
                          : Math.max(2, (entry.total / max()) * HEIGHT);
                      return (
                        <rect
                          class={
                            entry.total === 0 ? 'fill-border' : 'fill-current'
                          }
                          height={height()}
                          rx={1.5}
                          width={BAR_WIDTH}
                          x={index() * (BAR_WIDTH + BAR_GAP)}
                          y={HEIGHT - height()}
                        >
                          <title>{`${entry.year}: ${entry.total}`}</title>
                        </rect>
                      );
                    }}
                  </For>
                </svg>
                <span aria-hidden="true">{years().at(-1)?.year}</span>
              </div>
            </Show>
          </div>
        );
      }}
    </Show>
  );
};

export default MentorYearProfile;
