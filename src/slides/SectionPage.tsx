import { Fragment, useLayoutEffect, useMemo } from 'react';
import { ui } from '../content/ui';
import type { SectionId } from '../lib/types';
import type { SlideId } from '../content/copy';
import { scrollToBlock, skipActivity } from './siteNav';
import { neighbours, sectionSlides } from './siteRoute';
import { sectionLabels, slides } from './slides';
import type { SlideDef } from './slides';

const MAX_STAGGER = 12;
const STAGGER_MS = 45;

function SectionTitle({ label }: { label: string }) {
  return (
    <h1 aria-label={label} className="flex max-w-[40rem] flex-wrap overflow-hidden pl-px pt-px">
      {Array.from(label).map((char, i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{ animationDelay: `${Math.min(i, MAX_STAGGER) * STAGGER_MS}ms` }}
          className="cell-settle -ml-px -mt-px flex h-10 w-10 items-center justify-center border border-grid font-kai text-2xl font-bold text-ink sm:h-14 sm:w-14 sm:text-4xl"
        >
          {char}
        </span>
      ))}
      <span aria-hidden="true" className="title-fill -ml-px -mt-px h-10 min-w-0 flex-1 sm:h-14" />
    </h1>
  );
}

function Block({ slide }: { slide: SlideDef }) {
  const { Extra } = slide;
  const isActivity = slide.kind === 'activity';
  return (
    <section
      id={`block-${slide.id}`}
      data-slide-id={slide.id}
      data-slide-index={slides.indexOf(slide)}
      tabIndex={-1}
      className="scroll-mt-28 focus:outline-none lg:scroll-mt-10"
    >
      <h2 className="max-w-[40rem] font-kai text-[1.625rem] font-bold leading-[1.35] [overflow-wrap:anywhere]">{slide.title}</h2>
      {slide.body.map((paragraph, i) => (
        <p key={i} className="mt-4 max-w-[40rem] text-[1.125rem] [overflow-wrap:anywhere]">
          {paragraph}
        </p>
      ))}
      {Extra && isActivity && (
        <div className="worksheet relative mt-6 max-w-[40rem] rounded-lg border border-grid bg-sheet p-4 sm:p-6">
          <div className="relative flex justify-end">
            <button
              type="button"
              className="rounded text-sm text-ink-muted underline hover:text-ink"
              onClick={() => skipActivity(slide)}
            >
              {ui.skipActivity}
            </button>
          </div>
          <div className="relative mt-2">
            <Extra isPresenter={false} />
          </div>
        </div>
      )}
      {Extra && !isActivity && (
        <div className={`mt-6 ${slide.id === 'workflows' ? 'max-w-[56rem]' : 'max-w-[40rem]'}`}>
          <Extra isPresenter={false} />
        </div>
      )}
    </section>
  );
}

function SectionFooter({ section }: { section: SectionId }) {
  const { previous, next } = neighbours(section);
  return (
    <footer id="section-footer" className="mt-24 flex max-w-[40rem] scroll-mt-28 flex-col gap-6 border-t border-grid pt-10">
      <nav aria-label={ui.sectionNav} className="flex flex-col gap-6">
        {next !== null && (
          <a id="section-next" href={`#/s/${next}`} className="font-kai text-3xl font-bold leading-snug text-ink underline decoration-grid decoration-2 underline-offset-8 [overflow-wrap:anywhere]">
            {ui.nextSection}
            {sectionLabels[next]}
          </a>
        )}
        {previous !== null && (
          <a href={`#/s/${previous}`} className="text-base text-ink-muted underline underline-offset-4 [overflow-wrap:anywhere]">
            {ui.previousSection}
            {sectionLabels[previous]}
          </a>
        )}
      </nav>
    </footer>
  );
}

interface SectionPageProps {
  section: SectionId;
  slideId: SlideId | null;
}

export default function SectionPage({ section, slideId }: SectionPageProps) {
  const blocks = useMemo(() => sectionSlides(section), [section]);

  useLayoutEffect(() => {
    const target = blocks.find((s) => s.id === slideId);
    if (target && scrollToBlock(target, 'auto')) return;
    window.scrollTo(0, 0);
  }, [blocks, slideId]);

  return (
    <div className="mx-auto w-full max-w-[56rem] lg:mx-0">
      <SectionTitle label={sectionLabels[section]} />
      <div className="mt-14 flex flex-col">
        {blocks.map((slide, i) => (
          <Fragment key={slide.id}>
            {i > 0 && <hr className="my-12 max-w-[40rem] border-0 border-t border-dashed border-grid-soft" />}
            <Block slide={slide} />
          </Fragment>
        ))}
      </div>
      <SectionFooter section={section} />
    </div>
  );
}
