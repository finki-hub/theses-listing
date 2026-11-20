import { For } from 'solid-js';

import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/lib/LanguageProvider';

const ROW_WIDTHS = [
  'w-48',
  'w-40',
  'w-56',
  'w-36',
  'w-44',
  'w-52',
  'w-40',
  'w-48',
];

// Placeholder rows shaped like the mentor list, so the layout doesn't jump
// when the data arrives.
export default function ListSkeleton() {
  const { t } = useLanguage();
  return (
    <div class="overflow-hidden rounded-md border">
      {/* <output> has an implicit "status" role, so the message is announced. */}
      <output class="sr-only">{t().loading}</output>
      <For each={ROW_WIDTHS}>
        {(width) => (
          <div class="flex items-center gap-4 border-b px-4 py-3 last:border-0">
            <Skeleton class="hidden h-4 w-6 sm:block" />
            <Skeleton class={`h-4 ${width} max-w-[60%]`} />
            <Skeleton class="ml-auto hidden h-1.5 w-28 rounded-full md:block" />
            <Skeleton class="h-4 w-8" />
          </div>
        )}
      </For>
    </div>
  );
}
