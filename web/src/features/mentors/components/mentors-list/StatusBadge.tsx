import { Show } from 'solid-js';

import { cn } from '@/lib/cn';
import { interpolate } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import { getStatusLabel } from '@/lib/statuses';

import type { SectionId, StatusInfo, StatusTone } from '../../section';

const toneClasses: Record<StatusTone, string> = {
  cancelled:
    'border-red-600/25 bg-red-500/10 text-red-800 dark:border-red-400/30 dark:text-red-300',
  complete:
    'border-green-600/30 bg-green-500/10 text-green-800 dark:border-green-400/40 dark:bg-green-500/15 dark:text-green-300',
  progress:
    'border-blue-600/25 bg-blue-500/10 text-blue-800 dark:border-blue-400/40 dark:bg-blue-500/15 dark:text-blue-300',
  unknown: 'border-border bg-muted text-muted-foreground',
};

const dotClasses: Record<StatusTone, string> = {
  cancelled: 'bg-red-600 dark:bg-red-400',
  complete: 'bg-green-600 dark:bg-green-400',
  progress: 'bg-blue-600 dark:bg-blue-400',
  unknown: 'bg-muted-foreground',
};

type StatusBadgeProps = {
  info: StatusInfo;
  section: SectionId;
  status: string;
};

const StatusBadge = (props: StatusBadgeProps) => {
  const { language, t } = useLanguage();
  const stepLabel = () =>
    props.info.stage === null
      ? ''
      : interpolate(t().statusStep, {
          step: props.info.stage,
          total: props.info.maxStage,
        });

  return (
    <span
      class={cn(
        'inline-flex max-w-full items-start gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium',
        toneClasses[props.info.tone],
      )}
      title={stepLabel() || undefined}
    >
      <span
        aria-hidden="true"
        class={cn(
          'mt-1.5 size-1.5 shrink-0 rounded-full',
          dotClasses[props.info.tone],
        )}
      />
      <span class="min-w-0">
        <Show when={props.info.stage !== null}>
          <span class="mr-1 tabular-nums opacity-75">
            <span aria-hidden="true">
              {props.info.stage}/{props.info.maxStage}
            </span>
            <span class="sr-only">{stepLabel()}:</span>
          </span>
        </Show>
        {getStatusLabel(props.status, props.section, language()) || '\u{2014}'}
      </span>
    </span>
  );
};

export default StatusBadge;
