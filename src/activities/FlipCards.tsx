import { useState } from 'react';
import { copy } from '../content/copy';
import { EmptyNote, optionButton, wrapText } from './ui';

const face = `flip-face flex min-h-32 flex-col items-start gap-1 rounded-lg border p-4 ${wrapText}`;

export default function FlipCards() {
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});

  if (copy.metaphors.length === 0) return <EmptyNote />;

  return (
    <ul data-testid="concepts" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {copy.metaphors.map((m) => {
        const isBack = flipped[m.id] === true;
        return (
          <li key={m.id} className="min-w-0">
            <button
              type="button"
              data-testid={`concept-${m.id}`}
              aria-pressed={isBack}
              className="flip-card block w-full text-left"
              onClick={() => setFlipped((prev) => ({ ...prev, [m.id]: !isBack }))}
            >
              <span className={`flip-inner grid ${isBack ? 'is-flipped' : ''}`}>
                <span aria-hidden={isBack} className={`${face} ${optionButton(false)} ${isBack ? 'invisible' : ''}`}>
                  <span className="text-lg font-bold">{m.term}</span>
                  <span className="text-ink">{m.front}</span>
                </span>
                <span aria-hidden={!isBack} className={`${face} flip-back ${optionButton(true)} ${isBack ? '' : 'invisible'}`}>
                  <span className="text-lg font-bold">{m.term}</span>
                  <span className="text-sm text-ink-muted">{m.gloss}</span>
                  <span>{m.back}</span>
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
