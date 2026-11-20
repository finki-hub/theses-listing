import { A } from '@solidjs/router';
import { For, Show } from 'solid-js';

import { cn } from '@/lib/cn';
import { useLanguage } from '@/lib/LanguageProvider';

import { DIPLOMAS_SECTION, MASTERS_SECTION, type SectionId } from '../section';

type SectionSwitchProps = {
  active: SectionId;
  // The free-text search carries over between sections; status and year
  // filters do not, because their options differ per section.
  search: string;
};

type SectionTab = {
  basePath: string;
  value: SectionId;
};

const sectionTabs: SectionTab[] = [
  {
    basePath: DIPLOMAS_SECTION.basePath,
    value: DIPLOMAS_SECTION.id,
  },
  {
    basePath: MASTERS_SECTION.basePath,
    value: MASTERS_SECTION.id,
  },
];

const buildHref = (basePath: string, search: string) => {
  const query = search.trim();
  return query.length > 0
    ? `${basePath}?${new URLSearchParams({ q: query }).toString()}`
    : basePath;
};

const SectionSwitch = (props: SectionSwitchProps) => {
  const { t } = useLanguage();

  return (
    <nav
      aria-label={t().sectionNavigation}
      class="inline-flex flex-wrap rounded-xl bg-muted p-1"
    >
      <For each={sectionTabs}>
        {(tab) => {
          const isActive = () => props.active === tab.value;
          return (
            <A
              aria-current={isActive() ? 'page' : undefined}
              class={cn(
                'relative inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                isActive()
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              end
              href={buildHref(tab.basePath, props.search)}
            >
              {t().sections[tab.value].tab}
              <Show when={isActive()}>
                <span
                  aria-hidden="true"
                  class="absolute bottom-1 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-primary"
                />
              </Show>
            </A>
          );
        }}
      </For>
    </nav>
  );
};

export default SectionSwitch;
