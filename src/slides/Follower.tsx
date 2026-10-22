import { useCallback, useEffect, useRef, useState } from 'react';
import type { SlideId } from '../content/copy';
import { sectionNumerals, ui } from '../content/ui';
import { clampSlide } from '../lib/slideNav';
import type { SectionId } from '../lib/types';
import { useLiveSession } from '../session/useLiveSession';
import PresenterPill from './PresenterPill';
import SectionPage from './SectionPage';
import { goToSlide } from './siteNav';
import { TocList, TocSheet } from './Toc';
import { useScrollSpy } from './useScrollSpy';
import { useWideLayout } from './useWideLayout';
import { sectionLabels, slides } from './slides';

const FOLLOW_KEY = 'follow-presenter';

function readFollow(): boolean {
  try {
    return window.localStorage.getItem(FOLLOW_KEY) === 'true';
  } catch {
    return false;
  }
}

function writeFollow(follow: boolean): void {
  try {
    window.localStorage.setItem(FOLLOW_KEY, String(follow));
  } catch {
    return;
  }
}

interface SectionFrameProps {
  section: SectionId;
  slideId: SlideId | null;
  session: ReturnType<typeof useLiveSession>;
  presenterIndex: number | null;
  follow: boolean;
  onFollowChange: (follow: boolean) => void;
}

function SectionFrame({ section, slideId, session, presenterIndex, follow, onFollowChange }: SectionFrameProps) {
  const [activeId, setActiveId] = useState<SlideId | null>(slideId);
  const [tocOpen, setTocOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  const closeToc = useCallback(() => setTocOpen(false), []);
  const wide = useWideLayout();
  useScrollSpy(section, activeId, setActiveId);
  const pill = (
    <PresenterPill
      session={session}
      presenterSlide={presenterIndex === null ? null : (slides[presenterIndex] ?? null)}
      activeId={activeId}
      follow={follow}
      onFollowChange={onFollowChange}
      onJump={(slide) => goToSlide(slide, section, false)}
    />
  );

  return (
    <div className="mx-auto min-h-screen max-w-[76rem] lg:flex">
      <header className="sticky top-0 z-30 border-b border-grid bg-paper lg:contents">
        <div className="flex items-center gap-3 px-4 py-2 lg:hidden">
          <button
            ref={opener}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={tocOpen}
            className="rounded border border-grid bg-sheet px-3 py-1 text-sm font-semibold text-ink"
            onClick={() => setTocOpen(true)}
          >
            {ui.toc}
          </button>
          <p className="min-w-0 truncate font-kai font-bold text-ink">
            第{sectionNumerals[section]}段<span className="ml-3">{sectionLabels[section]}</span>
          </p>
        </div>
        {!wide && pill}
      </header>
      <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[17rem] lg:shrink-0 lg:flex-col lg:overflow-y-auto lg:py-12 lg:pl-6 lg:pr-4">
        <TocList section={section} activeId={activeId} />
        {wide && pill}
      </aside>
      <TocSheet open={tocOpen} onClose={closeToc} opener={opener} section={section} activeId={activeId} />
      <main className="min-w-0 flex-1 px-4 pb-40 pt-8 sm:px-8 lg:px-12 lg:pt-14">
        <SectionPage section={section} slideId={slideId} />
      </main>
    </div>
  );
}

interface FollowerProps {
  section: SectionId;
  slideId: SlideId | null;
}

export default function Follower({ section, slideId }: FollowerProps) {
  const session = useLiveSession();
  const [follow, setFollow] = useState(readFollow);
  const sectionRef = useRef(section);
  const presenterIndex = session.state ? clampSlide(session.state.slideIndex, slides.length) : null;

  useEffect(() => {
    sectionRef.current = section;
  });

  useEffect(() => {
    window.history.scrollRestoration = 'manual';
  }, []);

  useEffect(() => {
    if (!follow || presenterIndex === null) return;
    const target = slides[presenterIndex];
    if (target) goToSlide(target, sectionRef.current, true);
  }, [follow, presenterIndex]);

  function changeFollow(next: boolean) {
    setFollow(next);
    writeFollow(next);
  }

  return (
    <SectionFrame
      key={section}
      section={section}
      slideId={slideId}
      session={session}
      presenterIndex={presenterIndex}
      follow={follow}
      onFollowChange={changeFollow}
    />
  );
}
