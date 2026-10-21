import { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import type { DocumentReference } from 'firebase/firestore';
import { describeError } from '../auth/useAuth';
import { getFirebase } from '../firebase';
import type { RaceResults } from '../lib/types';

interface RaceResultsState {
  data: RaceResults | null;
  loading: boolean;
  error: string | null;
}

function resultsRef(): { ref: DocumentReference } | { initError: string } {
  try {
    return { ref: doc(getFirebase().db, 'public', 'raceResults') };
  } catch (err) {
    return { initError: describeError(err) };
  }
}

export function useRaceResults(): RaceResultsState {
  const [init] = useState(resultsRef);
  const [state, setState] = useState<RaceResultsState>({ data: null, loading: true, error: null });
  const ref = 'ref' in init ? init.ref : null;

  useEffect(() => {
    if (!ref) return undefined;
    return onSnapshot(
      ref,
      (snap) => setState({ data: snap.exists() ? (snap.data() as RaceResults) : null, loading: false, error: null }),
      (err) => setState({ data: null, loading: false, error: err.message }),
    );
  }, [ref]);

  if ('initError' in init) return { data: null, loading: false, error: init.initError };
  return state;
}

export async function publishRaceResults(results: RaceResults): Promise<void> {
  await setDoc(doc(getFirebase().db, 'public', 'raceResults'), results);
}
