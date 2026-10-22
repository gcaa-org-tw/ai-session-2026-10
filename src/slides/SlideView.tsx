import Placeholder from './Placeholder';
import type { SlideDef } from './slides';

interface SlideViewProps {
  slide: SlideDef;
  index: number;
  preview?: boolean;
  isPresenter?: boolean;
}

export default function SlideView({ slide, index, preview = false, isPresenter = false }: SlideViewProps) {
  const frame = preview
    ? 'aspect-[16/9] overflow-hidden'
    : slide.kind === 'content'
      ? 'aspect-[16/9]'
      : '';
  return (
    <section
      data-slide-index={index}
      data-slide-id={slide.id}
      className={`${frame} w-full rounded-xl bg-sheet border border-grid`}
    >
      {preview && slide.kind === 'activity' ? <Placeholder title={slide.title} body="互動活動" /> : slide.render({ isPresenter })}
    </section>
  );
}
