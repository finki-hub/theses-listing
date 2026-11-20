import { Show } from 'solid-js';

import { cn } from '@/lib/cn';
import { interpolate } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import { getStatusLabel } from '@/lib/statuses';

import type { SectionId, StatusInfo, StatusTone } from '../../section';

import HighlightedText from '../HighlightedText';

const toneClasses: Record<StatusTone, string> = {
  cancelled: 'bg-red-500/10 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  complete:
    'bg-green-500/10 text-green-700 dark:bg-green-500/15 dark:text-green-300',
  progress:
    'bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  unknown: 'bg-muted text-muted-foreground',
};

const dotClasses: Record<StatusTone, string> = {
  cancelled: 'bg-red-600 dark:bg-red-400',
  complete: 'bg-green-600 dark:bg-green-400',
  progress: 'bg-blue-600 dark:bg-blue-400',
  unknown: 'bg-muted-foreground',
};

// Masters statuses carry their step number ("22. …") and most end with a
// period; the step is already shown next to the tone, so drop both here.
const LEADING_STEP_REGEX = /^\s*\d+\.\s*/u;
const TRAILING_PERIOD_REGEX = /\.\s*$/u;

export const cleanStatusDescription = (label: string) =>
  label.replace(LEADING_STEP_REGEX, '').replace(TRAILING_PERIOD_REGEX, '');

type StatusBadgeProps = {
  info: StatusInfo;
  section: SectionId;
  status: string;
};

const StatusBadge = (props: StatusBadgeProps) => {
  const { language, t } = useLanguage();

  const toneLabel = () =>
    ({
      cancelled: t().statusCancelled,
      complete: t().statusComplete,
      progress: t().statusInProgress,
      unknown: '',
    })[props.info.tone];

  const showProgress = () =>
    props.info.tone === 'progress' && props.info.stage !== null;

  const stepLabel = () =>
    interpolate(t().statusStep, {
      step: props.info.stage ?? 0,
      total: props.info.maxStage,
    });

  const description = () =>
    cleanStatusDescription(
      getStatusLabel(props.status, props.section, language()),
    );

  return (
    <div class="flex min-w-0 flex-col items-start gap-1">
      <Show when={toneLabel()}>
        <div class="flex max-w-full flex-wrap items-center gap-x-2 gap-y-1">
          <span
            class={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
              toneClasses[props.info.tone],
            )}
          >
            <span
              aria-hidden="true"
              class={cn('size-1.5 rounded-full', dotClasses[props.info.tone])}
            />
            {toneLabel()}
          </span>
          <Show when={showProgress()}>
            <span
              class="inline-flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums"
              title={stepLabel()}
            >
              <span
                aria-hidden="true"
                class="h-1 w-12 overflow-hidden rounded-full bg-blue-500/20"
              >
                <span
                  class="block h-full rounded-full bg-blue-600 dark:bg-blue-400"
                  style={{
                    width: `${((props.info.stage ?? 0) / props.info.maxStage) * 100}%`,
                  }}
                />
              </span>
              <span aria-hidden="true">
                {props.info.stage}/{props.info.maxStage}
              </span>
              <span class="sr-only">{stepLabel()}</span>
            </span>
          </Show>
        </div>
      </Show>
      <span
        class="text-xs leading-snug text-muted-foreground"
        style={{ 'overflow-wrap': 'anywhere' }}
      >
        <Show
          fallback={'\u{2014}'}
          when={description()}
        >
          <HighlightedText text={description()} />
        </Show>
      </span>
    </div>
  );
};

export default StatusBadge;
