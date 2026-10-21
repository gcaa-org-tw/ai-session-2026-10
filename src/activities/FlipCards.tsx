import { useState } from 'react';
import { copy } from '../content/copy';
import { EmptyNote, wrapText } from './ui';

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
              className={`flex min-h-32 w-full flex-col items-start gap-1 rounded-lg border-2 p-4 text-left ${wrapText} ${isBack ? 'border-emerald-700 bg-emerald-50' : 'border-slate-300 bg-white'}`}
              onClick={() => setFlipped((prev) => ({ ...prev, [m.id]: !isBack }))}
            >
              <span className="text-lg font-bold">{m.term}</span>
              {isBack ? (
                <>
                  <span className="text-sm text-slate-600">{m.gloss}</span>
                  <span>{m.back}</span>
                </>
              ) : (
                <span className="text-slate-700">{m.front}</span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
