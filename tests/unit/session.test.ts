import { describe, expect, test } from 'vitest';
import { clampSlide } from '../../src/lib/slideNav';
import { copy } from '../../src/content/copy';
import { sectionLabels, slides } from '../../src/slides/slides';
import type { SectionId } from '../../src/lib/types';

describe('clampSlide', () => {
  test('clamps below zero', () => expect(clampSlide(-1, 10)).toBe(0));
  test('clamps past the end', () => expect(clampSlide(10, 10)).toBe(9));
  test('keeps in-range values', () => expect(clampSlide(3, 10)).toBe(3));
  test('empty deck returns 0', () => expect(clampSlide(5, 0)).toBe(0));
  test('non-integer rounds down', () => expect(clampSlide(2.7, 10)).toBe(2));
  test('NaN returns 0', () => expect(clampSlide(Number.NaN, 10)).toBe(0));
});

describe('slides', () => {
  const sections: SectionId[] = [0, 1, 2, 3, 4, 5, 6];
  test.each(sections)('section %i has at least one slide', (section) => {
    expect(slides.filter((s) => s.section === section).length).toBeGreaterThan(0);
  });
  test('slide ids are unique', () => {
    expect(new Set(slides.map((s) => s.id)).size).toBe(slides.length);
  });
  test('activity slides with shared state name their activity', () => {
    const stateless = ['concepts', 'flowchart', 'folder-rules', 'liudu'];
    for (const s of slides) {
      if (s.kind !== 'activity') continue;
      if (stateless.includes(s.id)) expect(s.activity).toBeUndefined();
      else expect(s.activity).toBeDefined();
    }
  });
  test('slides follow the draft order exactly', () => {
    expect(slides.map((s) => s.id)).toEqual(Object.keys(copy.slides));
    expect(slides).toHaveLength(23);
  });
  test('section labels come from the draft', () => {
    expect(sectionLabels).toEqual(copy.sections);
  });
});
