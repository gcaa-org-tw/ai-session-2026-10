import { useEffect } from 'react';
import type { SlideId } from '../content/copy';
import type { SectionId } from '../lib/types';
import { blockHash, sectionSlides } from './siteRoute';

const WRITE_DELAY_MS = 200;
const BAND_MARGIN = '-100px 0px -70% 0px';

export function useScrollSpy(section: SectionId, activeId: SlideId | null, onActive: (id: SlideId) => void): void {
  useEffect(() => {
    const blocks = sectionSlides(section);
    const last = blocks[blocks.length - 1];
    if (!last || !('IntersectionObserver' in window)) return undefined;
    const targets = new Map<Element, number>();
    blocks.forEach((slide, i) => {
      const el = document.getElementById(`block-${slide.id}`);
      if (el) targets.set(el, i);
    });
    const footer = document.getElementById('section-footer');
    if (footer) targets.set(footer, blocks.length - 1);

    const observer = new IntersectionObserver(
      (entries) => {
        const hits = entries.filter((e) => e.isIntersecting).map((e) => targets.get(e.target));
        const first = Math.min(...hits.map((i) => i ?? Infinity));
        const slide = blocks[first];
        if (slide) onActive(slide.id);
      },
      { rootMargin: BAND_MARGIN },
    );
    targets.forEach((_, el) => observer.observe(el));
    return () => observer.disconnect();
  }, [section, onActive]);

  useEffect(() => {
    if (activeId === null) return undefined;
    const slide = sectionSlides(section).find((s) => s.id === activeId);
    if (!slide) return undefined;
    const timer = window.setTimeout(() => {
      if (window.scrollY <= 0) return;
      window.history.replaceState(null, '', blockHash(slide));
    }, WRITE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [section, activeId]);
}
