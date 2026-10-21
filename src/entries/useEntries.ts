import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { describeError } from '../auth/useAuth';
import { getFirebase } from '../firebase';
import type { ActivityId, Owned } from '../lib/types';

export const SAVE_TIMEOUT_MS = 8000;

export type EntryStatus = 'loading' | 'idle' | 'saving' | 'saved' | 'error';

type SaveStatus = Exclude<EntryStatus, 'loading'>;

interface MyEntry<T> {
  value: T | null;
  status: EntryStatus;
  failed: 'read' | 'write' | null;
  error: string | null;
  save: (v: T) => Promise<void>;
  retry: () => Promise<void>;
}

function currentUid(): string {
  const user = getFirebase().auth.currentUser;
  if (!user) throw new Error('尚未登入');
  return user.uid;
}

function myEntryRef(activity: ActivityId) {
  return doc(getFirebase().db, 'entries', activity, 'users', currentUid());
}

type Resolved<R> = { ref: R } | { initError: string };

function resolve<R>(make: () => R): Resolved<R> {
  try {
    return { ref: make() };
  } catch (err) {
    return { initError: describeError(err) };
  }
}

export function useMyEntry<T extends object>(activity: ActivityId): MyEntry<T> {
  const [init] = useState(() => resolve(() => myEntryRef(activity)));
  const [value, setValue] = useState<T | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const lastValue = useRef<T | null>(null);
  const attempt = useRef(0);
  const ref = 'ref' in init ? init.ref : null;

  useEffect(() => {
    if (!ref) return undefined;
    return onSnapshot(
      ref,
      (snap) => {
        setReadError(null);
        setValue(snap.exists() ? (snap.data() as T) : null);
        setLoaded(true);
      },
      (err) => {
        setReadError(err.message);
        setLoaded(true);
      },
    );
  }, [ref]);

  const save = useCallback(
    async (v: T): Promise<void> => {
      if (!ref) return;
      lastValue.current = v;
      const mine = ++attempt.current;
      setSaveStatus('saving');
      setSaveError(null);
      const timer = window.setTimeout(() => {
        if (attempt.current !== mine) return;
        setSaveStatus('error');
        setSaveError('連線逾時，尚未確認儲存。');
      }, SAVE_TIMEOUT_MS);
      try {
        await setDoc(ref, v);
        if (attempt.current !== mine) return;
        setSaveStatus('saved');
        setSaveError(null);
      } catch (err) {
        if (attempt.current !== mine) return;
        setSaveStatus('error');
        setSaveError(describeError(err));
      } finally {
        window.clearTimeout(timer);
      }
    },
    [ref],
  );

  const retry = useCallback(async (): Promise<void> => {
    if (lastValue.current === null) return;
    await save(lastValue.current);
  }, [save]);

  if ('initError' in init) {
    return { value: null, status: 'error', failed: 'read', error: init.initError, save, retry };
  }
  if (readError) return { value, status: 'error', failed: 'read', error: readError, save, retry };
  if (!loaded) return { value, status: 'loading', failed: null, error: null, save, retry };
  return { value, status: saveStatus, failed: saveStatus === 'error' ? 'write' : null, error: saveError, save, retry };
}

export function useAllEntries<T extends object>(
  activity: ActivityId,
): { entries: Owned<T>[]; loading: boolean; error: string | null } {
  const init = useMemo(() => resolve(() => collection(getFirebase().db, 'entries', activity, 'users')), [activity]);
  const [entries, setEntries] = useState<Owned<T>[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const col = 'ref' in init ? init.ref : null;

  useEffect(() => {
    if (!col) return undefined;
    return onSnapshot(
      col,
      (snap) => {
        setError(null);
        setEntries(snap.docs.map((d) => ({ uid: d.id, value: d.data() as T })));
        setLoaded(true);
      },
      (err) => {
        setError(err.message);
        setLoaded(true);
      },
    );
  }, [col]);

  if ('initError' in init) return { entries: [], loading: false, error: init.initError };
  return { entries, loading: !loaded, error };
}

export async function saveMyName(): Promise<void> {
  const { auth, db } = getFirebase();
  const user = auth.currentUser;
  if (!user) throw new Error('尚未登入');
  const fallback = user.email?.split('@')[0] ?? '';
  const displayName = user.displayName?.trim() || fallback;
  await setDoc(doc(db, 'names', user.uid), { displayName });
}

export function useNames(): { names: Record<string, string>; loading: boolean; error: string | null } {
  const [init] = useState(() => resolve(() => collection(getFirebase().db, 'names')));
  const [names, setNames] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const col = 'ref' in init ? init.ref : null;

  useEffect(() => {
    if (!col) return undefined;
    return onSnapshot(
      col,
      (snap) => {
        setError(null);
        const next: Record<string, string> = {};
        for (const d of snap.docs) {
          const name = d.data().displayName;
          if (typeof name === 'string') next[d.id] = name;
        }
        setNames(next);
        setLoaded(true);
      },
      (err) => {
        setError(err.message);
        setLoaded(true);
      },
    );
  }, [col]);

  if ('initError' in init) return { names: {}, loading: false, error: init.initError };
  return { names, loading: !loaded, error };
}
