import { useMemo, useState } from 'react';
import { describeError } from '../auth/useAuth';
import { copy } from '../content/copy';
import type { HabitCard } from '../content/copy';
import { ui } from '../content/ui';
import { useAllEntries, useMyEntry } from '../entries/useEntries';
import { aggregateHabits } from '../lib/scoring';
import type { Bin, HabitsEntry } from '../lib/types';
import { setRevealed, useLiveSession } from '../session/useLiveSession';
import type { ActivityProps } from './types';
import { buttonBase, LoadFailure, LoadingBlock, primaryButton, SaveStatus, wrapText } from './ui';

const BINS: Bin[] = ['outdated', 'useful', 'new'];
const CARD_IDS = copy.habitCards.map((c) => c.id);

type Counts = Record<string, Record<Bin, number>>;

interface CardListProps {
  mine: HabitsEntry | null;
  busy: boolean;
  revealed: boolean;
  counts: Counts | null;
  onPlace: (cardId: string, bin: Bin) => void;
}

function CardList({ mine, busy, revealed, counts, onPlace }: CardListProps) {
  return (
    <ul className="flex flex-col gap-3">
      {copy.habitCards.map((card: HabitCard) => (
        <li key={card.id} data-testid={`habit-${card.id}`} className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3">
          <p className={`font-semibold ${wrapText}`}>{card.text}</p>
          <div className="grid grid-cols-3 gap-2">
            {BINS.map((bin) => {
              const selected = mine?.placements[card.id] === bin;
              return (
                <button
                  key={bin}
                  type="button"
                  aria-pressed={selected}
                  disabled={busy}
                  className={`${buttonBase} px-1 ${selected ? 'border-emerald-700 bg-emerald-50 text-emerald-900' : 'border-slate-300 bg-white'}`}
                  onClick={() => onPlace(card.id, bin)}
                >
                  {copy.bins[bin]}
                </button>
              );
            })}
          </div>
          {revealed && (
            <div className="flex flex-col gap-2 border-t border-slate-200 pt-2">
              {counts && (
                <ul className="grid grid-cols-3 gap-2 text-sm">
                  {BINS.map((bin) => (
                    <li
                      key={bin}
                      data-testid={`split-${bin}`}
                      className={`rounded p-2 ${bin === card.defaultBin ? 'bg-amber-50 ring-1 ring-amber-400' : 'bg-slate-50'}`}
                    >
                      <span className={wrapText}>{copy.bins[bin]}</span>{' '}
                      <span className="font-semibold tabular-nums">{counts[card.id]?.[bin] ?? 0}</span>
                      {bin === card.defaultBin && <span className="block text-xs text-amber-800">{ui.suggestedBin}</span>}
                    </li>
                  ))}
                </ul>
              )}
              <p className={`text-slate-700 ${wrapText}`}>{card.example}</p>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

interface ListProps {
  mine: HabitsEntry | null;
  busy: boolean;
  onPlace: (cardId: string, bin: Bin) => void;
}

function RevealedList({ mine, busy, onPlace }: ListProps) {
  const { entries, loading, error } = useAllEntries<HabitsEntry>('habits');
  const counts = useMemo(() => aggregateHabits(entries.map((e) => e.value), CARD_IDS), [entries]);
  return (
    <div className="flex flex-col gap-3">
      {error && <LoadFailure message={error} />}
      {loading && !error && <LoadingBlock />}
      <CardList mine={mine} busy={busy} revealed counts={loading || error ? null : counts} onPlace={onPlace} />
    </div>
  );
}

function RevealControl() {
  const [writing, setWriting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reveal() {
    setWriting(true);
    setError(null);
    try {
      await setRevealed('habits', true);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setWriting(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button type="button" className={primaryButton} disabled={writing} onClick={() => void reveal()}>
        {ui.reveal}
      </button>
      {error && (
        <p role="alert" className={`text-sm text-red-700 ${wrapText}`}>
          {copy.states.saveError}：{error}
        </p>
      )}
    </div>
  );
}

export default function Habits({ isPresenter }: ActivityProps) {
  const { value, status, failed, error, save, retry } = useMyEntry<HabitsEntry>('habits');
  const session = useLiveSession();
  const busy = status === 'loading' || status === 'saving';

  if (failed === 'read') return <LoadFailure message={error ?? ''} />;
  if (status === 'loading') return <LoadingBlock />;

  const revealed = session.state?.revealed.habits === true;

  function place(cardId: string, bin: Bin) {
    void save({ placements: { ...(value?.placements ?? {}), [cardId]: bin } });
  }

  return (
    <div className="flex flex-col gap-4">
      {session.error && <LoadFailure message={session.error} />}
      {isPresenter && !revealed && <RevealControl />}
      <SaveStatus status={status} failed={failed} error={error} hasValue={value !== null} onRetry={() => void retry()} />
      {revealed ? (
        <RevealedList mine={value} busy={busy} onPlace={place} />
      ) : (
        <CardList mine={value} busy={busy} revealed={false} counts={null} onPlace={place} />
      )}
    </div>
  );
}
