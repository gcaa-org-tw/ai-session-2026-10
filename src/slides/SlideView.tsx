import type { SlideDef } from './slides';

interface SlideViewProps {
  slide: SlideDef;
  index: number;
}

export default function SlideView({ slide, index }: SlideViewProps) {
  return (
    <section
      data-slide-index={index}
      data-slide-id={slide.id}
      className="aspect-[16/9] w-full overflow-hidden rounded-xl bg-white shadow"
    >
      {slide.render()}
    </section>
  );
}
