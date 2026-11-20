import { ChevronDown } from 'lucide-solid';
import { createSignal, createUniqueId, For, Show } from 'solid-js';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';
import { formatNumber } from '@/lib/format';
import { interpolate } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import { BREAKPOINTS } from '@/lib/media-query';
import { readBrowserStorage, writeBrowserStorage } from '@/lib/safe-storage';

import type { StatusTone } from '../section';

import { RECENT_FILTER } from '../selectors';
import { niceAxisMax, type YearCount, type YearStats } from '../year-stats';
import { toneDotClasses } from './StatusToneFilter';

type YearChartProps = {
  loading: boolean;
  onSelectYear: (year: string) => void;
  selectedYear: string;
  stats: YearStats;
};

const STORAGE_KEY = 'finki-hub-year-chart';
const TONES: StatusTone[] = ['complete', 'progress', 'cancelled'];
// Below this many years a chart says less than the year dropdown does.
const MIN_YEARS = 3;

// The current year, read without constructing a Date.
const currentYear = new Intl.DateTimeFormat('en', { year: 'numeric' }).format();

// Open by default where there is room; phones start collapsed so the list
// stays near the top. The reader's choice is remembered.
const initiallyOpen = () => {
  const saved = readBrowserStorage(STORAGE_KEY);
  return saved === 'open' || saved === 'closed'
    ? saved === 'open'
    : typeof matchMedia !== 'function' || matchMedia(BREAKPOINTS.sm).matches;
};

// The year still in progress gets a hatched bar: its count is not final.
const partialYearStyle = {
  'background-image':
    'repeating-linear-gradient(135deg, transparent 0 3px, hsl(var(--card) / 0.45) 3px 6px)',
};

const Tooltip = (props: { count: number; entry: YearCount; index: number }) => {
  const { language, t } = useLanguage();
  const labels = (): Record<StatusTone, string> => ({
    cancelled: t().statusCancelled,
    complete: t().statusComplete,
    progress: t().statusInProgress,
    unknown: '',
  });
  // Beside the bar at the top of the plot, so it never covers the bar or
  // leaves the card; on the side with more room.
  const position = () =>
    props.index < props.count / 2
      ? { left: `calc(${((props.index + 1) / props.count) * 100}% + 0.25rem)` }
      : {
          right: `calc(${((props.count - props.index) / props.count) * 100}% + 0.25rem)`,
        };

  return (
    <div
      class="pointer-events-none absolute top-0 z-20 min-w-36 rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md"
      style={position()}
    >
      <div class="font-medium">
        {props.entry.year === currentYear
          ? interpolate(t().yearSoFar, { year: props.entry.year })
          : props.entry.year}
      </div>
      <div class="mb-1 text-base font-semibold tabular-nums">
        {formatNumber(props.entry.total, language())}
      </div>
      <For each={TONES.filter((tone) => props.entry.byTone[tone] > 0)}>
        {(tone) => (
          <div class="flex items-center gap-1.5 text-muted-foreground">
            <span
              aria-hidden="true"
              class={cn('size-2 rounded-full', toneDotClasses[tone])}
            />
            <span class="flex-1">{labels()[tone]}</span>
            <span class="text-foreground tabular-nums">
              {formatNumber(props.entry.byTone[tone], language())}
            </span>
          </div>
        )}
      </For>
    </div>
  );
};

