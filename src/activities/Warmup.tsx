import { useMemo } from 'react';
import { copy } from '../content/copy';
import { useAllEntries, useMyEntry } from '../entries/useEntries';
import { aggregateWarmup } from '../lib/scoring';
import type { WarmMark, WarmupEntry } from '../lib/types';
import { useDraft } from './hooks';
import { BoardFrame, buttonBase, LoadFailure, LoadingBlock, SaveStatus, wrapText } from './ui';

const MARKS: WarmMark[] = ['using', 'worse', 'none'];
const TYPE_IDS = copy.workTypes.map((t) => t.id);
const EMPTY: WarmupEntry = { marks: {}, note: '' };

function Tally() {
  const { entries, loading, error } = useAllEntries<WarmupEntry>('warmup');
  const counts = useMemo(
    () => aggregateWarmup(entries.map((e) => e.value), TYPE_IDS),
    [entries],
  );
  return (
    <BoardFrame testId="warm-tally" loading={loading} error={error} empty={entries.length === 0}>
      <table className="w-full table-fixed border-collapse text-sm">
        <thead>
          <tr>
            <th className="w-1/3 p-1 text-left" />
            {MARKS.map((m) => (
              <th key={m} className={`p-1 text-left font-semibold ${wrapText}`}>
                {copy.warmMarks[m]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {copy.workTypes.map((t) => (
            <tr key={t.id} className="border-t border-slate-200">
              <td className={`p-1 ${wrapText}`}>{t.label}</td>
              {MARKS.map((m) => (
                <td key={m} data-testid={`tally-${t.id}-${m}`} className="p-1 tabular-nums">
                  {counts[t.id]?.[m] ?? 0}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </BoardFrame>
  );
}

export default function Warmup() {
  const { value, status, failed, error, save, retry } = useMyEntry<WarmupEntry>('warmup');
  const draft = useDraft<WarmupEntry>(value, EMPTY, save);
  const busy = status === 'loading' || status === 'saving';

  if (failed === 'read') return <LoadFailure message={error ?? ''} />;
  if (status === 'loading') return <LoadingBlock />;

  const current = draft.value;

  return (
    <div className="flex flex-col gap-5">
      <ul className="flex flex-col gap-3">
        {copy.workTypes.map((t) => (
          <li key={t.id} data-testid={`warm-row-${t.id}`} className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3">
            <p className={`font-semibold ${wrapText}`}>{t.label}</p>
            <div className="flex flex-wrap gap-2">
              {MARKS.map((m) => {
                const selected = current.marks[t.id] === m;
                return (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={selected}
                    disabled={busy}
                    className={`${buttonBase} ${selected ? 'border-emerald-700 bg-emerald-50 text-emerald-900' : 'border-slate-300 bg-white'}`}
                    onClick={() => draft.change({ ...current, marks: { ...current.marks, [t.id]: m } }, true)}
                  >
                    {copy.warmMarks[m]}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ul>
      <input
        type="text"
        aria-label={copy.warmNotePlaceholder}
        placeholder={copy.warmNotePlaceholder}
        value={current.note}
        className="w-full rounded-lg border-2 border-slate-300 px-3 py-2"
        onChange={(e) => draft.change({ ...current, note: e.target.value }, false)}
      />
      <SaveStatus status={status} failed={failed} error={error} hasValue={value !== null} onRetry={() => void retry()} />
      <Tally />
    </div>
  );
}
