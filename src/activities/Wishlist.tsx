import { useMemo } from 'react';
import { copy } from '../content/copy';
import { useAllEntries, useMyEntry } from '../entries/useEntries';
import { triageBin } from '../lib/scoring';
import type { WishBin, WishEntry, WishItem } from '../lib/types';
import ExportCsv from './ExportCsv';
import { useDraft, useNameOptIn } from './hooks';
import type { ActivityProps } from './types';
import { BoardFrame, LoadFailure, LoadingBlock, NameError, SaveStatus, wrapText } from './ui';

const SLOTS = 3;
const BINS: WishBin[] = ['now', 'build', 'learn'];
const QUESTIONS = ['repeats', 'rulesWritable', 'sourceCheckable'] as const;

const blankItem: WishItem = { text: '', repeats: false, rulesWritable: false, sourceCheckable: false, optInName: false };
const EMPTY: WishEntry = { items: Array.from({ length: SLOTS }, () => blankItem) };

function padded(entry: WishEntry | null): WishEntry | null {
  if (!entry) return null;
  return { items: Array.from({ length: SLOTS }, (_, i) => entry.items[i] ?? blankItem) };
}

function Board() {
  const { entries, loading, error } = useAllEntries<WishEntry>('wishlist');
  const groups = useMemo(() => {
    const out: Record<WishBin, string[]> = { now: [], build: [], learn: [] };
    for (const { value } of entries) {
      for (const item of value.items) {
        if (item.text.trim() !== '') out[triageBin(item)].push(item.text);
      }
    }
    return out;
  }, [entries]);
  const total = groups.now.length + groups.build.length + groups.learn.length;

  return (
    <BoardFrame testId="wish-board" loading={loading} error={error} empty={total === 0}>
      <div className="flex flex-col gap-3">
        {BINS.filter((bin) => groups[bin].length > 0).map((bin) => (
          <section key={bin} data-testid={`wish-group-${bin}`} className="rounded-lg bg-paper p-3">
            <h3 className="mb-1 font-semibold">{copy.wishBins[bin]}</h3>
            <ul className="flex flex-col gap-1">
              {groups[bin].map((text, i) => (
                <li key={i} className={wrapText}>
                  {text}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </BoardFrame>
  );
}

export default function Wishlist({ isPresenter }: ActivityProps) {
  const { value, status, failed, error, save, retry } = useMyEntry<WishEntry>('wishlist');
  const name = useNameOptIn();
  const draft = useDraft<WishEntry>(
    padded(value),
    EMPTY,
    (v) => save({ items: v.items.filter((item) => item.text.trim() !== '') }),
  );

  if (failed === 'read') return <LoadFailure message={error ?? ''} />;
  if (status === 'loading') return <LoadingBlock />;

  const items = draft.value.items;

  function update(slot: number, patch: Partial<WishItem>, immediate: boolean) {
    const next = items.map((item, i) => (i === slot ? { ...item, ...patch } : item));
    draft.change({ items: next }, immediate);
    if (patch.optInName === true) void name.remember();
  }

  return (
    <div className="flex flex-col gap-5">
      <ul className="flex flex-col gap-4">
        {items.map((item, slot) => (
          <li key={slot} data-testid={`wish-item-${slot}`} className="flex flex-col gap-3 rounded-lg border border-grid-soft p-3">
            <textarea
              rows={2}
              aria-label={`${copy.slides.wishlist.title} ${slot + 1}`}
              placeholder={copy.wishPlaceholder}
              value={item.text}
              className="w-full rounded-lg border-2 border-grid px-3 py-2"
              onChange={(e) => update(slot, { text: e.target.value }, false)}
            />
            {QUESTIONS.map((q) => (
              <label key={q} className="flex items-start gap-2">
                <input type="checkbox" checked={item[q]} className="mt-1 h-5 w-5" onChange={(e) => update(slot, { [q]: e.target.checked }, true)} />
                <span className={wrapText}>{copy.wishQuestions[q]}</span>
              </label>
            ))}
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={item.optInName}
                className="mt-1 h-5 w-5"
                onChange={(e) => update(slot, { optInName: e.target.checked }, true)}
              />
              <span className={wrapText}>{copy.optInLabel}</span>
            </label>
            {item.text.trim() !== '' && (
              <p data-testid={`wish-bin-${slot}`} className="w-fit rounded-full bg-mark px-3 py-1 text-sm font-semibold text-ink">
                {copy.wishBins[triageBin(item)]}
              </p>
            )}
          </li>
        ))}
      </ul>
      <SaveStatus status={status} failed={failed} error={error} hasValue={value !== null} onRetry={() => void retry()} />
      <NameError error={name.error} busy={name.busy} onRetry={() => void name.remember()} />
      <Board />
      {isPresenter && <ExportCsv />}
    </div>
  );
}
