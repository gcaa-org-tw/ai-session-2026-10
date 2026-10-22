import type { SlideId } from '../content/copy';
import { ui } from '../content/ui';
import type { LiveSession } from '../lib/types';
import type { SlideDef } from './slides';

interface PresenterPillProps {
  session: { state: LiveSession | null; error: string | null; loading: boolean };
  presenterSlide: SlideDef | null;
  activeId: SlideId | null;
  follow: boolean;
  onFollowChange: (follow: boolean) => void;
  onJump: (slide: SlideDef) => void;
}

const frame =
  'flex flex-wrap items-center gap-x-3 gap-y-1 px-4 pb-2 text-sm lg:sticky lg:bottom-4 lg:mt-auto lg:w-fit lg:max-w-full lg:rounded-lg lg:border lg:border-grid lg:bg-sheet lg:p-3';

const smallButton = 'rounded border border-grid bg-sheet px-3 py-1 text-sm font-semibold text-ink hover:bg-grid-soft';

export default function PresenterPill({ session, presenterSlide, activeId, follow, onFollowChange, onJump }: PresenterPillProps) {
  if (session.error) {
    return (
      <aside aria-label={ui.presenterStatus} data-testid="presenter-pill" className={frame}>
        <p role="alert" className="min-w-0 flex-1 text-proof [overflow-wrap:anywhere]">
          {ui.presenterError}
        </p>
        <button type="button" className={smallButton} onClick={() => window.location.reload()}>
          {ui.reloadPage}
        </button>
      </aside>
    );
  }
  if (session.loading || !session.state || !presenterSlide) return null;

  return (
    <aside aria-label={ui.presenterStatus} data-testid="presenter-pill" className={frame}>
      <p className="flex min-w-0 flex-1 basis-40 items-center gap-2 text-ink lg:basis-full">
        <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-proof" />
        <span data-testid="presenter-pill-text" className="min-w-0 truncate lg:whitespace-normal">
          {ui.presenterAt}
          {presenterSlide.title}
        </span>
      </p>
      {activeId !== presenterSlide.id && (
        <button type="button" className={smallButton} onClick={() => onJump(presenterSlide)}>
          {ui.presenterJump}
        </button>
      )}
      <label className="flex items-center gap-2 text-ink">
        <input type="checkbox" checked={follow} onChange={(e) => onFollowChange(e.target.checked)} />
        {ui.autoFollow}
      </label>
    </aside>
  );
}
