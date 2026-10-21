import type { ReactNode } from 'react';
import { copy } from '../content/copy';
import type { EntryStatus } from '../entries/useEntries';

export const buttonBase =
  'rounded-lg border-2 px-3 py-2 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-50';

export const primaryButton =
  'rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50';

export const wrapText = '[overflow-wrap:anywhere]';

export function LoadingBlock() {
  return (
    <div role="status" className="flex items-center gap-2 text-slate-600">
      <span aria-hidden="true" className="h-5 w-5 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-700" />
      {copy.states.loading}
    </div>
  );
}

export function LoadFailure({ message }: { message: string }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-red-800">
      <p className="font-semibold">{copy.states.loadError}</p>
      <p className={`text-sm ${wrapText}`}>{message}</p>
      <button type="button" className={primaryButton} onClick={() => window.location.reload()}>
        {copy.states.reload}
      </button>
    </div>
  );
}

export function EmptyNote() {
  return <p className="text-slate-500">{copy.states.empty}</p>;
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
        <span data-testid="save-status" role="status" className={isError ? 'text-red-700' : 'text-slate-600'}>
          {text}
        </span>
        {isError && (
          <button type="button" className={primaryButton} onClick={onRetry}>
            {copy.states.retry}
          </button>
        )}
      </div>
      {isError && error && (
        <p role="alert" className={`text-sm text-red-700 ${wrapText}`}>
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
    <div role="alert" className="flex flex-col items-start gap-2 text-sm text-red-700">
      <p className={wrapText}>
        {copy.states.saveError}：{error}
      </p>
      <button type="button" className={primaryButton} disabled={busy} onClick={onRetry}>
        {copy.states.retry}
      </button>
    </div>
  );
}
