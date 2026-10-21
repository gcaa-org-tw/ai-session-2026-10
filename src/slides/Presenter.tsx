import { useCallback, useEffect, useState } from 'react';
import { clampSlide } from '../lib/slideNav';
import { ensureLiveSession, setSlide, useLiveSession } from '../session/useLiveSession';
import SlideView from './SlideView';
import { sectionLabels, slides } from './slides';

interface PresenterProps {
  presenter: boolean;
}

const navButton =
  'rounded-lg bg-emerald-700 px-5 py-3 text-base font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50';

function errorText(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export default function Presenter({ presenter }: PresenterProps) {
  if (!presenter) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-xl bg-white p-6 text-center shadow">
          <h1 className="mb-4 text-2xl font-bold">此頁僅限主持人</h1>
          <a className="text-emerald-700 underline" href="#/">
            回到簡報
          </a>
        </div>
      </main>
    );
  }
  return <PresenterConsole />;
}

function PresenterConsole() {
  const { state, error, loading } = useLiveSession();
  const [initError, setInitError] = useState<string | null>(null);
  const [writeError, setWriteError] = useState<string | null>(null);
  const [writing, setWriting] = useState(false);

  useEffect(() => {
    ensureLiveSession().catch((err: unknown) => setInitError(errorText(err)));
  }, []);

  const index = state ? clampSlide(state.slideIndex, slides.length) : 0;

  const go = useCallback(
    async (target: number) => {
      if (writing || !state) return;
      const next = clampSlide(target, slides.length);
      if (next === index) return;
      setWriting(true);
      setWriteError(null);
      try {
        await setSlide(next);
      } catch (err) {
        setWriteError(`切換失敗：${errorText(err)}`);
      } finally {
        setWriting(false);
      }
    },
    [writing, state, index],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target;
      if (el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))) return;
      if (e.key === 'ArrowRight') void go(index + 1);
      if (e.key === 'ArrowLeft') void go(index - 1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, index]);

  const message = error ?? initError;
  if (message) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-xl bg-white p-6 text-center shadow">
          <h1 className="mb-2 text-xl font-bold">無法取得簡報進度</h1>
          <p role="alert" className="mb-6 break-words text-red-700">
            {message}
          </p>
          <button type="button" className={navButton} onClick={() => window.location.reload()}>
            重試
          </button>
        </div>
      </main>
    );
  }

  if (loading || !state) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div role="status" aria-label="載入中" className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-700" />
      </main>
    );
  }

  const slide = slides[index];
  const nextSlide = slides[index + 1];
  if (!slide) return null;

  return (
    <main className="min-h-screen bg-slate-50 p-4">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <p data-testid="section-label" className="text-lg font-semibold">
            {sectionLabels[slide.section]}
          </p>
          <p data-testid="slide-counter" className="text-slate-600">
            第 {index + 1}／{slides.length} 張
          </p>
        </header>

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div data-testid="presenter-current">
            <SlideView slide={slide} index={index} />
          </div>
          <div className="flex flex-col gap-4">
            <div data-testid="presenter-next">
              <p className="mb-1 text-sm text-slate-500">下一張</p>
              {nextSlide ? (
                <SlideView slide={nextSlide} index={index + 1} />
              ) : (
                <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-500">最後一張</p>
              )}
            </div>
            <aside data-testid="notes-slot" className="min-h-32 rounded-xl border border-dashed border-slate-300 p-4 text-slate-500">
              備忘稿尚未載入
            </aside>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="button" className={navButton} disabled={writing || index === 0} onClick={() => void go(index - 1)}>
            上一張
          </button>
          <button
            type="button"
            className={navButton}
            disabled={writing || index >= slides.length - 1}
            onClick={() => void go(index + 1)}
          >
            下一張
          </button>
          {writing && <span className="text-sm text-slate-500">儲存中…</span>}
        </div>
        {writeError && (
          <p role="alert" className="text-red-700">
            {writeError}
          </p>
        )}
      </div>
    </main>
  );
}
