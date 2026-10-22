import { describe, expect, test } from 'vitest';
import { blockHash, landingHash, neighbours, parseSiteRoute, sectionHash, sectionIds, sectionSlides } from '../../src/slides/siteRoute';
import { slides } from '../../src/slides/slides';

describe('parseSiteRoute', () => {
  test('parses a section', () => expect(parseSiteRoute('/s/2')).toEqual({ section: 2, slideId: null }));
  test('parses a section with a slide', () => expect(parseSiteRoute('/s/2/habits')).toEqual({ section: 2, slideId: 'habits' }));
  test('accepts a trailing slash', () => expect(parseSiteRoute('/s/2/habits/')).toEqual({ section: 2, slideId: 'habits' }));
  test('unknown slide falls back to the section top', () => expect(parseSiteRoute('/s/2/nope')).toEqual({ section: 2, slideId: null }));
  test('a slide from another section falls back to the section top', () =>
    expect(parseSiteRoute('/s/2/logic')).toEqual({ section: 2, slideId: null }));
  test('unknown section is rejected', () => expect(parseSiteRoute('/s/7')).toBeNull());
  test('non-numeric section is rejected', () => expect(parseSiteRoute('/s/abc')).toBeNull());
  test('other routes are rejected', () => {
    for (const route of ['/', '/presenter', '/s', '/s/', '/s/1/2/3']) expect(parseSiteRoute(route)).toBeNull();
  });
});

describe('sectionSlides', () => {
  test('every slide appears in exactly one section, in deck order', () => {
    const grouped = sectionIds.flatMap((id) => sectionSlides(id));
    expect(grouped.map((s) => s.id)).toEqual(slides.map((s) => s.id));
  });
  test('slides inside a section keep deck order', () => {
    for (const id of sectionIds) {
      const indexes = sectionSlides(id).map((s) => slides.indexOf(s));
      expect(indexes).toEqual([...indexes].sort((a, b) => a - b));
    }
  });
});

describe('hashes', () => {
  test('section hash', () => expect(sectionHash(3)).toBe('#/s/3'));
  test('block hash', () => {
    const habits = slides.find((s) => s.id === 'habits');
    expect(habits && blockHash(habits)).toBe('#/s/2/habits');
  });
});

describe('landingHash', () => {
  test('no session lands on section 0', () => expect(landingHash(null)).toBe('#/s/0'));
  test('a live session lands on its slide', () => {
    const index = slides.findIndex((s) => s.id === 'habits');
    expect(landingHash(index)).toBe('#/s/2/habits');
  });
  test('an out-of-range index clamps to the last slide', () => {
    const last = slides[slides.length - 1];
    expect(landingHash(999)).toBe(last && blockHash(last));
  });
  test('a negative index clamps to the first slide', () => {
    const first = slides[0];
    expect(landingHash(-3)).toBe(first && blockHash(first));
  });
});

describe('neighbours', () => {
  test('first section has no previous', () => expect(neighbours(0)).toEqual({ previous: null, next: 1 }));
  test('middle section has both', () => expect(neighbours(3)).toEqual({ previous: 2, next: 4 }));
  test('last section has no next', () => expect(neighbours(6)).toEqual({ previous: 5, next: null }));
});
