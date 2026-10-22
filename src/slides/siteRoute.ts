import type { SlideId } from '../content/copy';
import { clampSlide } from '../lib/slideNav';
import type { SectionId } from '../lib/types';
import { slides } from './slides';
import type { SlideDef } from './slides';

export const sectionIds: SectionId[] = [0, 1, 2, 3, 4, 5, 6];

export interface SiteRoute {
  section: SectionId;
  slideId: SlideId | null;
}

const SITE_ROUTE = /^\/s\/(\d+)(?:\/([^/]+))?\/?$/;

export function parseSiteRoute(route: string): SiteRoute | null {
  const match = SITE_ROUTE.exec(route);
  if (!match) return null;
  const section = sectionIds.find((id) => id === Number(match[1]));
  if (section === undefined) return null;
  const slide = slides.find((s) => s.section === section && s.id === match[2]);
  return { section, slideId: slide ? slide.id : null };
}

export function sectionSlides(section: SectionId): SlideDef[] {
  return slides.filter((s) => s.section === section);
}

export function sectionHash(section: SectionId): string {
  return `#/s/${section}`;
}

export function blockHash(slide: SlideDef): string {
  return `#/s/${slide.section}/${slide.id}`;
}

export function landingHash(slideIndex: number | null): string {
  if (slideIndex === null) return sectionHash(0);
  const slide = slides[clampSlide(slideIndex, slides.length)];
  return slide ? blockHash(slide) : sectionHash(0);
}

export function neighbours(section: SectionId): { previous: SectionId | null; next: SectionId | null } {
  const at = sectionIds.indexOf(section);
  return { previous: sectionIds[at - 1] ?? null, next: sectionIds[at + 1] ?? null };
}
