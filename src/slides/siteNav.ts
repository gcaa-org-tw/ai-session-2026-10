import { flushSync } from 'react-dom';
import type { SectionId } from '../lib/types';
import { blockHash, sectionHash, sectionSlides } from './siteRoute';
import type { SlideDef } from './slides';

export function motionBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

export function navigateHash(hash: string, replace: boolean): void {
  if (!replace) {
    window.location.hash = hash;
    return;
  }
  window.history.replaceState(null, '', hash);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

export function withViewTransition(update: () => void): void {
  if (!('startViewTransition' in document)) {
    update();
    return;
  }
  document.startViewTransition(() => {
    flushSync(update);
  });
}

export function scrollToBlock(slide: SlideDef, behavior: ScrollBehavior): boolean {
  const el = document.getElementById(`block-${slide.id}`);
  if (!el) return false;
  el.scrollIntoView({ behavior, block: 'start' });
  el.focus({ preventScroll: true });
  window.history.replaceState(null, '', blockHash(slide));
  return true;
}

export function scrollToSectionTop(section: SectionId): void {
  window.scrollTo({ top: 0, behavior: motionBehavior() });
  window.history.replaceState(null, '', sectionHash(section));
}

export function goToSlide(slide: SlideDef, currentSection: SectionId, replace: boolean): void {
  if (slide.section === currentSection && scrollToBlock(slide, motionBehavior())) return;
  navigateHash(blockHash(slide), replace);
}

export function skipActivity(slide: SlideDef): void {
  const blocks = sectionSlides(slide.section);
  const next = blocks[blocks.indexOf(slide) + 1];
  if (next && scrollToBlock(next, motionBehavior())) return;
  const target = document.getElementById('section-next') ?? document.getElementById('section-footer');
  target?.scrollIntoView({ behavior: motionBehavior(), block: 'center' });
}