const Plot = (props: YearChartProps) => {
  const { language, t } = useLanguage();
  const [active, setActive] = createSignal<null | number>(null);
  const max = () =>
    niceAxisMax(Math.max(...props.stats.years.map((entry) => entry.total)));
  const count = () => props.stats.years.length;
  // On phones, label every other year (always including the latest).
  const labelHiddenOnPhone = (index: number) =>
    count() > 8 && (count() - 1 - index) % 2 === 1;

  return (
    <div class="flex gap-2">
      {/* Recessive y-axis: the top and middle gridline values only. */}
      <div
        aria-hidden="true"
        class="flex h-36 w-8 shrink-0 flex-col justify-between text-right text-[0.6875rem] text-muted-foreground tabular-nums"
      >
        <span class="-translate-y-1/2">{formatNumber(max(), language())}</span>
        <span class="-translate-y-1/2">
          {formatNumber(max() / 2, language())}
        </span>
        <span class="translate-y-1/2">0</span>
      </div>

      <div class="min-w-0 flex-1">
        <div
          class="relative h-36"
          onMouseLeave={() => setActive(null)}
        >
          <div
            aria-hidden="true"
            class="pointer-events-none absolute inset-0 flex flex-col justify-between"
          >
            <div class="border-t border-dashed border-border" />
            <div class="border-t border-dashed border-border" />
            <div class="border-t border-border" />
          </div>

          <div class="relative flex h-full items-end gap-0.5 sm:gap-1">
            <For each={props.stats.years}>
              {(entry, index) => {
                const selected = () => props.selectedYear === entry.year;
                // "Last 30 days" isn't a bar, so it dims nothing.
                const dimmed = () =>
                  props.selectedYear.length > 0 &&
                  props.selectedYear !== RECENT_FILTER &&
                  !selected();
                return (
                  <button
                    aria-label={`${entry.year === currentYear ? interpolate(t().yearSoFar, { year: entry.year }) : entry.year}: ${formatNumber(entry.total, language())}`}
                    aria-pressed={selected()}
                    class="group flex h-full min-w-0 flex-1 cursor-pointer items-end justify-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    disabled={entry.total === 0}
                    onBlur={() => setActive(null)}
                    onClick={() => {
                      props.onSelectYear(selected() ? '' : entry.year);
                    }}
                    onFocus={() => setActive(index())}
                    onMouseEnter={() => setActive(index())}
                    type="button"
                  >
                    <span
                      class={cn(
                        'w-full max-w-10 rounded-t-[4px] bg-primary transition-opacity',
                        dimmed() ? 'opacity-30' : 'opacity-80',
                        'group-hover:opacity-100',
                        selected() && 'opacity-100',
                      )}
                      style={{
                        height: `${(entry.total / max()) * 100}%`,
                        'min-height': entry.total > 0 ? '2px' : '0',
                        ...(entry.year === currentYear && partialYearStyle),
                      }}
                    />
                  </button>
                );
              }}
            </For>
          </div>

          <Show when={active()}>
            {(index) => (
              <Show when={props.stats.years[index()]}>
                {(entry) => (
                  <Tooltip
                    count={count()}
                    entry={entry()}
                    index={index()}
                  />
                )}
              </Show>
            )}
          </Show>
        </div>

        <div
          aria-hidden="true"
          class="mt-1.5 flex gap-0.5 sm:gap-1"
        >
          <For each={props.stats.years}>
            {(entry, index) => (
              <span
                class={cn(
                  'min-w-0 flex-1 text-center text-[0.6875rem] text-muted-foreground tabular-nums',
                  labelHiddenOnPhone(index()) && 'invisible sm:visible',
                  props.selectedYear === entry.year &&
                    'font-semibold text-foreground',
                )}
              >
                {/* Two digits keep 13+ labels from colliding on phones. */}
                <span class="sm:hidden">’{entry.year.slice(2)}</span>
                <span class="hidden sm:inline">{entry.year}</span>
              </span>
            )}
          </For>
        </div>
      </div>
    </div>
  );
};

const YearChart = (props: YearChartProps) => {
  const { language, t } = useLanguage();
  const [open, setOpen] = createSignal(initiallyOpen());
  const panelId = createUniqueId();

  return (
    <Show when={props.loading || props.stats.years.length >= MIN_YEARS}>
      <Card class="mb-6 gap-0 py-0">
        <button
          aria-controls={panelId}
          aria-expanded={open()}
          class="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-5"
          onClick={() => {
            const next = !open();
            setOpen(next);
            writeBrowserStorage(STORAGE_KEY, next ? 'open' : 'closed');
          }}
          type="button"
        >
          <span class="text-sm font-semibold">{t().thesesPerYear}</span>
          <ChevronDown
            aria-hidden="true"
            class={cn(
              'size-4 shrink-0 text-muted-foreground transition-transform',
              open() && 'rotate-180',
            )}
          />
        </button>

        <Show when={open()}>
          <div
            class="border-t px-4 pt-4 pb-3 sm:px-5"
            id={panelId}
          >
            <Show
              fallback={<Skeleton class="h-40 w-full" />}
              when={!props.loading}
            >
              <Plot {...props} />
              <div class="mt-3 flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>{t().yearChartHint}</span>
                <Show when={props.stats.undated > 0}>
                  <span>
                    {interpolate(t().yearUndated, {
                      count: formatNumber(props.stats.undated, language()),
                    })}
                  </span>
                </Show>
              </div>
            </Show>
          </div>
        </Show>
      </Card>
    </Show>
  );
};

export default YearChart;
