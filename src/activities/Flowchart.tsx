import { useState } from 'react';
import { copy } from '../content/copy';
import { buttonBase, EmptyNote, wrapText } from './ui';

const labelOf = new Map(copy.flowchart.map((s) => [s.id, s.label]));

export default function Flowchart() {
  const [selected, setSelected] = useState<string | null>(null);

  if (copy.flowchart.length === 0) return <EmptyNote />;

  return (
    <ol className="flex flex-col gap-2">
      {copy.flowchart.map((step) => {
        const isSelected = selected === step.id;
        return (
          <li key={step.id} className="flex min-w-0 flex-col gap-2">
            <button
              type="button"
              data-testid={`flow-${step.id}`}
              aria-pressed={isSelected}
              className={`${buttonBase} w-full text-left ${wrapText} ${isSelected ? 'border-emerald-700 bg-emerald-50 text-emerald-900' : 'border-slate-300 bg-white'}`}
              onClick={() => setSelected(step.id)}
            >
              {step.label}
            </button>
            {isSelected && (
              <div data-testid="flow-detail" className="flex flex-col gap-2 rounded-lg bg-slate-50 p-3">
                <p className={wrapText}>{step.detail}</p>
                {step.next.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {step.next.map((id) => (
                      <button
                        key={id}
                        type="button"
                        data-testid={`flow-next-${id}`}
                        className={`${buttonBase} border-slate-300 bg-white text-left text-sm ${wrapText}`}
                        onClick={() => setSelected(id)}
                      >
                        → {labelOf.get(id) ?? id}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
