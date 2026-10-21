import { useCallback, useEffect, useRef, useState } from 'react';
import { describeError } from '../auth/useAuth';
import { saveMyName } from '../entries/useEntries';

const DEBOUNCE_MS = 600;

interface Draft<T> {
  value: T;
  change: (next: T, immediate: boolean) => void;
}

export function useDraft<T extends object>(saved: T | null, empty: T, save: (v: T) => Promise<void>): Draft<T> {
  const [draft, setDraft] = useState<T | null>(null);
  const pending = useRef<T | null>(null);
  const timer = useRef<number | null>(null);
  const saveRef = useRef(save);

  useEffect(() => {
    saveRef.current = save;
  });

  const flush = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    const next = pending.current;
    if (next === null) return;
    pending.current = null;
    void saveRef.current(next);
  }, []);

  const change = useCallback(
    (next: T, immediate: boolean) => {
      setDraft(next);
      pending.current = next;
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = null;
      if (immediate) {
        flush();
        return;
      }
      timer.current = window.setTimeout(flush, DEBOUNCE_MS);
    },
    [flush],
  );

  useEffect(() => flush, [flush]);

  return { value: draft ?? saved ?? empty, change };
}

export function useNameOptIn(): { error: string | null; busy: boolean; remember: () => Promise<void> } {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const remember = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await saveMyName();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  }, []);

  return { error, busy, remember };
}
