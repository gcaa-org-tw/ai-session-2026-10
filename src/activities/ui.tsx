import type { ReactNode } from 'react';
import { copy } from '../content/copy';
import type { EntryStatus } from '../entries/useEntries';

export const buttonBase =
  'rounded-lg border-2 px-3 py-2 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-50';

// eslint-disable-next-line react-refresh/only-export-components
export const optionButton = (selected: boolean): string =>
  selected ? 'is-marked border-ink bg-sheet text-ink' : 'mark-swipe border-grid bg-sheet text-ink';

export const primaryButton =
  'rounded-lg bg-ink px-4 py-2 font-semibold text-white hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50';

export const wrapText = '[overflow-wrap:anywhere]';

export function CountBar({ count, total }: { count: number; total: number }) {
  const share = total === 0 ? 0 : count / total;
  return (
    <span aria-hidden="true" className="mt-1 block h-1 w-full overflow-hidden rounded-full bg-grid-soft">
      <span className="count-bar block h-full w-full bg-ink" style={{ transform: `scaleX(${share})` }} />
    </span>
  );
}

export function LoadingBlock() {
  return (
    <div role="status" className="flex items-center gap-2 text-ink-muted">
      <span aria-hidden="true" className="h-5 w-5 animate-spin rounded-full border-4 border-grid-soft border-t-ink" />
      {copy.states.loading}
    </div>
  );
}

export function LoadFailure({ message }: { message: string }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-2 rounded-lg border border-proof bg-sheet p-3 text-proof">
      <p className="font-kai text-lg font-bold">{copy.states.loadError}</p>
      <p className={`text-sm ${wrapText}`}>{message}</p>
      <button type="button" className={primaryButton} onClick={() => window.location.reload()}>
        {copy.states.reload}
      </button>
    </div>
  );
}

export function EmptyNote() {
  return <p className="text-ink-muted">{copy.states.empty}</p>;
}

interface BoardFrameProps {
  testId: string;
  loading: boolean;
  error: string | null;
  empty: boolean;
  children: ReactNode;
}

export function BoardFrame({ testId, loading, error, empty, children }: BoardFrameProps) {
  let body: ReactNode = children;
  if (error) body = <LoadFailure message={error} />;
  else if (loading) body = <LoadingBlock />;
  else if (empty) body = <EmptyNote />;
  return (
    <div data-testid={testId} className="min-w-0">
      {body}
    </div>
  );
}

interface SaveStatusProps {
  status: EntryStatus;
  failed: 'read' | 'write' | null;
  error: string | null;
  hasValue: boolean;
  onRetry: () => void;
}

export function SaveStatus({ status, failed, error, hasValue, onRetry }: SaveStatusProps) {
  if (status === 'loading' || failed === 'read') return null;
  if (status === 'idle' && !hasValue) return null;
  const isError = failed === 'write';
  let text: string = copy.states.saved;
  if (status === 'saving') text = copy.states.saving;
  if (isError) text = copy.states.saveError;
  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <span data-testid="save-status" role="status" className={isError ? 'text-proof' : 'text-ok'}>
          {text}
        </span>
        {isError && (
          <button type="button" className={primaryButton} onClick={onRetry}>
            {copy.states.retry}
          </button>
        )}
      </div>
      {isError && error && (
        <p role="alert" className={`text-sm text-proof ${wrapText}`}>
          {error}
        </p>
      )}
    </div>
  );
}

interface NameErrorProps {
  error: string | null;
  busy: boolean;
  onRetry: () => void;
}

export function NameError({ error, busy, onRetry }: NameErrorProps) {
  if (!error) return null;
  return (
    <div role="alert" className="flex flex-col items-start gap-2 text-sm text-proof">
      <p className={wrapText}>
        {copy.states.saveError}：{error}
      </p>
      <button type="button" className={primaryButton} disabled={busy} onClick={onRetry}>
        {copy.states.retry}
      </button>
    </div>
  );
}
