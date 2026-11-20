import { ChevronRight } from 'lucide-solid';
import { createUniqueId, Show } from 'solid-js';

import { Card } from '@/components/ui/card';
import { formatNumber } from '@/lib/format';
import { useLanguage } from '@/lib/LanguageProvider';

import type { MentorListItemProps } from './types';

import { displayName } from '../../utils';
import HighlightedText from '../HighlightedText';
import DiplomaCountBadge from './DiplomaCountBadge';
import DiplomaDetailsTable from './DiplomaDetailsTable';

const MentorMobileCard = (props: MentorListItemProps) => {
  const { language } = useLanguage();
  const detailsId = createUniqueId();
  return (
    <Card class="gap-0 overflow-hidden border-border/70 py-0 shadow-sm">
      <button
        aria-controls={props.expanded ? detailsId : undefined}
        aria-expanded={props.expanded}
        class="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
        onClick={() => {
          props.onToggle();
        }}
        type="button"
      >
        <div class="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ChevronRight
            aria-hidden="true"
            class={`h-4 w-4 transition-transform duration-200 ${props.expanded ? 'rotate-90' : ''}`}
          />
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between gap-3">
            <div class="min-w-0 flex-1">
              <div
                class="text-sm font-semibold leading-5"
                style={{ 'overflow-wrap': 'anywhere' }}
              >
                <Show when={props.showRank}>
                  <span class="mr-1.5 font-normal text-muted-foreground tabular-nums">
                    {formatNumber(props.index + 1, language())}.
                  </span>
                </Show>
                <HighlightedText
                  text={displayName(props.summary.mentor, language())}
                />
              </div>
            </div>
            <DiplomaCountBadge
              compact
              filteredCount={props.summary.filteredDiplomas.length}
              hasActiveFilters={props.hasActiveFilters}
              share={props.getCountShare(props.summary.totalDiplomas)}
              totalCount={props.summary.totalDiplomas}
            />
          </div>
        </div>
      </button>

      <Show when={props.expanded}>
        <div
          class="border-t border-border/60 bg-muted/20"
          id={detailsId}
        >
          <DiplomaDetailsTable
            allDiplomas={props.summary.diplomas}
            diplomas={props.summary.filteredDiplomas}
            getFileUrl={props.getFileUrl}
            getSearchAttemptId={props.getSearchAttemptId}
            getStatusInfo={props.getStatusInfo}
            mentor={props.summary.mentor}
            section={props.section}
          />
        </div>
      </Show>
    </Card>
  );
};

export default MentorMobileCard;
