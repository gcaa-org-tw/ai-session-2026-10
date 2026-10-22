import { useLiveSession } from '../session/useLiveSession';
import { clampSlide } from '../lib/slideNav';
import SlideView from './SlideView';
import { sectionLabels, slides } from './slides';

export default function Follower() {
  const { state, error, loading } = useLiveSession();

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper p-6">
        <div className="w-full max-w-md rounded-xl bg-sheet p-6 text-center border border-grid">
          <h1 className="mb-2 font-kai text-xl font-bold">無法取得簡報進度</h1>
          <p role="alert" className="mb-6 break-words text-proof">
            {error}
          </p>
          <button
            type="button"
            className="rounded-lg bg-ink px-5 py-3 font-semibold text-white hover:bg-ink/90"
            onClick={() => window.location.reload()}
          >
            重試
          </button>
        </div>
      </main>
    );
  }

  if (loading) {
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

  if (!state) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper p-6">
        <p className="text-xl text-ink-muted">等待主持人開始</p>
      </main>
    );
  }

  const index = clampSlide(state.slideIndex, slides.length);
  const slide = slides[index];
  if (!slide) return null;

  return (
    <main className="min-h-screen bg-paper p-3 sm:p-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-3">
        <SlideView slide={slide} index={index} />
        <p className="text-center text-sm text-ink-muted">
          {sectionLabels[slide.section]}，第 {index + 1}／{slides.length} 張
        </p>
      </div>
    </main>
  );
}
