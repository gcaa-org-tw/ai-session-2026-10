import { useEffect, useRef } from 'react';
import type { KeyboardEvent, RefObject } from 'react';
import type { SlideId } from '../content/copy';
import { sectionNumerals, ui } from '../content/ui';
import type { SectionId } from '../lib/types';
import { goToSlide, scrollToSectionTop } from './siteNav';
import { blockHash, sectionHash, sectionIds, sectionSlides } from './siteRoute';
import { sectionLabels } from './slides';

interface TocListProps {
  section: SectionId;
  activeId: SlideId | null;
  onNavigate?: () => void;
}

export function TocList({ section, activeId, onNavigate }: TocListProps) {
  return (
    <nav aria-label={ui.toc}>
      <ol className="flex flex-col gap-1">
        {sectionIds.map((id) => {
          const current = id === section;
          return (
            <li key={id}>
              <a
                href={sectionHash(id)}
                aria-current={current ? 'true' : undefined}
                className="flex items-baseline gap-3 rounded py-2 text-base font-medium text-ink"
                onClick={(e) => {
                  onNavigate?.();
                  if (!current) return;
                  e.preventDefault();
                  scrollToSectionTop(id);
                }}
              >
                <span aria-hidden="true" className="w-5 shrink-0 font-kai text-lg font-bold">
                  {sectionNumerals[id]}
                </span>
                <span className={current ? 'font-bold' : undefined}>{sectionLabels[id]}</span>
              </a>
              {current && (
                <ol className="mb-2 ml-2 flex flex-col gap-0.5 border-l border-grid pl-4">
                  {sectionSlides(id).map((slide) => (
                    <li key={slide.id}>
                      <a
                        href={blockHash(slide)}
                        aria-current={slide.id === activeId ? 'location' : undefined}
                        className={`inline rounded py-1 text-[0.9375rem] leading-snug text-ink ${slide.id === activeId ? 'toc-current' : ''}`}
                        onClick={(e) => {
                          e.preventDefault();
                          onNavigate?.();
                          goToSlide(slide, section, false);
                        }}
                      >
                        {slide.title}
                      </a>
                    </li>
                  ))}
                </ol>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

interface TocSheetProps extends TocListProps {
  open: boolean;
  onClose: () => void;
  opener: RefObject<HTMLButtonElement | null>;
}

export function TocSheet({ open, onClose, opener, ...list }: TocSheetProps) {
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const button = opener.current;
    dialog.current?.querySelector<HTMLElement>('a, button')?.focus();
    return () => button?.focus({ preventScroll: true });
  }, [open, opener]);

  if (!open) return null;

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== 'Tab') return;
    const focusable = Array.from(dialog.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? []);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden" onKeyDown={onKeyDown}>
      <div aria-hidden="true" data-testid="toc-backdrop" className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-label={ui.toc}
        className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col gap-4 overflow-y-auto bg-paper p-5 shadow-2xl"
      >
        <button
          type="button"
          className="self-end rounded border border-grid bg-sheet px-3 py-1 text-sm font-semibold text-ink"
          onClick={onClose}
        >
          {ui.closeToc}
        </button>
        <TocList {...list} onNavigate={onClose} />
      </div>
    </div>
  );
}
