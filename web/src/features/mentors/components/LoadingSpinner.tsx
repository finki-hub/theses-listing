import { LoaderCircle } from 'lucide-solid';

import { useLanguage } from '@/lib/LanguageProvider';

export default function LoadingSpinner() {
  const { t } = useLanguage();
  return (
    // <output> has an implicit "status" role, so the message is announced.
    <output class="flex items-center justify-center py-12">
      <span class="flex flex-col items-center gap-3">
        <LoaderCircle
          aria-hidden="true"
          class="h-8 w-8 animate-spin text-muted-foreground"
        />
        <span class="text-sm text-muted-foreground">{t().loading}</span>
      </span>
    </output>
  );
}
