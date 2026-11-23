import { Monitor, Moon, Sun } from '@lucide/solid';
import { createSignal, Match, onSettled, Switch } from 'solid-js';

import { Button } from '@/components/ui/button';
import { interpolate } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import {
  readBrowserStorage,
  removeBrowserStorage,
  writeBrowserStorage,
} from '@/lib/safe-storage';

type Theme = 'dark' | 'light';
type ThemePreference = 'system' | Theme;

const THEME_COLORS: Record<Theme, string> = {
  dark: '#0a0a0a',
  light: '#ffffff',
};

const NEXT_PREFERENCE: Record<ThemePreference, ThemePreference> = {
  dark: 'system',
  light: 'dark',
  system: 'light',
};

const darkQuery = () =>
  typeof matchMedia === 'function'
    ? matchMedia('(prefers-color-scheme: dark)')
    : null;

const getSystemTheme = (): Theme => (darkQuery()?.matches ? 'dark' : 'light');

const getInitialPreference = (): ThemePreference => {
  const stored = readBrowserStorage('theme');
  return stored === 'dark' || stored === 'light' ? stored : 'system';
};

const resolveTheme = (value: ThemePreference): Theme =>
  value === 'system' ? getSystemTheme() : value;

const initialPreference = getInitialPreference();

const [preference, setPreference] =
  createSignal<ThemePreference>(initialPreference);

export const [theme, setTheme] = createSignal<Theme>(
  resolveTheme(initialPreference),
);

const applyTheme = (next: Theme) => {
  setTheme(next);
  const root = document.documentElement;
  root.dataset['kbTheme'] = next;
  root.style.colorScheme = next;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', THEME_COLORS[next]);
};

const storePreference = (next: ThemePreference) => {
  if (next === 'system') {
    removeBrowserStorage('theme');
    return;
  }

  writeBrowserStorage('theme', next);
};

export default function ThemeToggle() {
  const { t } = useLanguage();

  onSettled(() => {
    applyTheme(resolveTheme(preference()));

    const query = darkQuery();
    const onSystemChange = () => {
      if (preference() === 'system') applyTheme(getSystemTheme());
    };

    query?.addEventListener('change', onSystemChange);
    return () => {
      query?.removeEventListener('change', onSystemChange);
    };
  });

  const cycle = () => {
    const next = NEXT_PREFERENCE[preference()];
    setPreference(next);
    storePreference(next);
    applyTheme(resolveTheme(next));
  };

  const label = () =>
    interpolate(t().themeToggle, {
      mode: {
        dark: t().themeDark,
        light: t().themeLight,
        system: t().themeSystem,
      }[preference()],
    });

  return (
    <Button
      aria-label={label()}
      onClick={cycle}
      size="icon"
      title={label()}
      variant="outline"
    >
      <Switch>
        <Match when={preference() === 'system'}>
          <Monitor
            aria-hidden="true"
            class="size-4"
          />
        </Match>
        <Match when={preference() === 'dark'}>
          <Moon
            aria-hidden="true"
            class="size-4"
          />
        </Match>
        <Match when={preference() === 'light'}>
          <Sun
            aria-hidden="true"
            class="size-4"
          />
        </Match>
      </Switch>
    </Button>
  );
}
