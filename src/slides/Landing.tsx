import { useEffect } from 'react';
import { useLiveSession } from '../session/useLiveSession';
import { navigateHash } from './siteNav';
import { landingHash } from './siteRoute';

export default function Landing() {
  const { state, loading } = useLiveSession();

  useEffect(() => {
    if (loading) return;
    navigateHash(landingHash(state ? state.slideIndex : null), true);
  }, [loading, state]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper p-6">
      <div className="text-center">
        <div
          role="status"
          aria-label="載入中"
          data-testid="session-loading"
          className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-grid-soft border-t-ink"
        />
        <p className="mt-4 text-ink-muted">載入中…</p>
      </div>
    </main>
  );
}
