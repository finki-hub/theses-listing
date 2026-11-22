import { FilterX } from '@lucide/solid';
import { createUniqueId, For, Show } from 'solid-js';

import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/input';
import { formatNumber, formatUpdatedAt } from '@/lib/format';
import { interpolate } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import { getStatusLabel } from '@/lib/statuses';

import type { SectionId, StatusTone } from '../section';

import { FILTERABLE_TONES, RECENT_FILTER, toneFilterValue } from '../selectors';
import MentorsSearchInput from './MentorsSearchInput';
import StatusToneFilter from './StatusToneFilter';

type MentorsToolbarProps = {
  filteredDiplomasCount: number;
  filteredMentorsCount: number;
  hasActiveFilters: boolean;
  lastUpdatedAt: null | string;
  onClearFilters: () => void;
  search: string;
  section: SectionId;
  setSearch: (value: string) => void;
  setStatusFilter: (value: string) => void;
  setYearFilter: (value: string) => void;
  statusFilter: string;
  statusOptions: string[];
  toneCounts: Record<StatusTone, number>;
  totalDiplomasCount: number;
  totalMentorsCount: number;
  yearFilter: string;
  yearOptions: string[];
};

const fieldLabelClass = 'block text-sm font-medium text-foreground';

const MentorsToolbar = (props: MentorsToolbarProps) => {
  const { language, t } = useLanguage();
  const searchId = createUniqueId();
  const toneLabel = (tone: StatusTone) =>
    ({
      cancelled: t().statusCancelled,
      complete: t().statusComplete,
      progress: t().statusInProgress,
      unknown: '',
    })[tone];
  const date = () =>
    props.lastUpdatedAt
      ? formatUpdatedAt(props.lastUpdatedAt, language())
      : t().refreshPending;
  return (
    <div class="mb-4">
      <div class="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1.15fr)] xl:items-end">
        <div class="space-y-1.5">
          <label
            class={fieldLabelClass}
            for={searchId}
          >
            {t().search}
          </label>
          <MentorsSearchInput
            id={searchId}
            onInput={props.setSearch}
            value={props.search}
          />
        </div>

        <div class="grid grid-cols-2 gap-3 xl:grid-cols-[minmax(180px,1fr)_minmax(140px,0.85fr)] xl:items-end">
          <label class="block space-y-1.5">
            <span class={fieldLabelClass}>{t().status}</span>
            <NativeSelect
              onChange={(event) => {
                props.setStatusFilter(event.currentTarget.value);
              }}
              value={props.statusFilter}
            >
              <option
                selected={props.statusFilter === ''}
                value=""
              >
                {t().allStatuses}
              </option>
              <optgroup label={t().statusState}>
                <For each={FILTERABLE_TONES}>
                  {(tone) => (
                    <option
                      selected={props.statusFilter === toneFilterValue(tone)}
                      value={toneFilterValue(tone)}
                    >
                      {toneLabel(tone)}
                    </option>
                  )}
                </For>
              </optgroup>
              <optgroup label={t().statusDetailed}>
                <For each={props.statusOptions}>
                  {(status) => (
                    <option
                      selected={props.statusFilter === status}
                      value={status}
                    >
                      {getStatusLabel(status, props.section, language())}
                    </option>
                  )}
                </For>
              </optgroup>
            </NativeSelect>
          </label>

          <label class="block space-y-1.5">
            <span class={fieldLabelClass}>{t().year}</span>
            <NativeSelect
              onChange={(event) => {
                props.setYearFilter(event.currentTarget.value);
              }}
              value={props.yearFilter}
            >
              <option
                selected={props.yearFilter === ''}
                value=""
              >
                {t().allYears}
              </option>
              <option
                selected={props.yearFilter === RECENT_FILTER}
                value={RECENT_FILTER}
              >
                {t().yearRecent}
              </option>
              <For each={props.yearOptions}>
                {(year) => (
                  <option
                    selected={props.yearFilter === year}
                    value={year}
                  >
                    {year}
                  </option>
                )}
              </For>
            </NativeSelect>
          </label>
        </div>
      </div>

      <div class="mt-3">
        <StatusToneFilter
          counts={props.toneCounts}
          onChange={props.setStatusFilter}
          value={props.statusFilter}
        />
      </div>

      <div class="mt-3 flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span aria-live="polite">
            {interpolate(t().mentorsResults, {
              shown: formatNumber(props.filteredMentorsCount, language()),
              total: formatNumber(props.totalMentorsCount, language()),
            })}
            {' · '}
            {interpolate(t().sections[props.section].results, {
              shown: formatNumber(props.filteredDiplomasCount, language()),
              total: formatNumber(props.totalDiplomasCount, language()),
            })}
          </span>
          <Show when={props.hasActiveFilters}>
            <Button
              class="-my-1 h-7 px-2 text-primary hover:text-primary"
              onClick={() => {
                props.onClearFilters();
              }}
              size="sm"
              variant="ghost"
            >
              <FilterX
                aria-hidden="true"
                class="size-4"
              />
              {t().clearFilters}
            </Button>
          </Show>
        </div>
        <div>{interpolate(t().lastUpdated, { date: date() })}</div>
      </div>
    </div>
  );
};

export default MentorsToolbar;
