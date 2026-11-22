import { ArrowUp } from '@lucide/solid';
import { createSignal, onSettled } from 'solid-js';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { useLanguage } from '@/lib/LanguageProvider';

// Shown once the page is scrolled about two screens down, where scrolling
// back up through a long mentor list gets tedious.
const SHOW_AFTER_SCREENS = 2;

const prefersReducedMotion = () =>
  typeof matchMedia === 'function' &&
  matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function BackToTop() {
  const { t } = useLanguage();
  const [visible, setVisible] = createSignal(false);

  onSettled(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setVisible(scrollY > innerHeight * SHOW_AFTER_SCREENS);
    };
    const onScroll = () => {
      frame ||= requestAnimationFrame(update);
    };

    update();
    addEventListener('scroll', onScroll, { passive: true });
    return () => {
      removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  });

  return (
    <button
      aria-hidden={visible() ? 'false' : 'true'}
      aria-label={t().backToTop}
      class={cn(
        buttonVariants({ size: 'icon', variant: 'outline' }),
        'fixed right-4 bottom-4 z-40 rounded-full bg-background/90 shadow-md backdrop-blur transition-opacity sm:right-6 sm:bottom-6',
        visible() ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
      onClick={() => {
        scrollTo({
          behavior: prefersReducedMotion() ? 'auto' : 'smooth',
          top: 0,
        });
      }}
      tabindex={visible() ? 0 : -1}
      title={t().backToTop}
      type="button"
    >
      <ArrowUp
        aria-hidden="true"
        class="size-5"
      />
    </button>
  );
}
