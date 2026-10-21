import Placeholder from './Placeholder';
import type { SlideDef } from './slides';

interface SlideViewProps {
  slide: SlideDef;
  index: number;
  preview?: boolean;
}

export default function SlideView({ slide, index, preview = false }: SlideViewProps) {
  return (
    <section
      data-slide-index={index}
      data-slide-id={slide.id}
      className="aspect-[16/9] w-full overflow-hidden rounded-xl bg-white shadow"
    >
      {preview && slide.kind === 'activity' ? <Placeholder title={slide.title} body="互動活動" /> : slide.render()}
    </section>
  );
}
