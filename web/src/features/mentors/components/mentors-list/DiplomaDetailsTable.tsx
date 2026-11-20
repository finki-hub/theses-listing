import { Link } from 'lucide-solid';
import { For } from 'solid-js';
import { toast } from 'solid-sonner';

import type { Diploma } from '@/types';

import { Button } from '@/components/ui/button';
import DownloadButton from '@/features/mentors/components/mentors-list/DownloadButton.tsx';
import { formatThesisDate } from '@/lib/format';
import { useLanguage } from '@/lib/LanguageProvider';

import type { StatusInfo } from '../../section';
import type { DiplomaDetailsTableProps } from './types';

import { displayName } from '../../utils';
import HighlightedText from '../HighlightedText';
import StatusBadge from './StatusBadge';

const DateDisplay = (props: { value: string }) => {
  const { language } = useLanguage();
  return <>{formatThesisDate(props.value, language())}</>;
};

const buildMentorLink = (mentor: string) => {
  const params = new URLSearchParams({ mentor });
  return `${location.origin}${location.pathname}?${params.toString()}`;
};

const CopyMentorLinkButton = (props: { mentor: string }) => {
  const { t } = useLanguage();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(buildMentorLink(props.mentor));
      toast.success(t().linkCopied);
    } catch {
      toast.error(t().linkCopyError);
    }
  };

  return (
    <Button
      class="h-8 px-2 text-muted-foreground"
      onClick={() => {
        void copy();
      }}
      size="sm"
      variant="ghost"
    >
      <Link
        aria-hidden="true"
        class="size-4"
      />
      {t().copyMentorLink}
    </Button>
  );
};

const MobileDiplomaCard = (props: {
  diploma: Diploma;
  getFileUrl: (fileId: null | string) => null | string;
  getSearchAttemptId: () => string | undefined;
  getStatusInfo: (status: string) => StatusInfo;
  section: 'diplomas' | 'masters';
}) => {
  const { language } = useLanguage();
  const url = () => props.getFileUrl(props.diploma.fileId);
  return (
    <li class="space-y-2 py-3 text-sm first:pt-0 last:pb-0">
      <div
        class="font-medium leading-5"
        style={{ 'overflow-wrap': 'anywhere' }}
      >
        <HighlightedText text={props.diploma.title} />
      </div>
      <div
        class="text-muted-foreground"
        style={{ 'overflow-wrap': 'anywhere' }}
      >
        <HighlightedText
          text={displayName(props.diploma.student, language())}
        />
      </div>
      <div class="flex items-start gap-2">
        <div class="min-w-0 flex-1">
          <StatusBadge
            info={props.getStatusInfo(props.diploma.status)}
            section={props.section}
            status={props.diploma.status}
          />
        </div>
        <span class="shrink-0 pt-0.5 text-xs whitespace-nowrap text-muted-foreground tabular-nums">
          <DateDisplay value={props.diploma.dateOfSubmission} />
        </span>
        <DownloadButton
          class="-mt-1 -mr-1.5 shrink-0"
          getSearchAttemptId={props.getSearchAttemptId}
          section={props.section}
          url={url()}
        />
      </div>
    </li>
  );
};

const DiplomaDetailsTable = (props: DiplomaDetailsTableProps) => {
  const { language, t } = useLanguage();
  return (
    <div class="bg-muted/30 px-4 py-3 md:px-8 md:py-4">
      {/* Card layout below md: the fixed-width columns need room to read well. */}
      <ul class="divide-y divide-border/60 md:hidden">
        <For each={props.diplomas}>
          {(diploma) => (
            <MobileDiplomaCard
              diploma={diploma}
              getFileUrl={props.getFileUrl}
              getSearchAttemptId={props.getSearchAttemptId}
              getStatusInfo={props.getStatusInfo}
              section={props.section}
            />
          )}
        </For>
      </ul>

      <table class="hidden w-full table-fixed text-sm md:table">
        <thead>
          <tr class="border-b text-muted-foreground">
            <th
              class="w-[22%] pr-4 pb-2 text-left font-medium"
              scope="col"
            >
              {t().student}
            </th>
            <th
              class="pr-4 pb-2 text-left font-medium"
              scope="col"
            >
              {t().title}
            </th>
            <th
              class="w-[24%] pr-4 pb-2 text-left font-medium"
              scope="col"
            >
              {t().status}
            </th>
            <th
              class="w-28 pr-4 pb-2 text-left font-medium"
              scope="col"
            >
              {t().date}
            </th>
            <th
              class="w-16 pb-2 text-center font-medium"
              scope="col"
            >
              {t().file}
            </th>
          </tr>
        </thead>
        <tbody>
          <For each={props.diplomas}>
            {(diploma) => (
              <tr class="border-b border-border/50 align-top last:border-0">
                <td
                  class="py-2.5 pr-4"
                  style={{ 'overflow-wrap': 'anywhere' }}
                >
                  <HighlightedText
                    text={displayName(diploma.student, language())}
                  />
                </td>
                <td
                  class="py-2.5 pr-4 leading-5"
                  style={{ 'overflow-wrap': 'anywhere' }}
                >
                  <HighlightedText text={diploma.title} />
                </td>
                <td class="py-2 pr-4">
                  <StatusBadge
                    info={props.getStatusInfo(diploma.status)}
                    section={props.section}
                    status={diploma.status}
                  />
                </td>
                <td class="py-2.5 pr-4 whitespace-nowrap text-muted-foreground tabular-nums">
                  <DateDisplay value={diploma.dateOfSubmission} />
                </td>
                <td class="py-1.5 text-center">
                  <DownloadButton
                    getSearchAttemptId={props.getSearchAttemptId}
                    section={props.section}
                    url={props.getFileUrl(diploma.fileId)}
                  />
                </td>
              </tr>
            )}
          </For>
        </tbody>
      </table>

      <div class="mt-2 flex justify-end border-t border-border/50 pt-2">
        <CopyMentorLinkButton mentor={props.mentor} />
      </div>
    </div>
  );
};

export default DiplomaDetailsTable;
