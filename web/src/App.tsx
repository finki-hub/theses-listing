import { createRouter } from '@solidjs/router';

import { Toaster } from '@/components/ui/sonner.tsx';
import { DIPLOMAS_SECTION, MASTERS_SECTION } from '@/features/mentors/section';
import { LanguageProvider } from '@/lib/LanguageProvider';
import MentorsPage from '@/pages/MentorsPage';

// Distinct wrapper components per section guarantee a remount (fresh data
// fetch and URL-state read) when switching between the two routes.
const DiplomasPage = () => <MentorsPage config={DIPLOMAS_SECTION} />;
const MastersPage = () => <MentorsPage config={MASTERS_SECTION} />;

const routes = [
  { component: DiplomasPage, path: '/' },
  { component: DiplomasPage, path: '/mentors' },
  { component: MastersPage, path: '/masters' },
];

const Router = createRouter({ routes });

export default function App() {
  return (
    <LanguageProvider>
      <Router />
      <Toaster position="bottom-right" />
    </LanguageProvider>
  );
}
