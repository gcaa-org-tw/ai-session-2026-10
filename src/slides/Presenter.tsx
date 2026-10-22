import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ui } from '../content/ui';
import { clampSlide } from '../lib/slideNav';
import { usePrivateDoc } from '../private/usePrivateDoc';
import { ensureLiveSession, setSlide, useLiveSession } from '../session/useLiveSession';
import { sectionIds } from './siteRoute';
import SlideView from './SlideView';
import { sectionLabels, slides } from './slides';

interface PresenterProps {
  presenter: boolean;
}

const navButton =
  'rounded-lg bg-ink px-5 py-3 text-base font-semibold text-white hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50';

function errorText(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function NotesPanel({ slideId }: { slideId: string }) {
  const { data, loading, error } = usePrivateDoc<Record<string, string>>('notes');
  const note = data?.[slideId];

  let body: ReactNode;
  if (error) {
    body = (
      <p role="alert" className="break-words text-proof">
        無法讀取備忘稿：{error}
      </p>
    );
  } else if (loading) {
    body = <p className="text-ink-muted">備忘稿載入中…</p>;
  } else if (!note) {
    body = <p className="text-ink-muted">這張沒有筆記</p>;
  } else {
    body = <p className="whitespace-pre-wrap text-ink">{note}</p>;
  }

  return (
    <aside data-testid="notes-slot" className="min-h-32 rounded-xl border border-grid bg-sheet p-4">
      {body}
    </aside>
  );
}

export default function Presenter({ presenter }: PresenterProps) {
  if (!presenter) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper p-6">
        <div className="w-full max-w-md rounded-xl bg-sheet p-6 text-center border border-grid">
          <h1 className="mb-4 font-kai text-2xl font-bold">此頁僅限主持人</h1>
          <a className="text-ink underline" href="#/">
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
      <main className="flex min-h-screen items-center justify-center bg-paper p-6">
        <div className="w-full max-w-md rounded-xl bg-sheet p-6 text-center border border-grid">
          <h1 className="mb-2 font-kai text-xl font-bold">無法取得簡報進度</h1>
          <p role="alert" className="mb-6 break-words text-proof">
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
      <main className="flex min-h-screen items-center justify-center bg-paper p-6">
        <div role="status" aria-label="載入中" className="h-10 w-10 animate-spin rounded-full border-4 border-grid-soft border-t-ink" />
      </main>
    );
  }

  const slide = slides[index];
  const nextSlide = slides[index + 1];
  if (!slide) return null;

  return (
    <main className="min-h-screen bg-paper p-4">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <p data-testid="section-label" className="flex items-center gap-2 text-lg font-semibold">
            <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full bg-proof" />
            {sectionLabels[slide.section]}
          </p>
          <p data-testid="slide-counter" className="text-ink-muted">
            第 {index + 1}／{slides.length} 張
          </p>
        </header>

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div data-testid="presenter-current">
            <SlideView slide={slide} index={index} isPresenter />
          </div>
          <div className="flex flex-col gap-4">
            <div data-testid="presenter-next">
              <p className="mb-1 text-sm text-ink-muted">下一張</p>
              {nextSlide ? (
                <SlideView slide={nextSlide} index={index + 1} preview />
              ) : (
                <p className="rounded-xl border border-dashed border-grid p-6 text-center text-ink-muted">最後一張</p>
              )}
            </div>
            <NotesPanel slideId={slide.id} />
          </div>
        </div>

        <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t border-grid bg-paper px-4 py-3">
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
          <div className="flex min-w-0 items-center gap-2">
            <label htmlFor="jump-to" className="text-ink-muted">
              {ui.jumpTo}
            </label>
            <select
              id="jump-to"
              value={index}
              disabled={writing}
              className="min-w-0 max-w-full rounded-lg border-2 border-grid bg-sheet px-3 py-2 text-base text-ink disabled:cursor-not-allowed disabled:opacity-50"
              onChange={(e) => void go(Number(e.target.value))}
            >
              {sectionIds.map((section) => (
                <optgroup key={section} label={sectionLabels[section]}>
                  {slides.map((s, i) =>
                    s.section === section ? (
                      <option key={s.id} value={i}>
                        {`${i + 1}. ${s.title}`}
                      </option>
                    ) : null,
                  )}
                </optgroup>
              ))}
            </select>
          </div>
          {writing && <span className="text-sm text-ink-muted">儲存中…</span>}
        </div>
        {writeError && (
          <p role="alert" className="text-proof">
            {writeError}
          </p>
        )}
      </div>
    </main>
  );
}
