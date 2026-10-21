import { useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import type { DocumentReference } from 'firebase/firestore';
import { describeError } from '../auth/useAuth';
import { getFirebase } from '../firebase';

export type PrivateDocId = 'mockRelease' | 'kit' | 'notes' | 'answerKey';

interface PrivateDocState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface Snapshot<T> extends PrivateDocState<T> {
  id: PrivateDocId;
}

function resolveRef(id: PrivateDocId): { ref: DocumentReference } | { initError: string } {
  try {
    return { ref: doc(getFirebase().db, 'private', id) };
  } catch (err) {
    return { initError: describeError(err) };
  }
}

export function usePrivateDoc<T>(id: PrivateDocId): PrivateDocState<T> {
  const init = useMemo(() => resolveRef(id), [id]);
  const [snapshot, setSnapshot] = useState<Snapshot<T> | null>(null);
  const ref = 'ref' in init ? init.ref : null;

  useEffect(() => {
    if (!ref) return undefined;
    return onSnapshot(
      ref,
      (snap) => setSnapshot({ id, data: snap.exists() ? (snap.data() as T) : null, loading: false, error: null }),
      (err) => setSnapshot({ id, data: null, loading: false, error: err.message }),
    );
  }, [ref, id]);

  if ('initError' in init) return { data: null, loading: false, error: init.initError };
  if (!snapshot || snapshot.id !== id) return { data: null, loading: true, error: null };
  return { data: snapshot.data, loading: snapshot.loading, error: snapshot.error };
}
